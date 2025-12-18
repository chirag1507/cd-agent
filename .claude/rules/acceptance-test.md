# Acceptance Tests (Four-Layer Model)

> Apply when writing system-level acceptance tests using Dave Farley's Four-Layer Model.

## Purpose

Create Executable Specifications that verify business behavior through the complete system, written BEFORE implementation code.

## The Four-Layer Model (Dave Farley)

```
┌─────────────────────────────────────────────────────────────┐
│         TEST CASES (Executable Specifications)              │
│  Written in problem-domain language                         │
│  From perspective of external user                          │
├─────────────────────────────────────────────────────────────┤
│              DOMAIN SPECIFIC LANGUAGE (DSL)                 │
│  Shared between test cases                                  │
│  Optional parameters for precision where needed             │
│  Domain concepts only - no HOW, only WHAT                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Protocol   │  │   Protocol   │  │  External System │   │
│  │    Driver    │  │    Driver    │  │      Stubs       │   │
│  │    (UI)      │  │    (API)     │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   SYSTEM UNDER TEST (SUT)                   │
│  Deployed using same tools as production                    │
│  Production-like environment                                │
└─────────────────────────────────────────────────────────────┘
```

## Properties of Effective Acceptance Tests

1. **Written from external user perspective**
2. **Evaluate system in life-like scenarios**
3. **Run in production-like environments**
4. **Interact through public interfaces only** (no back-door access)
5. **Focus on WHAT, not HOW**

## Layer 1: Test Cases (Executable Specifications)

Test Cases are written in the language of the problem domain.

### The Litmus Test

> Imagine the least technical person who understands the problem-domain reading your tests. They should make sense.

> Imagine throwing your SUT away and replacing it completely. Your tests should still make sense.
> e.g., Could your Amazon book-buying tests work for a robot in a physical bookstore?

### Non-Negotiable Rules

**DO:**
- Use problem-domain language exclusively
- Make scenarios atomic (no shared test data)
- Start each test assuming a running system with no data
- Say things like `placeAnOrder`, `payByCreditCard`

**DON'T:**
- Say "fill in this field" or "click this button"
- Reference UI elements, CSS selectors, or HTML
- Share test data between test cases
- Include implementation details

### Example Test Case

```typescript
// GOOD: Domain language, external user perspective
@Test
@Channel(Amazon)
public void shouldBuyBookWithCreditCard() {
  shopping.goToStore();

  shopping.searchForBook("title: Continuous Delivery");
  shopping.selectBook("author: David Farley");

  shopping.addSelectedItemToShoppingBasket();

  shopping.checkOut("item: Continuous Delivery");

  shopping.assertItemPurchased("item: Continuous Delivery");
}

// BAD: Implementation details, UI-focused
@Test
public void testPurchaseFlow() {
  driver.get("https://amazon.com");
  driver.findElement(By.id("search-box")).sendKeys("Continuous Delivery");
  driver.findElement(By.className("search-btn")).click();
  // ... more Selenium details
}
```

### With Gherkin (Optional)

```gherkin
Feature: Book Purchase
  As a customer
  I want to buy books online
  So that I can receive them at home

  Scenario: Buy book with credit card
    Given I am at the store
    When I search for book "Continuous Delivery"
    And I select book by author "David Farley"
    And I add selected item to shopping basket
    And I check out with item "Continuous Delivery"
    Then item "Continuous Delivery" should be purchased
```

## Layer 2: Domain Specific Language (DSL)

The DSL is shared between test cases and makes writing tests easy.

### Principles

- **Optional parameters for everything** - precision where needed, defaults elsewhere
- **Encode common startup tasks** - registering users, populating accounts
- **Domain concepts only** - clean from HOW the system works

### Example DSL

