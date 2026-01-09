---
description: Implement Protocol Driver for acceptance tests
argument-hint: [driver type: ui, api, or specific channel]
---

# Implement Protocol Driver

$ARGUMENTS

(If no input provided, check conversation context for the driver to implement)

## CRITICAL: Mandatory Rule Loading

⚠️ **BEFORE PROCEEDING, YOU MUST:**

1. **Read ALL required rule files** (use multiple Read tool calls in parallel)
2. **Confirm rules are loaded** (brief acknowledgment)
3. **Follow rules strictly** (non-negotiable)

**Required Rules:**
- `.claude/rules/acceptance-test.md` - Four-Layer Model and Protocol Driver patterns
- `.claude/rules/test-flakiness.md` - Preventing flaky tests (critical for reliability)
- `.claude/rules/code-style.md` - Code style and comment rules

**ACTION REQUIRED**: Use Read tool to load these files NOW.

**If you cannot read the rule files, STOP and notify the user.**

---

### Mandatory Checkpoint: Confirm Rules Loaded

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Rules Read:
- acceptance-test.md
- test-flakiness.md
- code-style.md

Proceeding with strict rule compliance for Protocol Driver implementation.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

## Purpose

Implement Layer 3 of Dave Farley's Four-Layer Model - **Protocol Drivers** that translate from DSL to the "language of the system".

```
┌─────────────────────────────────────────────────────────────┐
│         TEST CASES (Executable Specifications)              │
├─────────────────────────────────────────────────────────────┤
│              DOMAIN SPECIFIC LANGUAGE (DSL)                 │
├─────────────────────────────────────────────────────────────┤
│  Protocol Drivers  │  Protocol Drivers  │  Scenarist Stubs  │  ◀── YOU ARE HERE
│  (UI)              │  (API)             │  (External Sys)   │
├─────────────────────────────────────────────────────────────┤
│                   SYSTEM UNDER TEST (SUT)                   │
└─────────────────────────────────────────────────────────────┘
```

## Protocol Driver Principles (Non-Negotiable)

**For preventing flaky tests**, see [test-flakiness.md](../rules/test-flakiness.md) - follow strict patterns to avoid race conditions, timing issues, and brittle selectors.

1. **Translators/Adaptors** - from DSL to system language
2. **Mirror DSL interface** - `dsl.checkOut()` → `driver.checkOut()`
3. **More specific parameters** - DSL parses, driver uses concrete values
4. **One per channel** - UI driver, API driver, mobile driver, etc.
5. **Isolate ALL system knowledge** - URLs, selectors, API endpoints
6. **CRITICAL: Use production routes for actions, back-doors for setup/verification** - See decision matrix below

## CRITICAL: Production Routes vs Back-door Routes (Dave Farley)

> "Test through the public interface, but use back-doors for setup and verification" - Dave Farley

**Decision Matrix:**

| Test Phase        | Use Production Routes             | Use Test Routes (Back-door)        |
|-------------------|-----------------------------------|------------------------------------|
| Given (Setup)     | Optional - if testing setup flow  | ✅ Recommended - for efficiency    |
| When (Actions)    | ✅ REQUIRED - Must test real flow | ❌ NEVER - Defeats purpose         |
| Then (Assertions) | ✅ For user-visible outcomes      | ✅ For internal state verification |
| Cleanup           | ❌ No                             | ✅ Yes - efficiency                |

**✅ Use PRODUCTION Routes For:**

Core test actions (When steps) - The behavior you're actually testing:

```typescript
// ✅ CORRECT: Testing registration through PRODUCTION route
async registerUser(data: RegistrationData): Promise<void> {
  // Uses real UI → production /api/auth/register endpoint
  await this.registrationPage.fillRegistrationForm(data);
  await this.registrationPage.submitForm(); // Calls PRODUCTION route
}
```

**✅ Use TEST Routes (Back-door) For:**

Setup, verification, and cleanup:

```typescript
// ✅ CORRECT: Back-door for setup
async createExistingUser(email: string): Promise<void> {
  await this.userService.registerAndTrackUser({ email, password: 'test123' });
}

// ✅ CORRECT: Back-door for internal state verification
async getUserRole(email: string): Promise<string | null> {
  const response = await this.page.request.get(
    `${CONFIG.apiUrl}/test-support/users/${email}/role`
  );
  return (await response.json()).role;
}

// ✅ CORRECT: Back-door for cleanup
async cleanup(): Promise<void> {
  await this.userService.cleanupAllTrackedData();
}
```

**❌ ANTI-PATTERN:**

