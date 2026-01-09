---
description: Implement Domain Specific Language for acceptance tests
argument-hint: [DSL method or domain to implement]
---

# Implement Domain Specific Language (DSL)

$ARGUMENTS

(If no input provided, check conversation context for the DSL methods needed)

## CRITICAL: Mandatory Rule Loading

⚠️ **BEFORE PROCEEDING, YOU MUST:**

1. **Read ALL required rule files** (use multiple Read tool calls in parallel)
2. **Confirm rules are loaded** (brief acknowledgment)
3. **Follow rules strictly** (non-negotiable)

**Required Rules:**
- `docs/rules/acceptance-test.md` - Four-Layer Model and DSL patterns
- `docs/rules/code-style.md` - Code style and comment rules

**ACTION REQUIRED**: Use Read tool to load these files NOW.

**If you cannot read the rule files, STOP and notify the user.**

---

### Mandatory Checkpoint: Confirm Rules Loaded

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Rules Read:
- acceptance-test.md
- code-style.md

Proceeding with strict rule compliance for DSL implementation.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

## Purpose

Implement Layer 2 of Dave Farley's Four-Layer Model - the **Domain Specific Language** that makes writing Test Cases easy.

```
┌─────────────────────────────────────────────────────────────┐
│         TEST CASES (Executable Specifications)              │
├─────────────────────────────────────────────────────────────┤
│              DOMAIN SPECIFIC LANGUAGE (DSL)                 │  ◀── YOU ARE HERE
│  Shared between test cases                                  │
│  Optional parameters for precision where needed             │
│  Domain concepts only - no HOW, only WHAT                   │
├─────────────────────────────────────────────────────────────┤
│  Protocol Drivers  │  Protocol Drivers  │  External Stubs   │
├─────────────────────────────────────────────────────────────┤
│                   SYSTEM UNDER TEST (SUT)                   │
└─────────────────────────────────────────────────────────────┘
```

## DSL Principles (Non-Negotiable)

1. **Shared between test cases** - reusable across scenarios
2. **Optional parameters for everything** - precision where needed, defaults elsewhere
3. **Encode common startup tasks** - registering users, populating accounts
4. **Domain concepts ONLY** - clean from HOW the system works
5. **Delegate to drivers** - DSL parses, drivers execute

## DSL Structure

```typescript
// dsl/<domain>.dsl.ts
import { Params } from "./params";
import { ShoppingDriver } from "../drivers/interfaces/shopping.driver";

export class ShoppingDSL {
  constructor(private driver: ShoppingDriver) {}

  // Simple action - no parameters needed
  async goToStore(): Promise<void> {
    await this.driver.navigateToStore();
  }

  // Optional parameters with defaults
  async searchForBook(...args: string[]): Promise<void> {
    const params = new Params(args);
    const title = params.optional("title", "any book");
    const author = params.optional("author", undefined);

    await this.driver.searchForBook({ title, author });
  }

  // Multiple optional parameters for precision
  async checkOut(...args: string[]): Promise<void> {
    const params = new Params(args);
    const item = params.optional("item", "Default Item");
    const price = params.optional("price", "£10.00");
    const card = params.optional("card", "4111111111111111 12/25 123");

    await this.driver.checkOut({
      item,
      price,
      card: this.parseCard(card)
    });
  }

  // Assertions use driver verification
  async assertItemPurchased(...args: string[]): Promise<void> {
    const params = new Params(args);
    const item = params.required("item");

    const isPurchased = await this.driver.verifyItemPurchased(item);
    if (!isPurchased) {
      throw new Error(`Expected item "${item}" to be purchased`);
    }
  }

  // Common setup tasks encoded in DSL
  async registerNewUser(...args: string[]): Promise<void> {
    const params = new Params(args);
    const email = params.optional("email", `user-${Date.now()}@test.com`);
    const password = params.optional("password", "ValidPass123!");
    const name = params.optional("name", "Test User");

    await this.driver.registerUser({ email, password, name });
  }

  // Cleanup for test isolation
  async cleanup(): Promise<void> {
    await this.driver.cleanup();
  }

  private parseCard(cardString: string): CardDetails {
    const parts = cardString.split(" ");
    return {
      number: parts[0],
      expiry: parts[1],
      cvv: parts[2]
    };
  }
}
```

