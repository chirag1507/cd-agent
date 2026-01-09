# Component Tests (Backend)

> Apply when writing tests that verify a full vertical slice through HTTP interface.

## Purpose

Test that a component (route → controller → use case) is correctly wired and behaves as expected through its HTTP interface.

## Non-Negotiable Rules

### 1. Isolate the Component

- Replace ALL out-of-process dependencies with test doubles
- Repositories, external services, message queues = STUBBED
- Tests must be fast and deterministic

### 2. Test Through HTTP Interface

Use `supertest` to make real HTTP requests:

```typescript
import request from "supertest";

const response = await request(app)
  .post("/users/register")
  .send(requestBody)
  .expect(201);
```

### 3. Use Dependency Injection

Application must accept dependencies:

```typescript
const app = createApp({ registerUserUseCase });
```

### 4. Focus on Public Contract

Assert on:
- HTTP status codes
- Response body structure
- Essential headers
- Critical interactions with dependencies

**Do NOT** re-test business logic covered by unit tests.

## Test Structure

```typescript
describe("POST /users/register", () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  let app: Express;

  beforeEach(() => {
    // 1. Create mock dependencies
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    mockEmailService = {
      sendConfirmationEmail: jest.fn(),
    };

    // 2. Create real use case with mock dependencies
    const registerUserUseCase = new RegisterUserUseCase(
      mockUserRepository,
      mockEmailService
    );

    // 3. Create app with test-configured use case
    app = createApp({ registerUserUseCase });
  });

  it("should return 201 when user successfully registered", async () => {
    // Arrange
    const requestBody = {
      email: "test@example.com",
      password: "ValidPassword123!"
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockResolvedValue(undefined);

    // Act
    const response = await request(app)
      .post("/users/register")
      .send(requestBody)
      .expect(201);

    // Assert
    expect(response.body.email).toBe(requestBody.email);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalledWith(
      requestBody.email
    );
  });

  it("should return 409 when user already exists", async () => {
    // Arrange
    const existingUser = new UserBuilder().build();
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    // Act
    const response = await request(app)
      .post("/users/register")
      .send({ email: "exists@example.com", password: "ValidPass123!" })
      .expect(409);

    // Assert
    expect(response.body.error).toContain("already exists");
  });

  it("should return 400 for invalid email format", async () => {
    // Act
    const response = await request(app)
      .post("/users/register")
      .send({ email: "invalid-email", password: "ValidPass123!" })
      .expect(400);

    // Assert
    expect(response.body.error).toContain("email");
  });
});
```

## What These Tests Are NOT

- **Not Unit Tests**: Test collaboration between route, controller, and use case
- **Not Integration Tests**: Do NOT connect to real database or services

## Assertion Granularity

**Test at component level:**
- Correct HTTP response for valid input
- Correct HTTP error for invalid input
- Dependencies called appropriately

**Leave to unit tests:**
- Fine-grained validation rules
- Specific error message variations
- Edge cases in business logic

## Setup Pattern

```typescript
describe("Component Test: Register User", () => {
  // Common setup in beforeEach
  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEmailService = createMockEmailService();
    const useCase = new RegisterUserUseCase(mockUserRepository, mockEmailService);
    app = createApp({ registerUserUseCase: useCase });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests grouped by endpoint behavior
  describe("Success scenarios", () => { /* ... */ });
  describe("Validation errors", () => { /* ... */ });
  describe("Business rule violations", () => { /* ... */ });
});
```

## File Naming

`<component-name>.component.test.ts`

Example: `register.component.test.ts`