```typescript
export class ShoppingDSL {
  constructor(private driver: ShoppingDriver) {}

  async goToStore(): Promise<void> {
    await this.driver.navigateToStore();
  }

  async searchForBook(...args: string[]): Promise<void> {
    const params = new Params(args);
    const title = params.optional("title", "any book");
    await this.driver.searchForBook(title);
  }

  async selectBook(...args: string[]): Promise<void> {
    const params = new Params(args);
    const author = params.optional("author", undefined);
    const title = params.optional("title", undefined);
    await this.driver.selectBook({ author, title });
  }

  async checkOut(...args: string[]): Promise<void> {
    const params = new Params(args);
    const item = params.optional("item", "Continuous Delivery");
    const price = params.optional("price", "£10.00");
    const card = parseCard(params.optional("card", "1234 5678 9101 0001 12/23 007"));

    await this.driver.checkOut(item, price, card);
  }

  async assertItemPurchased(...args: string[]): Promise<void> {
    const params = new Params(args);
    const item = params.required("item");
    await this.driver.assertItemPurchased(item);
  }
}
```

## Test Data Builders

Use builders to create test data with sensible defaults, allowing customization only where needed.

### Builder Pattern

```typescript
// drivers/web/pages/builder/registration-details.builder.ts
export class RegistrationDetailsBuilder {
  private firstName: string = 'Test';
  private lastName: string = 'User';
  private companyName: string = 'Test Company';
  private companyRole: string = 'Developer';
  private teamSize: string = '1-10';
  private email: string = `test.user+${Date.now()}@example.com`;

  // Factory method for fluent API
  static aRegistration(): RegistrationDetailsBuilder {
    return new RegistrationDetailsBuilder();
  }

  withEmail(email: string): RegistrationDetailsBuilder {
    this.email = email;
    return this;
  }

  withFirstName(firstName: string): RegistrationDetailsBuilder {
    this.firstName = firstName;
    return this;
  }

  build(): RegistrationDetails {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      companyName: this.companyName,
      companyRole: this.companyRole,
      teamSize: this.teamSize,
      email: this.email,
    };
  }
}

// Usage in tests or DSL
const details = RegistrationDetailsBuilder.aRegistration()
  .withEmail('custom@example.com')
  .build();
```

### Builder Principles

- Sensible defaults for all properties
- Static factory method for fluent API
- Unique identifiers (timestamps) to avoid collisions
- Only customize what matters for the test

## Layer 3: Protocol Drivers

Protocol Drivers are translators/adaptors from DSL to "language of the system".

### Principles

- **Mirror DSL interface** - `dsl.checkOut` → `driver.checkOut`
- **More specific parameters** - DSL parses, Driver executes
- **One per channel** - UI driver, API driver, etc.
- **Isolate ALL system knowledge here**
- **Use page objects** - Delegate UI interactions to page objects
- **Use services** - Inject shared services for state management

### Example Protocol Driver (UI with Page Objects)

```typescript
export class RegistrationWebDriver implements RegistrationDriver {
  private readonly signUpPage: SignupPage;

  constructor(
    private readonly page: Page,
    private readonly userService: UserService,
    private readonly stubService: StubService
  ) {
    // Use factory pattern for page object creation
    this.signUpPage = PageFactory.createSignupPage(page);
  }

  // Validation/setup (back-door access)
  async validateUserIsNotRegistered(email: string): Promise<void> {
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users/${email}`);
    if (response.status() !== 404) {
      throw new Error(`User already exists`);
    }
  }

  // User interactions (delegates to page objects)
  async provideRegistrationDetails(details: RegistrationDetails): Promise<void> {
    await this.signUpPage.fillRegistrationForm(details);
  }

  async completeRegistration(): Promise<void> {
    // Capture network response while interacting with UI
    const token = await this.signUpPage.executeRegistration();
    this.userService.setToken(token);
  }

  // Assertions (delegates to page objects)
  async getErrorMessages(): Promise<string[]> {
    return await this.signUpPage.getErrorMessage();
  }

  async verifyAccountExists(): Promise<boolean> {
    const token = this.userService.getToken();
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status() === 200;
  }

  // Back-door setup for test data
  async createTestUser(details: RegistrationDetails): Promise<void> {
    await this.stubService.simulateGitHubAuthProviderSuccess(details.email);
    await this.userService.registerAndTrackUser(details);
  }
}
```

### Example Protocol Driver (API)

```typescript
export class ShoppingAPIDriver implements ShoppingDriver {
  constructor(private httpClient: HttpClient) {}

  async searchForBook(title: string): Promise<void> {
    this.searchResults = await this.httpClient.get(`/api/books?title=${title}`);
  }