## Params Utility

Create a parameter parsing utility for the optional parameters pattern:

```typescript
// dsl/params.ts
export class Params {
  private map: Map<string, string>;

  constructor(args: string[]) {
    this.map = new Map();
    for (const arg of args) {
      const match = arg.match(/^(\w+):\s*(.+)$/);
      if (match) {
        this.map.set(match[1].toLowerCase(), match[2].trim());
      }
    }
  }

  optional<T = string>(name: string, defaultValue: T): T {
    const value = this.map.get(name.toLowerCase());
    if (value === undefined) {
      return defaultValue;
    }
    return value as unknown as T;
  }

  required(name: string): string {
    const value = this.map.get(name.toLowerCase());
    if (value === undefined) {
      throw new Error(`Required parameter "${name}" not provided`);
    }
    return value;
  }

  has(name: string): boolean {
    return this.map.has(name.toLowerCase());
  }
}
```

## DSL Method Patterns

### Action Methods

```typescript
// Simple action
async goToStore(): Promise<void> {
  await this.driver.navigateToStore();
}

// Action with optional context
async selectBook(...args: string[]): Promise<void> {
  const params = new Params(args);
  const author = params.optional("author", undefined);
  const title = params.optional("title", undefined);

  await this.driver.selectBook({ author, title });
}
```

### Setup Methods (Encode Common Tasks)

```typescript
// User registration with sensible defaults
async registerUser(...args: string[]): Promise<void> {
  const params = new Params(args);
  const email = params.optional("email", this.generateEmail());
  const password = params.optional("password", "ValidPass123!");

  await this.driver.registerUser({ email, password });
}

// Populate test data
async populateShoppingCart(...args: string[]): Promise<void> {
  const params = new Params(args);
  const items = params.optional("items", "3").split(",").map(s => s.trim());

  for (const item of items) {
    await this.driver.addToCart(item);
  }
}
```

### Assertion Methods

```typescript
// Simple assertion
async assertItemPurchased(...args: string[]): Promise<void> {
  const params = new Params(args);
  const item = params.required("item");

  const purchased = await this.driver.verifyItemPurchased(item);
  expect(purchased).toBe(true);
}

// Assertion with verification via test support
async assertEmailSent(...args: string[]): Promise<void> {
  const params = new Params(args);
  const to = params.required("to");
  const subject = params.optional("subject", undefined);

  const sent = await this.driver.verifyEmailSent({ to, subject });
  expect(sent).toBe(true);
}
```

### Error Scenario Methods

```typescript
// Attempt action that may fail
async attemptCheckOut(...args: string[]): Promise<void> {
  const params = new Params(args);
  const item = params.optional("item", "Default Item");

  // Store result for later assertion
  this.lastCheckoutResult = await this.driver.attemptCheckOut(item);
}

// Assert error state
async assertOutOfStockNotification(...args: string[]): Promise<void> {
  const params = new Params(args);
  const item = params.required("item");

  const notification = await this.driver.getNotification();
  expect(notification).toContain(`${item} is out of stock`);
}
```

## Test Data: Builders and Fixtures

### Builders for Domain Models

Create builders for test data with sensible defaults:

```typescript
// dsl/models/builders/registration-details.builder.ts
export class RegistrationDetailsBuilder {
  private firstName: string = 'Test';
  private lastName: string = 'User';
  private email: string = `test.user+${Date.now()}@example.com`;

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
      email: this.email,
    };
  }
}

// Usage in DSL
async fillRegistrationForm(...args: string[]): Promise<void> {
  const params = new Params(args);
  const email = params.optional("email", undefined);

  const details = RegistrationDetailsBuilder.aRegistration()
    .withEmail(email || `test-${Date.now()}@example.com`)
    .build();

  await this.driver.provideRegistrationDetails(details);
}
```

