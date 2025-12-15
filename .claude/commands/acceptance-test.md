---
description: Write an Executable Specification (Test Case) in problem-domain language
argument-hint: [behavior to specify]
---

# Write Acceptance Test (Executable Specification)

$ARGUMENTS

(If no input provided, check conversation context for the behavior to specify)

## Purpose

Write a Test Case that serves as an **Executable Specification** for the behavior. This is Layer 1 of Dave Farley's Four-Layer Model.

```
┌─────────────────────────────────────────────────────────────┐
│         TEST CASES (Executable Specifications)              │  ◀── YOU ARE HERE
│  Written in problem-domain language                         │
│  From perspective of external user                          │
├─────────────────────────────────────────────────────────────┤
│              DOMAIN SPECIFIC LANGUAGE (DSL)                 │
├─────────────────────────────────────────────────────────────┤
│  Protocol Drivers  │  Protocol Drivers  │  Scenarist Stubs  │
│  (UI)              │  (API)             │  (External Systems)│
├─────────────────────────────────────────────────────────────┤
│                   SYSTEM UNDER TEST (SUT)                   │
└─────────────────────────────────────────────────────────────┘
```

**External System Mocking**: We use [Scenarist](https://scenarist.io/) to stub external systems (payment gateways, email services, third-party APIs). Scenarios are defined as typed objects with `ScenarioId` enum and switched via `ScenaristService.switchToScenario()`.

## The Litmus Test

Before writing, ask yourself:

> **"Could the least technical person who understands this domain read this test and understand it?"**

> **"If I replaced the entire system with something completely different that achieves the same goal, would this test still make sense?"**

Example: Testing buying a book on Amazon. Could your test work for a robot shopping in a physical bookstore?

## Non-Negotiable Rules

### DO
- Use **problem-domain language exclusively**
- Write from the perspective of an **external user**
- Make each test **atomic** (no shared test data)
- Start from assumption of **running system with no data**
- Use DSL methods like `placeAnOrder()`, `payByCreditCard()`

### DON'T
- Say "fill in this field" or "click this button"
- Reference UI elements, CSS classes, or HTML
- Include implementation details
- Share test data between test cases
- Use technical jargon the business wouldn't understand

## Test Case Structure

```typescript
// test-cases/<domain>/<behavior>.test.ts
import { ShoppingDSL } from "../dsl/shopping.dsl";

describe("Book Purchase", () => {
  let shopping: ShoppingDSL;

  beforeEach(async () => {
    shopping = await createShoppingDSL();
  });

  afterEach(async () => {
    await shopping.cleanup();
  });

  it("should buy book with credit card", async () => {
    // Use domain language - WHAT, not HOW
    await shopping.goToStore();

    await shopping.searchForBook("title: Continuous Delivery");
    await shopping.selectBook("author: David Farley");

    await shopping.addSelectedItemToShoppingBasket();

    await shopping.checkOut("item: Continuous Delivery");

    await shopping.assertItemPurchased("item: Continuous Delivery");
  });

  it("should notify customer when book is out of stock", async () => {
    await shopping.goToStore();

    await shopping.searchForBook("title: Rare Book");
    await shopping.selectBook("title: Rare Book");

    await shopping.addSelectedItemToShoppingBasket();

    await shopping.attemptCheckOut("item: Rare Book");

    await shopping.assertOutOfStockNotification("item: Rare Book");
  });
});
```

## With Gherkin (Optional)

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

  Scenario: Out of stock notification
    Given I am at the store
    When I search for book "Rare Book"
    And I select book "Rare Book"
    And I add selected item to shopping basket
    And I attempt to check out with item "Rare Book"
    Then I should receive out of stock notification for "Rare Book"
```

## Process

1. **Identify the acceptance criteria** from the user story
2. **Invent the DSL language** needed to express the test
3. **Write the test case** using that language
4. **Don't worry about implementation** - DSL methods may not exist yet
5. **Review against litmus test** - would a non-technical domain expert understand?

## Inventing DSL Methods

When writing a test, you're also designing the DSL. Ask:

- What **action** is the user taking? → `shopping.addToBasket()`
- What **assertion** proves success? → `shopping.assertItemPurchased()`
- What **parameters** provide precision? → `"item: Continuous Delivery"`

Use **optional parameters** pattern:
```typescript
// Precise when needed
await shopping.checkOut("item: CD Book", "price: £30.00", "card: 4111...");

// Defaults when not
await shopping.checkOut();
```

## External System Mocking with Scenarist

When your test involves external systems, the Protocol Driver switches Scenarist scenarios to control external system behavior. **Test assertions focus on what the USER sees, not on verifying external API calls.**

```typescript
// In Protocol Driver - switch scenario BEFORE triggering the flow
await this.scenaristService.switchToScenario(githubOAuthSuccess);
await this.signUpPage.authenticateWithGitHub();

// For failure scenarios
await this.scenaristService.switchToScenario(githubOAuthFailure);
await this.signUpPage.continueWithGitHub();
```

### Assert User-Visible Outcomes (NOT External Calls)

```typescript
// GOOD: Assert what the user sees
await shopping.assertOrderConfirmationDisplayed();
await shopping.assertReceiptEmailReceived();  // Check user's inbox view
await account.assertUserIsLoggedIn();

// BAD: Don't couple tests to external system implementation
// await shopping.assertPaymentProcessed("amount: £30.00");  // ❌
// await notifications.assertEmailSent("to: ...");            // ❌
```

Scenarist controls **how external systems behave** (success/failure). Your tests assert **what the user experiences** as a result.

## Verification

Before moving to DSL implementation, confirm:
- [ ] Test uses problem-domain language only
- [ ] No UI/implementation details (buttons, fields, CSS)
- [ ] Test is atomic (no shared data with other tests)
- [ ] Non-technical domain expert would understand it
- [ ] Test would still make sense if system was completely replaced

## Output

After writing the test, report:

```
ACCEPTANCE TEST COMPLETE

Test Case: [test name]
File: [file path]
DSL Methods Used:
  - [method1] (exists / needs implementation)
  - [method2] (exists / needs implementation)
  - ...

Next steps:
- If DSL methods don't exist: /dsl [method to implement]
- If DSL exists but drivers don't: /driver [driver to implement]
- If all layers exist: Run the test to verify
```

## Next Steps

1. **DSL doesn't exist?** → Use `/dsl` to implement the Domain Specific Language
2. **Drivers don't exist?** → Use `/driver` to implement Protocol Drivers
3. **All layers exist?** → Run the test, then use `/red` for TDD implementation