  async checkOut(item: string, price: string, card: CardDetails): Promise<void> {
    await this.httpClient.post("/api/orders", {
      item,
      price,
      paymentMethod: { type: "credit_card", ...card }
    });
  }
}
```

## External System Stubs with Scenarist

We use [Scenarist](https://scenarist.io/) to mock external systems in acceptance tests.

### What to Stub (via Scenarist)

- Email services (SendGrid, Mailgun)
- Payment gateways (Stripe, PayPal)
- Third-party APIs (OAuth, geocoding)
- SMS/notifications (Twilio)
- Any external HTTP dependencies

### What to Keep Real

- Database (test instance)
- File storage (test bucket)
- Message queues (test queue)
- Internal services

### Scenarist Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCENARIST SETUP                              │
├─────────────────────────────────────────────────────────────────┤
│  scenarios/                                                      │
│  ├── scenario-ids.enum.ts     # All scenario IDs                │
│  └── github-oauth.scenarios.ts # Scenario definitions           │
├─────────────────────────────────────────────────────────────────┤
│  drivers/web/services/                                           │
│  └── scenarist.service.ts     # Scenario switching service      │
├─────────────────────────────────────────────────────────────────┤
│  Protocol Drivers use ScenaristService to switch scenarios      │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Define Scenario IDs

```typescript
// scenarios/scenario-ids.enum.ts
export enum ScenarioId {
  DEFAULT = 'default',
  GITHUB_OAUTH_SUCCESS = 'github-oauth-success',
  GITHUB_OAUTH_FAILURE = 'github-oauth-failure',
  GITHUB_OAUTH_TOKEN_EXCHANGE_FAIL = 'github-oauth-token-exchange-fail',
  GITHUB_OAUTH_INVALID_TOKEN = 'github-oauth-invalid-token',
  GITHUB_OAUTH_PROFILE_RETRIEVAL_FAIL = 'github-oauth-profile-retrieval-fail',
  GITHUB_OAUTH_SERVICE_UNAVAILABLE = 'github-oauth-service-unavailable',
  PAYMENT_SUCCESS = 'payment-success',
  PAYMENT_DECLINED = 'payment-declined',
}
```

### Step 2: Define Scenarios

```typescript
// scenarios/github-oauth.scenarios.ts
import { ScenarioId } from './scenario-ids.enum';

export interface ScenaristScenario {
  id: ScenarioId;
  name: string;
  description: string;
  mocks: ScenaristMock[];
}

export interface ScenaristMock {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  response: {
    status: number;
    body: unknown;
  };
}

export const githubOAuthSuccess: ScenaristScenario = {
  id: ScenarioId.GITHUB_OAUTH_SUCCESS,
  name: 'GitHub OAuth - Success',
  description: 'GitHub OAuth token exchange and user profile retrieval succeed',
  mocks: [
    // Step 1: Exchange OAuth code for access token
    {
      method: 'POST',
      url: 'https://github.com/login/oauth/access_token',
      response: {
        status: 200,
        body: {
          access_token: 'gho_mock_access_token_1234567890',
          token_type: 'bearer',
          scope: 'user:email',
        },
      },
    },
    // Step 2: Get user profile with access token
    {
      method: 'GET',
      url: 'https://api.github.com/user',
      response: {
        status: 200,
        body: {
          id: 123456,
          login: 'testuser',
          email: 'testuser@example.com',
          name: 'Test User',
        },
      },
    },
  ],
};

export const githubOAuthFailure: ScenaristScenario = {
  id: ScenarioId.GITHUB_OAUTH_FAILURE,
  name: 'GitHub OAuth - Failure',
  description: 'GitHub OAuth flow fails completely',
  mocks: [
    {
      method: 'POST',
      url: 'https://github.com/login/oauth/access_token',
      response: {
        status: 401,
        body: { error: 'bad_verification_code' },
      },
    },
  ],
};
```

### Step 3: Create Scenarist Service

```typescript
// drivers/web/services/scenarist.service.ts
import { ScenaristScenario } from '@scenarios/github-oauth.scenarios';

export class ScenaristService {
  constructor(
    private readonly baseUrl: string = process.env.SCENARIST_URL || 'http://localhost:8080'
  ) {}