```typescript
// ❌ WRONG: Using test route for the action being tested
async registerUser(data: RegistrationData): Promise<void> {
  // This bypasses production logic - you're NOT testing the real system!
  await this.page.request.post(`${CONFIG.apiUrl}/test-support/create-user`, { data });
}
```

**Driver Organization Pattern:**

```typescript
export class AccountWebDriver implements AccountDriver {
  // ============================================
  // ACTIONS (Use PRODUCTION routes)
  // ============================================
  async registerUser(data: RegistrationData): Promise<void> {
    await this.registrationPage.fillRegistrationForm(data);
    await this.registrationPage.submitForm(); // → PRODUCTION /api/auth/register
  }

  // ============================================
  // SETUP (Use BACK-DOOR for efficiency)
  // ============================================
  async createExistingUser(email: string): Promise<void> {
    await this.userService.registerAndTrackUser({ email }); // → TEST /api/test-support
  }

  // ============================================
  // VERIFICATIONS (Use BACK-DOOR for internal state)
  // ============================================
  async getUserRole(email: string): Promise<string | null> {
    return await this.userService.getUserRole(email); // → TEST /api/test-support
  }

  // ============================================
  // CLEANUP (Use BACK-DOOR)
  // ============================================
  async cleanup(): Promise<void> {
    await this.userService.cleanupAllTrackedData();
  }
}
```

## Driver Interface (Define First)

```typescript
// drivers/interfaces/shopping.driver.ts
export interface ShoppingDriver {
  // Navigation
  navigateToStore(): Promise<void>;

  // Actions
  searchForBook(criteria: { title?: string; author?: string }): Promise<void>;
  selectBook(criteria: { author?: string; title?: string }): Promise<void>;
  addToCart(item: string): Promise<void>;
  checkOut(details: CheckoutDetails): Promise<void>;
  attemptCheckOut(item: string): Promise<CheckoutResult>;

  // Verification
  verifyItemPurchased(item: string): Promise<boolean>;
  getNotification(): Promise<string>;

  // Test support
  registerUser(details: UserDetails): Promise<void>;
  cleanup(): Promise<void>;
}

export interface CheckoutDetails {
  item: string;
  price: string;
  card: CardDetails;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
}
```

## Page Objects and Services

UI Protocol Drivers should delegate to **page objects** for UI interactions and use **services** for shared state management.

### Page Object Pattern

```typescript
// drivers/web/pages/signup.page.ts
export class SignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.page.getByTestId('firstName-input').fill(details.firstName);
    await this.page.getByTestId('lastName-input').fill(details.lastName);
    await this.page.getByTestId('email-input').fill(details.email);
  }

  async executeRegistration(): Promise<string> {
    // Capture network response while clicking submit
    const [responseData] = await Promise.all([
      this.captureNetworkResponse('register'),
      this.page.getByTestId('submit-button').click(),
    ]);
    await this.waitForPageLoad();
    return responseData.token;
  }

  async getErrorMessage(): Promise<string[]> {
    const errorTestIds = ['firstName-error', 'lastName-error', 'email-error'];
    const errorMessages = await Promise.all(
      errorTestIds.map(async (testId) => {
        try {
          const element = this.page.getByTestId(testId);
          await element.waitFor({ state: 'visible', timeout: 1000 });
          return await element.textContent();
        } catch {
          return null;
        }
      })
    );
    return errorMessages.filter((msg): msg is string => msg !== null && msg.trim() !== '');
  }
}
```

### PageFactory Pattern

```typescript
// drivers/web/pages/page.factory.ts
export class PageFactory {
  static createSignupPage(page: Page): SignupPage {
    return new SignupPage(page);
  }

  static createDashboardPage(page: Page): DashboardPage {
    return new DashboardPage(page);
  }
}
```

### UserService (Test Data Tracking)

