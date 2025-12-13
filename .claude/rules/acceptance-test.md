# Acceptance Tests (Four-Layer BDD)

> Apply when writing system-level acceptance tests using Dave Farley's Four-Layer Model.

## Purpose

Verify business behavior through the complete system using Gherkin scenarios and the Four-Layer Architecture.

## Architecture: Four-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: FEATURES (Gherkin)                                │
│  Business-readable scenarios                                 │
│  acceptance/features/*.feature                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: STEP DEFINITIONS                                   │
│  Maps Gherkin to DSL calls                                   │
│  acceptance/step_definitions/*.steps.ts                      │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: DSL (Domain-Specific Language)                     │
│  High-level test operations                                  │
│  acceptance/dsl/*.dsl.ts                                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: DRIVERS                                            │
│  Platform-specific implementations                           │
│  acceptance/drivers/{web,api}/*.ts                           │
└─────────────────────────────────────────────────────────────┘
```

## Non-Negotiable Rules

### Layer 1: Features (Gherkin)

- Focus on WHAT (business behavior), not HOW (implementation)
- Use ubiquitous domain language
- Business stakeholders should understand scenarios

```gherkin
# GOOD: Business-focused
Feature: User Registration
  As a new user
  I want to register for an account
  So that I can access the application

  Scenario: Successful registration
    Given I am on the registration page
    When I register with valid details:
      | name     | email           | password     |
      | John Doe | john@example.com| SecurePass1! |
    Then I should be redirected to the login page
    And I should receive a confirmation email

# BAD: Implementation-focused
Scenario: User clicks register button and form submits
  Given the registration form is displayed
  When I click the submit button with class .btn-primary
  Then the POST request to /api/users returns 201
```

### Layer 2: Step Definitions

- ONLY use DSL methods
- NO direct driver calls
- Map Gherkin to DSL operations

```typescript
import { Given, When, Then } from "@cucumber/cucumber";

Given("I am on the registration page", async function () {
  await this.registrationDSL.navigateToRegistration();
});

When("I register with valid details:", async function (dataTable) {
  const details = dataTable.hashes()[0];
  await this.registrationDSL.registerUser(details);
});

Then("I should be redirected to the login page", async function () {
  await this.registrationDSL.verifyRedirectedToLogin();
});
```

### Layer 3: DSL

- Abstract implementation details
- Provide business-relevant methods
- Technology-agnostic interface

```typescript
export class RegistrationDSL {
  constructor(private driver: RegistrationDriver) {}

  async navigateToRegistration(): Promise<void> {
    await this.driver.goToRegistrationPage();
  }

  async registerUser(details: RegistrationDetails): Promise<void> {
    await this.driver.fillRegistrationForm(details);
    await this.driver.submitForm();
  }

  async verifyRedirectedToLogin(): Promise<void> {
    const currentUrl = await this.driver.getCurrentUrl();
    expect(currentUrl).toContain("/login");
  }
}
```

### Layer 4: Drivers

- Implement platform-specific logic
- Use Page Object pattern for web UI
- Define clear interfaces

```typescript
// Interface
export interface RegistrationDriver {
  goToRegistrationPage(): Promise<void>;
  fillRegistrationForm(details: RegistrationDetails): Promise<void>;
  submitForm(): Promise<void>;
  getCurrentUrl(): Promise<string>;
}

// Web implementation
export class RegistrationWebDriver implements RegistrationDriver {
  constructor(private page: Page) {}

  async goToRegistrationPage(): Promise<void> {
    await this.page.goto("/register");
  }

  async fillRegistrationForm(details: RegistrationDetails): Promise<void> {
    await this.page.getByLabel("Name").fill(details.name);
    await this.page.getByLabel("Email").fill(details.email);
    await this.page.getByLabel("Password").fill(details.password);
  }

  async submitForm(): Promise<void> {
    await this.page.getByRole("button", { name: "Register" }).click();
  }
}
```

## External System Stubbing

### Stub External Services (NOT infrastructure)

**External (STUB):**
- Email services (SendGrid, Mailgun)
- Payment gateways (Stripe, PayPal)
- Third-party APIs (OAuth, geocoding)
- SMS/notifications (Twilio)

**Infrastructure (USE REAL):**
- Database (test instance)
- File storage (test bucket)
- Message queues (test queue)
- Cache (test Redis)

### Test Support API

```typescript
// Application provides test support endpoints
testSupportRouter.get("/verify-email", (req, res) => {
  const { email } = req.query;
  const emailService = TestEmailService.getInstance();
  const wasSent = emailService.wasEmailSentTo(email);
  return res.json({ sent: wasSent });
});

// Driver verifies via test support
async verifyConfirmationEmail(email: string): Promise<boolean> {
  const response = await this.page.request.get(
    `${API_URL}/test-support/verify-email?email=${email}`
  );
  const { sent } = await response.json();
  return sent;
}
```

## Page Object Pattern

```typescript
export class RegistrationPage extends BasePage {
  constructor(private page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto("/register");
  }

  async fillForm(details: RegistrationDetails): Promise<void> {
    await this.page.getByLabel("Name").fill(details.name);
    await this.page.getByLabel("Email").fill(details.email);
    await this.page.getByLabel("Password").fill(details.password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Register" }).click();
  }

  async getErrorMessage(): Promise<string | null> {
    const error = this.page.getByTestId("error-message");
    if (await error.isVisible()) {
      return error.textContent();
    }
    return null;
  }
}
```

## Test Data Cleanup

```typescript
// In hooks.ts
After(async function () {
  await this.testSupportDriver.cleanup();
});

// Test support cleans all stubs and test data
async cleanup(): Promise<void> {
  await this.page.request.delete(`${API_URL}/test-support/cleanup`);
  TestEmailService.getInstance().reset();
}
```

## Directory Structure

```
<project>-system-tests/
├── acceptance/
│   ├── features/           # Gherkin feature files
│   ├── step_definitions/   # Cucumber step mappings
│   ├── dsl/                # Domain-specific test language
│   │   └── models/         # Test data models
│   ├── drivers/
│   │   ├── interface/      # Driver contracts
│   │   └── web/            # Playwright implementations
│   │       ├── pages/      # Page objects
│   │       └── services/   # Test services
│   └── support/
│       ├── world.ts        # Cucumber world context
│       └── hooks.ts        # Before/After hooks
```

## File Naming

- Features: `<feature-name>.feature`
- Steps: `<feature-name>.steps.ts`
- DSL: `<feature-name>.dsl.ts`
- Drivers: `<feature-name>-driver.interface.ts`, `<feature-name>-web-driver.ts`
- Pages: `<page-name>.page.ts`