  async switchToScenario(scenario: ScenaristScenario): Promise<void> {
    const response = await fetch(`${this.baseUrl}/scenarios/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: scenario.id,
        mocks: scenario.mocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to switch to scenario ${scenario.id}: ${response.status}`);
    }
  }

  async reset(): Promise<void> {
    await fetch(`${this.baseUrl}/scenarios/reset`, { method: 'POST' });
  }
}
```

### Step 4: Use in Protocol Drivers

```typescript
// drivers/web/auth-web-driver.ts
import { AuthDriver } from '../interface/auth-driver.interface';
import { ScenaristService } from './services/scenarist.service';
import { githubOAuthSuccess, githubOAuthFailure } from '@scenarios/github-oauth.scenarios';

export class AuthWebDriver implements AuthDriver {
  constructor(
    private readonly page: Page,
    private readonly scenaristService: ScenaristService
  ) {}

  async authenticate(email: string): Promise<boolean> {
    // Switch to success scenario BEFORE triggering OAuth flow
    await this.scenaristService.switchToScenario(githubOAuthSuccess);
    return await this.signUpPage.authenticateWithGitHub();
  }

  async gitHubAuthenticationFailed(): Promise<void> {
    // Switch to failure scenario
    await this.scenaristService.switchToScenario(githubOAuthFailure);
    await this.signUpPage.continueWithGitHub();
  }
}
```

### Step 5: Wire Up in World/Support

```typescript
// support/world.ts
import { ScenaristService } from '@drivers/web/services/scenarist.service';

export class CustomWorld extends World {
  private scenaristService!: ScenaristService;

  async init(): Promise<void> {
    this.scenaristService = new ScenaristService();

    // Inject into drivers
    this.authDSL = new AuthDSL(
      new AuthWebDriver(this.page, this.scenaristService)
    );
  }

  async cleanup(): Promise<void> {
    await this.scenaristService.reset();
  }
}
```

### Scenario Organization Pattern

Group scenarios by external system:

```
scenarios/
├── scenario-ids.enum.ts          # Central enum for all IDs
├── github-oauth.scenarios.ts     # GitHub OAuth scenarios
├── stripe-payment.scenarios.ts   # Stripe payment scenarios
├── sendgrid-email.scenarios.ts   # SendGrid email scenarios
└── index.ts                      # Re-exports all scenarios
```

### Assertion Philosophy: User-Visible Outcomes

**Do NOT assert on external system calls.** This couples tests to implementation details.

```typescript
// ❌ BAD: Coupling to external system implementation
async assertPaymentProcessed(amount: string): Promise<void> {
  const calls = await this.scenaristService.getCalls(ScenarioId.PAYMENT_SUCCESS);
  // This tests HOW the system works, not WHAT the user sees
}

// ✅ GOOD: Assert what the user experiences
async assertOrderConfirmationDisplayed(): Promise<void> {
  await this.driver.verifyOrderConfirmationVisible();
}

async assertPaymentDeclinedMessageShown(): Promise<void> {
  await this.driver.verifyErrorMessage("Payment declined");
}
```

**Scenarist's role**: Control external system behavior (success/failure scenarios)
**Test's role**: Assert user-visible outcomes resulting from that behavior

## Page Objects

Page Objects encapsulate UI interaction details, providing a clean API for drivers.

### Page Object Pattern

```typescript
// drivers/web/pages/signup.page.ts
export class SignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation methods
  async navigateToAuthPage(): Promise<boolean> {
    const response = await this.page.goto(`${CONFIG.baseUrl}/auth`);
    expect(response?.ok()).toBe(true);
    return response?.ok() ?? false;
  }

  async authenticateWithGitHub(): Promise<boolean> {
    await this.continueWithGitHub();
    await this.page.waitForURL(/\/onboarding\/register/);
    return true;
  }

  // Form interaction methods
  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.page.getByTestId('firstName-input').fill(details.firstName);
    await this.page.getByTestId('lastName-input').fill(details.lastName);
    await this.page.getByTestId('companyName-input').fill(details.companyName);

    if (details.companyRole) {
      await this.page.getByTestId('companyRole-select').click();
      await this.page.getByRole('option', { name: details.companyRole }).click();
    }

    if (details.teamSize) {
      await this.page.getByTestId('teamSize-select').click();
      await this.page.getByRole('option', { name: details.teamSize }).click();
    }
  }

  // Action methods with network capture
  async executeRegistration(): Promise<string> {
    const [responseData] = await Promise.all([
      this.captureNetworkResponse('register'),
      this.page.getByTestId('submit-button').click(),
    ]);
    await this.waitForPageLoad();
    return responseData.token;
  }

  // Assertion methods
  async getErrorMessage(): Promise<string[]> {
    const errorTestIds = [
      'firstName-error',
      'lastName-error',
      'email-error',
      'companyName-error',
      'companyRole-error',
      'teamSize-error',
    ];

    const errorMessages = await Promise.all(
      errorTestIds.map(async (testId) => {
        try {
          const element = this.page.getByTestId(testId);
          await element.waitFor({
            state: 'visible',
            timeout: CONFIG.stateUpdateTimeout,
          });
          const text = await element.textContent();
          return text;
        } catch {
          return null;
        }
      })
    );

    return errorMessages.filter(
      (message): message is string => message !== null && message.trim() !== ''
    );
  }
}
```

### Page Object Principles

- One page object per page/screen
- Extends BasePage for shared functionality (network capture, waiting)
- Methods correspond to user actions and assertions
- Use `data-testid` for element selection (semantic)
- Return domain models, not Playwright elements
- Network response capture for state extraction

### PageFactory Pattern

```typescript
// drivers/web/pages/page.factory.ts
export class PageFactory {
  static createSignupPage(page: Page): SignupPage {
    return new SignupPage(page);
  }