```typescript
// drivers/web/services/user.service.ts
export class UserService {
  private token?: string;
  private userId?: string;
  private createdProjectIds: string[] = [];

  constructor(private readonly page: Page) {}

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | undefined {
    return this.token;
  }

  trackCreatedProjectId(projectId: string): void {
    this.createdProjectIds.push(projectId);
  }

  async registerAndTrackUser(details: RegistrationDetails): Promise<void> {
    const response = await this.page.request.post(`${CONFIG.apiUrl}/register`, {
      data: details,
    });
    const data = await response.json();
    this.userId = data.userId;
    this.token = data.token;
  }

  async cleanupAllTrackedData(): Promise<void> {
    if (this.token) {
      for (const projectId of this.createdProjectIds) {
        await this.page.request.delete(`${CONFIG.apiUrl}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
      }
      await this.page.request.delete(`${CONFIG.apiUrl}/users/${this.userId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      this.token = undefined;
      this.userId = undefined;
      this.createdProjectIds = [];
    }
  }
}
```

### StubService (External System Control)

```typescript
// drivers/web/services/stub.service.ts
export class StubService {
  constructor(private readonly page: Page) {}

  async simulateGitHubAuthProviderSuccess(email: string): Promise<void> {
    const response = await this.page.request.post(
      `${CONFIG.apiUrl}/external-system-stub-control/github-auth`,
      {
        data: {
          state: { success: true, data: { email } },
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

## UI Protocol Driver (Playwright)

With page objects and services:

```typescript
// drivers/web/registration-web-driver.ts
export class RegistrationWebDriver implements RegistrationDriver {
  private readonly signUpPage: SignupPage;

  constructor(
    private readonly page: Page,
    private readonly userService: UserService,
    private readonly stubService: StubService
  ) {
    this.signUpPage = PageFactory.createSignupPage(page);
  }

  async validateUserIsNotRegistered(email: string): Promise<void> {
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users/${email}`);
    if (response.status() !== 404) {
      throw new Error(`User already exists`);
    }
  }

  async provideRegistrationDetails(details: RegistrationDetails): Promise<void> {
    await this.signUpPage.fillRegistrationForm(details);
  }

  async completeRegistration(): Promise<void> {
    const token = await this.signUpPage.executeRegistration();
    this.userService.setToken(token);
  }

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

  async createTestUser(details: RegistrationDetails): Promise<void> {
    await this.stubService.simulateGitHubAuthProviderSuccess(details.email);
    await this.userService.registerAndTrackUser(details);
  }
}
```

## UI Protocol Driver (Without Page Objects - Simple)

```typescript
// drivers/ui/shopping-ui.driver.ts
import { Page, expect } from "@playwright/test";
import { ShoppingDriver, CheckoutDetails } from "../interfaces/shopping.driver";

export class ShoppingUIDriver implements ShoppingDriver {
  constructor(private page: Page) {}

  async navigateToStore(): Promise<void> {
    await this.page.goto(process.env.APP_URL || "http://localhost:3000");
  }

  async searchForBook(criteria: { title?: string; author?: string }): Promise<void> {
    const searchTerm = criteria.title || criteria.author || "";
    await this.page.getByLabel("Search").fill(searchTerm);
    await this.page.getByRole("button", { name: "Search" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async selectBook(criteria: { author?: string; title?: string }): Promise<void> {
    if (criteria.author) {
      await this.page.getByText(criteria.author).first().click();
    } else if (criteria.title) {
      await this.page.getByText(criteria.title).first().click();
    }
  }

  async addToCart(item: string): Promise<void> {
    await this.page.getByRole("button", { name: "Add to Cart" }).click();
    await this.page.waitForSelector("[data-testid='cart-confirmation']");
  }

  async checkOut(details: CheckoutDetails): Promise<void> {
    await this.page.getByRole("button", { name: "Checkout" }).click();

    // Fill payment details
    await this.page.getByLabel("Card Number").fill(details.card.number);
    await this.page.getByLabel("Expiry").fill(details.card.expiry);
    await this.page.getByLabel("CVV").fill(details.card.cvv);

    await this.page.getByRole("button", { name: "Complete Purchase" }).click();
    await this.page.waitForSelector("[data-testid='order-confirmation']");
  }

  async verifyItemPurchased(item: string): Promise<boolean> {
    await this.page.goto(`${process.env.APP_URL}/orders`);
    const orderItem = this.page.getByText(item);
    return await orderItem.isVisible();
  }

  async getNotification(): Promise<string> {
    const notification = this.page.getByTestId("notification");
    return await notification.textContent() || "";
  }

  async registerUser(details: UserDetails): Promise<void> {
    await this.page.goto(`${process.env.APP_URL}/register`);
    await this.page.getByLabel("Email").fill(details.email);
    await this.page.getByLabel("Password").fill(details.password);
    await this.page.getByLabel("Name").fill(details.name || "");
    await this.page.getByRole("button", { name: "Register" }).click();
  }

  async cleanup(): Promise<void> {
    // Use test support API to clean up
    await this.page.request.delete(`${process.env.API_URL}/test-support/cleanup`);
  }
}
```

## API Protocol Driver

```typescript
// drivers/api/shopping-api.driver.ts
import { ShoppingDriver, CheckoutDetails, CheckoutResult } from "../interfaces/shopping.driver";

export class ShoppingAPIDriver implements ShoppingDriver {
  private searchResults: any[] = [];
  private selectedBook: any = null;
  private cart: any[] = [];
  private authToken: string = "";

  constructor(private baseUrl: string = process.env.API_URL || "http://localhost:3000") {}

  async navigateToStore(): Promise<void> {
    // API driver doesn't navigate, but we can verify API is up
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error("Store API is not available");
    }
  }

  async searchForBook(criteria: { title?: string; author?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (criteria.title) params.set("title", criteria.title);
    if (criteria.author) params.set("author", criteria.author);

    const response = await fetch(`${this.baseUrl}/api/books?${params}`);
    this.searchResults = await response.json();
  }

  async selectBook(criteria: { author?: string; title?: string }): Promise<void> {
    this.selectedBook = this.searchResults.find(book =>
      (criteria.author && book.author.includes(criteria.author)) ||
      (criteria.title && book.title.includes(criteria.title))
    );

    if (!this.selectedBook) {
      throw new Error(`Book not found: ${JSON.stringify(criteria)}`);
    }
  }

  async addToCart(item: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ bookId: this.selectedBook?.id || item })
    });

    if (!response.ok) {
      throw new Error("Failed to add to cart");
    }

    this.cart = await response.json();
  }

  async checkOut(details: CheckoutDetails): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        paymentMethod: {
          type: "credit_card",
          cardNumber: details.card.number,
          expiry: details.card.expiry,
          cvv: details.card.cvv
        }
      })
    });

    if (!response.ok) {
      throw new Error("Checkout failed");
    }
  }

  async attemptCheckOut(item: string): Promise<CheckoutResult> {
    try {
      await this.checkOut({
        item,
        price: "0",
        card: { number: "4111111111111111", expiry: "12/25", cvv: "123" }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyItemPurchased(item: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/orders`, {
      headers: { "Authorization": `Bearer ${this.authToken}` }
    });
    const orders = await response.json();
    return orders.some((order: any) =>
      order.items.some((i: any) => i.title.includes(item))
    );
  }

  async getNotification(): Promise<string> {
    // Check via test support endpoint
    const response = await fetch(`${this.baseUrl}/test-support/notifications`);
    const notifications = await response.json();
    return notifications[0]?.message || "";
  }

  async registerUser(details: UserDetails): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details)
    });

    if (response.ok) {
      const data = await response.json();
      this.authToken = data.token;
    }
  }

  async cleanup(): Promise<void> {
    await fetch(`${this.baseUrl}/test-support/cleanup`, {
      method: "DELETE"
    });
    this.searchResults = [];
    this.selectedBook = null;
    this.cart = [];
    this.authToken = "";
  }
}
```

## External System Mocking with Scenarist

Protocol Drivers use **Scenarist** to mock external systems. The driver switches scenarios BEFORE triggering actions that call external services.

### Step 1: Define Scenarios

```typescript
// scenarios/scenario-ids.enum.ts
export enum ScenarioId {
  GITHUB_OAUTH_SUCCESS = 'github-oauth-success',
  GITHUB_OAUTH_FAILURE = 'github-oauth-failure',
  PAYMENT_SUCCESS = 'payment-success',
  PAYMENT_DECLINED = 'payment-declined',
}

