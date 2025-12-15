---
description: Implement Protocol Driver for acceptance tests
argument-hint: [driver type: ui, api, or specific channel]
---

# Implement Protocol Driver

$ARGUMENTS

(If no input provided, check conversation context for the driver to implement)

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

1. **Translators/Adaptors** - from DSL to system language
2. **Mirror DSL interface** - `dsl.checkOut()` → `driver.checkOut()`
3. **More specific parameters** - DSL parses, driver uses concrete values
4. **One per channel** - UI driver, API driver, mobile driver, etc.
5. **Isolate ALL system knowledge** - URLs, selectors, API endpoints

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

## UI Protocol Driver (Playwright)

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

  async getCalls(scenarioId: string): Promise<RecordedCall[]> {
    const response = await fetch(`${this.baseUrl}/scenarios/${scenarioId}/calls`);
    return response.json();
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

## Process

1. **Define interface** in `drivers/interfaces/`
2. **Choose channel** - UI (Playwright), API (fetch), etc.
3. **Implement driver** mirroring DSL interface
4. **Isolate system knowledge** - URLs, selectors, endpoints
5. **Add external stubs** for third-party services

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