  static createAddProjectPage(page: Page): AddProjectPage {
    return new AddProjectPage(page);
  }

  static createDashboardPage(page: Page): DashboardPage {
    return new DashboardPage(page);
  }
}
```

**Purpose**: Centralize page object creation for easier refactoring.

## Supporting Services

### UserService (Test Data Tracking)

Tracks created test data for cleanup after tests.

```typescript
// drivers/web/services/user.service.ts
export class UserService {
  private token?: string;
  private userId?: string;
  private createdProjectIds: string[] = [];

  constructor(private readonly page: Page) {}

  // Token management
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | undefined {
    return this.token;
  }

  async setTokenInLocalStorage(token: string): Promise<void> {
    await this.page.evaluate((value) => {
      localStorage.setItem('auth-token', value);
    }, token);
  }

  // Track created resources
  trackCreatedProjectId(projectId: string): void {
    this.createdProjectIds.push(projectId);
  }

  // Create test user via API (back-door)
  async registerAndTrackUser(details: RegistrationDetails): Promise<void> {
    const response = await this.page.request.post(`${CONFIG.apiUrl}/register`, {
      data: { ...details, providerId: '123' },
    });
    if (response.status() !== 201) {
      throw new Error(`Failed to create test user`);
    }
    const data = await response.json();
    this.userId = data.userId;
    this.token = data.token;
  }

  // Cleanup all created resources
  async cleanupAllTrackedData(): Promise<void> {
    if (this.token) {
      try {
        await this.cleanupCreatedProjects();
        await this.deleteUser();
      } finally {
        this.token = undefined;
        this.userId = undefined;
        this.createdProjectIds = [];
      }
    }
  }