// scenarios/github-oauth.scenarios.ts
export const githubOAuthSuccess: ScenaristScenario = {
  id: ScenarioId.GITHUB_OAUTH_SUCCESS,
  name: 'GitHub OAuth - Success',
  description: 'GitHub OAuth flow succeeds',
  mocks: [
    {
      method: 'POST',
      url: 'https://github.com/login/oauth/access_token',
      response: {
        status: 200,
        body: { access_token: 'gho_mock_token', token_type: 'bearer' },
      },
    },
    {
      method: 'GET',
      url: 'https://api.github.com/user',
      response: {
        status: 200,
        body: { id: 123456, login: 'testuser', email: 'test@example.com' },
      },
    },
  ],
};
```

### Step 2: Create Scenarist Service

```typescript
// drivers/web/services/scenarist.service.ts
export class ScenaristService {
  constructor(private readonly baseUrl: string = process.env.SCENARIST_URL) {}

  async switchToScenario(scenario: ScenaristScenario): Promise<void> {
    const response = await fetch(`${this.baseUrl}/scenarios/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: scenario.id, mocks: scenario.mocks }),
    });
    if (!response.ok) {
      throw new Error(`Failed to switch to scenario ${scenario.id}`);
    }
  }

  async reset(): Promise<void> {
    await fetch(`${this.baseUrl}/scenarios/reset`, { method: 'POST' });
  }
}
```

### Step 3: Use in Protocol Drivers

```typescript
// drivers/web/auth-web-driver.ts
export class AuthWebDriver implements AuthDriver {
  constructor(
    private readonly page: Page,
    private readonly scenaristService: ScenaristService
  ) {}

  async authenticate(email: string): Promise<boolean> {
    // Switch scenario BEFORE triggering the flow
    await this.scenaristService.switchToScenario(githubOAuthSuccess);
    return await this.signUpPage.authenticateWithGitHub();
  }

  async gitHubAuthenticationFailed(): Promise<void> {
    await this.scenaristService.switchToScenario(githubOAuthFailure);
    await this.signUpPage.continueWithGitHub();
  }
}
```

### Step 4: Wire Up in World

```typescript
// support/world.ts
export class CustomWorld extends World {
  private scenaristService!: ScenaristService;

  async init(): Promise<void> {
    this.scenaristService = new ScenaristService();

    this.authDSL = new AuthDSL(
      new AuthWebDriver(this.page, this.scenaristService)
    );
  }

  async cleanup(): Promise<void> {
    await this.scenaristService.reset();
  }
}
```

### Scenario Organization

```
scenarios/
├── scenario-ids.enum.ts          # Central enum for all IDs
├── github-oauth.scenarios.ts     # GitHub OAuth scenarios
├── stripe-payment.scenarios.ts   # Payment scenarios
└── index.ts                      # Re-exports
```

## Driver Factory

```typescript
// drivers/driver-factory.ts
import { ShoppingDriver } from "./interfaces/shopping.driver";
import { ShoppingUIDriver } from "./ui/shopping-ui.driver";
import { ShoppingAPIDriver } from "./api/shopping-api.driver";
import { Page } from "@playwright/test";

export type DriverType = "ui" | "api";

export function createShoppingDriver(type: DriverType, context?: Page): ShoppingDriver {
  switch (type) {
    case "ui":
      if (!context) throw new Error("Page required for UI driver");
      return new ShoppingUIDriver(context);
    case "api":
      return new ShoppingAPIDriver();
    default:
      throw new Error(`Unknown driver type: ${type}`);
  }
}
```

## Directory Structure

```
drivers/
├── interface/
│   ├── shopping-driver.interface.ts
│   └── registration-driver.interface.ts
└── web/                          # UI Protocol Drivers
    ├── shopping-web-driver.ts
    ├── registration-web-driver.ts
    ├── pages/                    # Page Objects
    │   ├── base.page.ts
    │   ├── signup.page.ts
    │   ├── shopping.page.ts
    │   ├── page.factory.ts
    │   └── builder/              # Test Data Builders
    │       └── registration-details.builder.ts
    └── services/                 # Supporting Services
        ├── user.service.ts       # Test data tracking/cleanup
        └── stub.service.ts       # External system control
```

## Process

1. **Define interface** in `drivers/interface/`
2. **Choose channel** - UI (Playwright), API (fetch), etc.
3. **Create page objects** for UI drivers (delegate UI interactions)
4. **Create services** for shared state (UserService, StubService)
5. **Implement driver** mirroring DSL interface
6. **Isolate system knowledge** - URLs, selectors, endpoints
7. **Add external stubs** for third-party services via StubService

## Verification

Before running acceptance tests, confirm:
- [ ] Interface defines all methods DSL needs
- [ ] Driver mirrors DSL method signatures
- [ ] All system knowledge is in driver (not DSL)
- [ ] Scenarist scenarios defined for external systems
- [ ] Cleanup method resets state between tests

## Output

After implementing driver, report:

```
PROTOCOL DRIVER COMPLETE

Driver: [driver class name]
Type: [UI | API | Mobile | etc.]
File: [file path]
Interface: [interface file path]

Methods Implemented:
  - navigateToStore()
  - searchForBook(criteria)
  - checkOut(details)
  - ...

Scenarist Scenarios:
  - [scenario1] (e.g., githubOAuthSuccess)
  - [scenario2] (e.g., paymentSuccess)

Next step: Run acceptance tests to verify full flow
```

## Next Steps

1. **All layers complete?** → Run acceptance tests
2. **Tests fail?** → Use TDD (`/red`, `/green`, `/refactor`) to implement SUT
3. **Need another channel?** → Implement additional Protocol Driver
