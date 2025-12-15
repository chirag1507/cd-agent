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

## Layer 3: Protocol Drivers

Protocol Drivers are translators/adaptors from DSL to "language of the system".

### Principles

- **Mirror DSL interface** - `dsl.checkOut` → `driver.checkOut`
- **More specific parameters** - DSL parses, Driver executes
- **One per channel** - UI driver, API driver, etc.
- **Isolate ALL system knowledge here**

### Example Protocol Driver (UI)

```typescript
export class ShoppingUIDriver implements ShoppingDriver {
  constructor(private page: Page) {}

  async navigateToStore(): Promise<void> {
    await this.page.goto("https://store.example.com");
  }

  async searchForBook(title: string): Promise<void> {
    await this.page.getByLabel("Search").fill(title);
    await this.page.getByRole("button", { name: "Search" }).click();
  }

  async selectBook(criteria: { author?: string; title?: string }): Promise<void> {
    if (criteria.author) {
      await this.page.getByText(criteria.author).click();
    }
  }

  async assertItemPurchased(item: string): Promise<void> {
    await this.page.goto("https://store.example.com/orders");
    const orderItem = this.page.getByText(item);
    await expect(orderItem).toBeVisible();
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

  async getCalls(scenarioId: string): Promise<RecordedCall[]> {
    const response = await fetch(`${this.baseUrl}/scenarios/${scenarioId}/calls`);
    return response.json();
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

### Asserting External System Interactions

```typescript
// In DSL
async assertPaymentProcessed(amount: string): Promise<void> {
  const calls = await this.scenaristService.getCalls(ScenarioId.PAYMENT_SUCCESS);
  const paymentCall = calls.find(call => call.request.body.amount === amount);

  if (!paymentCall) {
    throw new Error(`No payment call found for amount ${amount}`);
  }
}
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
├── test-cases/             # Executable Specifications
│   ├── shopping/
│   │   └── buy-book.test.ts
│   └── account/
│       └── registration.test.ts
├── dsl/                    # Domain Specific Language
│   ├── shopping.dsl.ts
│   ├── account.dsl.ts
│   └── params.ts           # Parameter parsing utilities
├── drivers/
│   ├── interfaces/         # Driver contracts
│   │   ├── shopping.driver.ts
│   │   └── account.driver.ts
│   ├── ui/                 # UI Protocol Drivers
│   │   └── shopping-ui.driver.ts
│   └── api/                # API Protocol Drivers
│       └── shopping-api.driver.ts
└── support/
    ├── config.ts
    └── hooks.ts
```

## Key Insight: ATDD + TDD

> The combination of Acceptance Tests and TDD results in reductions in defects of often two orders-of-magnitude.

1. Write Acceptance Test (Executable Specification) FIRST
2. Use fine-grained TDD to implement code that meets the specification
3. Acceptance Test guides and organizes work until specification is met