### Fixtures for Static Test Data

Create fixtures for static reference data:

```typescript
// dsl/models/repository.fixture.ts
export interface RepositoryDto {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
}

export const REPO_NAME_SHOPPING_CART = 'shopping-cart';
export const REPO_NAME_USER_SERVICE = 'user-service';

export function defaultRepositories(): RepositoryDto[] {
  return [
    {
      id: 1,
      name: REPO_NAME_SHOPPING_CART,
      fullName: REPO_NAME_SHOPPING_CART,
      isPrivate: false,
    },
    {
      id: 2,
      name: REPO_NAME_USER_SERVICE,
      fullName: REPO_NAME_USER_SERVICE,
      isPrivate: true,
    },
  ];
}

// Usage in DSL
async selectRepository(...args: string[]): Promise<void> {
  const params = new Params(args);
  const repoName = params.optional("name", REPO_NAME_SHOPPING_CART);
  await this.driver.selectRepository(repoName);
}
```

### Directory Structure for Models

```
dsl/
├── shopping.dsl.ts
├── registration.dsl.ts
├── models/
│   ├── registration-details.ts       # Interface
│   ├── repository.fixture.ts         # Static test data
│   └── builders/
│       ├── registration-details.builder.ts
│       └── order-details.builder.ts
└── params.ts
```

## Process

1. **Review the test case** that needs DSL support
2. **Identify methods needed** - actions, assertions, setup
3. **Define domain models** - interfaces for test data
4. **Create builders/fixtures** - sensible defaults for test data
5. **Design the interface** - what parameters make sense?
6. **Implement with defaults** - sensible values for everything
7. **Delegate to driver** - DSL parses, driver executes

## Verification

Before moving to Protocol Drivers, confirm:
- [ ] All test case methods are implemented
- [ ] Optional parameters with sensible defaults
- [ ] Methods use domain language (no UI/implementation terms)
- [ ] Driver interface is defined (even if not implemented)
- [ ] Common setup tasks are encoded

## Output

After implementing DSL, report:

```
DSL IMPLEMENTATION COMPLETE

DSL Class: [class name]
File: [file path]
Methods Implemented:
  - [method1] → delegates to driver.[driverMethod]
  - [method2] → delegates to driver.[driverMethod]
  - ...

Driver Interface Required:
  - [driverMethod1]
  - [driverMethod2]
  - ...

Next step: /driver [driver type to implement]
```

## Next Steps

1. **Define driver interface** in `drivers/interfaces/`
2. **Implement Protocol Driver** with `/driver` command
3. **Run tests** to verify the complete flow

---

## MANDATORY: Workflow Checkpoint

After completing this command, you MUST suggest the next step:

**Current Phase**: Phase 1 - System Test Definition (DSL Layer Complete)

**Suggested Next Steps**:
1. **If Phase 1 complete (Gherkin + DSL done)**: `/red <first behavior>` - Start Phase 2 (Backend TDD implementation)
2. **If need more Gherkin scenarios**: `/acceptance-test` - Write additional scenarios before implementation

**Output Format**:
```
✅ DSL IMPLEMENTATION COMPLETE

DSL Layer: [DSL class name]
Location: dsl/[feature].dsl.ts
Methods Implemented: [count]

Test Data:
- Builders: [count] created
- Fixtures: [count] created
- Models: [count] created

Suggested Next Step:
→ /red <first behavior> - Start backend TDD implementation (Phase 2)

Note: Protocol drivers (/driver) come later in Phase 5 after backend/frontend are implemented.

See: CLAUDE.md "Four-Layer Model" and docs/workflow-flowchart.md for complete workflow
```

**DO NOT complete this command without suggesting /red to start Phase 2 implementation.**