  private async cleanupCreatedProjects(): Promise<void> {
    for (const projectId of this.createdProjectIds) {
      await this.page.request.delete(`${CONFIG.apiUrl}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
    }
  }

  private async deleteUser(): Promise<void> {
    await this.page.request.delete(`${CONFIG.apiUrl}/users/${this.userId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
```

### StubService (External System Simulation)

Controls external system behavior via stub/mock API.

```typescript
// drivers/web/services/stub.service.ts
export class StubService {
  constructor(private readonly page: Page) {}

  async simulateGitHubAuthProviderSuccess(email: string): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-auth`,
      {
        data: {
          state: {
            success: true,
            data: { email },
          },
        },
      }
    );
    if (response.status() !== 200) {
      throw new Error(`Failed to setup GitHub auth provider stub`);
    }
  }

  async simulateGitHubAuthProviderFailure(): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-auth`,
      {
        data: { state: { success: false } },
      }
    );
    if (response.status() !== 200) {
      throw new Error(`Failed to fail GitHub authentication`);
    }
  }
}
```

## World Configuration (Dependency Injection)

Wire up all DSLs, drivers, and services in the Cucumber World.

```typescript
// support/world.ts
import { setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // DSL instances
  registrationDSL!: RegistrationDSL;
  authDSL!: AuthDSL;
  projectDSL!: ProjectDSL;

  // Shared services
  private sharedUserService?: UserService;
  private sharedStubService?: StubService;

  async init(): Promise<void> {
    // Launch browser
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.HEADLESS !== 'false' ? 0 : 500,
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    this.page = await this.context.newPage();

    // Create shared services
    this.sharedUserService = new UserService(this.page);
    this.sharedStubService = new StubService(this.page);

    // Wire up DSLs with drivers
    this.registrationDSL = new RegistrationDSL(
      new RegistrationWebDriver(
        this.page,
        this.sharedUserService,
        this.sharedStubService
      )
    );
    this.authDSL = new AuthDSL(
      new AuthWebDriver(
        this.page,
        this.sharedStubService,
        this.sharedUserService
      )
    );
    // ... more DSLs
  }

  async cleanup(): Promise<void> {
    await this.cleanupTestData();
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  private async cleanupTestData(): Promise<void> {
    if (this.sharedUserService) {
      await this.sharedUserService.cleanupAllTrackedData();
    }
  }
}

setWorldConstructor(CustomWorld);
```

### Dependency Injection Pattern

```
┌─────────────────────────────────────────────────────────┐
│                         WORLD                            │
│  - Creates shared services (UserService, StubService)    │
│  - Wires DSLs with drivers                               │
│  - Manages lifecycle (init, cleanup)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                          DSL                             │
│  - Receives driver instance                              │
│  - Domain language methods                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                        DRIVER                            │
│  - Receives: Page, UserService, StubService              │
│  - Creates page objects via PageFactory                  │
│  - Delegates UI interactions to page objects             │
│  - Uses services for state management                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     PAGE OBJECTS                         │
│  - Encapsulate UI interaction details                    │
│  - Return domain models                                  │
└─────────────────────────────────────────────────────────┘
```

## Growing the DSL

1. **Start pragmatically** - create 2-3 simple tests for most common behavior
2. **Create infrastructure** - make tests execute and pass
3. **Discipline** - new Acceptance Test for every Acceptance Criteria
4. **Invent language as needed** - don't worry about implementation first
5. **Devs own the tests** - QA/BA/PO can write test cases, Devs own DSL and Drivers

## Directory Structure

```
<project>-system-tests/
├── features/                    # Gherkin feature files
│   ├── shopping.feature
│   └── registration.feature
├── step_definitions/            # Cucumber step definitions
│   ├── shopping.steps.ts
│   └── registration.steps.ts
├── dsl/                         # Domain Specific Language
│   ├── shopping.dsl.ts
│   ├── registration.dsl.ts
│   ├── models/                  # Domain models and fixtures
│   │   ├── registration-details.ts
│   │   └── repository.fixture.ts
│   └── params.ts                # Parameter parsing utilities
├── drivers/
│   ├── interface/               # Driver contracts
│   │   ├── shopping-driver.interface.ts
│   │   └── registration-driver.interface.ts
│   └── web/                     # UI Protocol Drivers
│       ├── shopping-web-driver.ts
│       ├── registration-web-driver.ts
│       ├── pages/               # Page Objects
│       │   ├── base.page.ts
│       │   ├── signup.page.ts
│       │   ├── shopping.page.ts
│       │   ├── page.factory.ts
│       │   └── builder/         # Test Data Builders
│       │       ├── registration-details.builder.ts
│       │       └── order-details.builder.ts
│       └── services/            # Supporting Services
│           ├── user.service.ts
│           └── stub.service.ts
├── scenarios/                   # Scenarist scenarios (if using)
│   ├── scenario-ids.enum.ts
│   ├── github-oauth.scenarios.ts
│   └── stripe-payment.scenarios.ts
└── support/
    ├── config.ts
    ├── world.ts                 # Cucumber World (DI container)
    └── hooks.ts
```

## Key Insight: ATDD + TDD

> The combination of Acceptance Tests and TDD results in reductions in defects of often two orders-of-magnitude.

1. Write Acceptance Test (Executable Specification) FIRST
2. Use fine-grained TDD to implement code that meets the specification
3. Acceptance Test guides and organizes work until specification is met
