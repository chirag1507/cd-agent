# Sociable Unit Tests (Backend)

> Apply when writing unit tests for Use Cases in the application layer.

## Purpose

Test Use Case behavior with real domain collaborators but stubbed boundaries.

## Non-Negotiable Rules

### 1. Test Behavior, Not Implementation

```typescript
// BAD: Testing interactions (brittle)
expect(repository.findByEmail).toHaveBeenCalledWith("test@example.com");
expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({...}));

// GOOD: Testing state/outcome (robust)
expect(result.isSuccess).toBe(true);
const user = result.getValue();
expect(user.email.value).toBe("test@example.com");
expect(repository.save).toHaveBeenCalledTimes(1); // Minimal verification
```

### 2. Real Collaborators for Domain, Stubs for Boundaries

```typescript
// REAL: Domain objects (entities, value objects)
const email = Email.create("test@example.com").getValue();
const password = Password.create("ValidPass123!").getValue();
const user = User.create({ email, password }).getValue();

// STUBS: Infrastructure boundaries
const userRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
};
const emailService = {
  sendConfirmationEmail: jest.fn(),
};
```

### 3. Decouple from Structure, Couple to Behavior

- Test ONLY through the public API (`execute` method)
- NEVER access internal methods or properties
- Assertions on `Result` object and observable state
- Minimal interaction verification (only for critical side effects)

### 4. State Verification Over Interaction Verification

**Prefer:**
```typescript
// Assert on returned value and state
expect(result.isSuccess).toBe(true);
expect(result.getValue().isEmailVerified).toBe(false);
```

**Avoid:**
```typescript
// Verifying exact call parameters (brittle)
expect(repository.save).toHaveBeenCalledWith({
  email: expect.objectContaining({ value: "test@example.com" }),
  name: "John Doe"
});
```

**Exception:** Verify critical side effects minimally:
```typescript
expect(emailService.sendConfirmationEmail).toHaveBeenCalledTimes(1);
```

## Test Structure (AAA Pattern)

```typescript
describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    emailService = {
      sendConfirmationEmail: jest.fn(),
    };
    useCase = new RegisterUserUseCase(userRepository, emailService);
  });

  it("should successfully register a new user", async () => {
    // Arrange
    const dto = { email: "test@example.com", password: "ValidPass123!" };
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockImplementation((user) => Promise.resolve(user));

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toBeInstanceOf(User);
    expect(result.getValue().email.value).toBe("test@example.com");
  });

  it("should return error when user already exists", async () => {
    // Arrange
    const existingUser = new UserBuilder().withEmail("test@example.com").build();
    userRepository.findByEmail.mockResolvedValue(existingUser);

    // Act
    const result = await useCase.execute({
      email: "test@example.com",
      password: "ValidPass123!"
    });

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(UserAlreadyExistsError);
  });
});
```

## Test Naming

Use descriptive behavior-focused names:
- `"should successfully register a new user"`
- `"should return error when user already exists"`
- `"should validate email format"`

## Speed Requirements

- Each test < 100ms
- No I/O operations
- No real external dependencies

## File Naming

`<use-case-name>.use-case.test.ts`

Example: `register-user.use-case.test.ts`
