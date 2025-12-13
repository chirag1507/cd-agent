# Test Doubles

> Apply when creating test doubles (stubs, spies, dummies, fakes) in any test type.

## Purpose

Ensure correct and consistent use of test doubles for fast, reliable, maintainable tests.

## Definitions (Martin Fowler)

| Type | Purpose | When to Use |
|------|---------|-------------|
| **Dummy** | Fill parameter lists | When parameter is required but not used |
| **Stub** | Provide canned answers | When test needs specific return values |
| **Spy** | Stub + records calls | When verifying interactions |
| **Mock** | Pre-programmed expectations | AVOID in Classical TDD |
| **Fake** | Simplified working implementation | Narrow Integration Tests only |

## Non-Negotiable Rules

### 1. Prefer Classical TDD (State Verification)

```typescript
// GOOD: Verify state/outcome
const result = await useCase.execute(input);
expect(result.isSuccess).toBe(true);
expect(result.getValue().email).toBe("test@example.com");

// AVOID: Strict mocking with expectations
expect(repository.findByEmail).toHaveBeenCalledWith("test@example.com");
expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({...}));
```

### 2. Use `jest.fn()` for Stubs and Spies

```typescript
// Create stub/spy
const userRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
};

// Configure as stub (canned answer)
userRepository.findByEmail.mockResolvedValue(null);
userRepository.save.mockImplementation((user) => Promise.resolve(user));

// Use as spy (verify interaction)
expect(userRepository.save).toHaveBeenCalledTimes(1);
```

### 3. Stub Boundaries, Not Domain

**STUB (I/O Boundaries):**
- Repositories
- External services
- HTTP clients
- Message queues
- Browser APIs

**REAL (Domain Collaborators):**
- Entities
- Value objects
- Domain services
- Use Cases (in integration tests)

## Stubbing Patterns with Jest

### Return Values

```typescript
// Synchronous
mock.mockReturnValue(value);

// Async resolved
mock.mockResolvedValue(value);

// Async rejected
mock.mockRejectedValue(new Error("message"));

// Custom implementation
mock.mockImplementation((arg) => {
  if (arg === "special") return specialValue;
  return defaultValue;
});
```

### Spy Verification

```typescript
// Was called
expect(spy).toHaveBeenCalled();

// Called N times
expect(spy).toHaveBeenCalledTimes(1);

// Called with specific args
expect(spy).toHaveBeenCalledWith("arg1", "arg2");

// Last call args
expect(spy).toHaveBeenLastCalledWith("lastArg");

// Access call history
const firstCallArgs = spy.mock.calls[0];
```

## When to Verify Interactions

**Verify interactions ONLY for:**
- Critical side effects (email sent, payment processed)
- Events published
- External system notifications

**Keep verification minimal:**
```typescript
// GOOD: Minimal verification
expect(emailService.sendConfirmation).toHaveBeenCalledTimes(1);

// AVOID: Over-specified verification
expect(emailService.sendConfirmation).toHaveBeenCalledWith(
  "user@example.com",
  expect.objectContaining({
    subject: "Welcome!",
    template: "confirmation",
    data: { name: "John", verifyUrl: expect.stringContaining("/verify") }
  })
);
```

## Common Patterns

### Repository Stub

```typescript
const userRepository: jest.Mocked<UserRepository> = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// Setup for "user exists" scenario
userRepository.findByEmail.mockResolvedValue(existingUser);

// Setup for "user not found" scenario
userRepository.findByEmail.mockResolvedValue(null);
```

### Service Stub

```typescript
const emailService: jest.Mocked<EmailService> = {
  sendConfirmation: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};
```

### HTTP Client Stub

```typescript
const httpClient: jest.Mocked<HttpClient> = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Successful response
httpClient.post.mockResolvedValue({
  status: 201,
  data: { id: "123", name: "Item" }
});

// Error response
httpClient.post.mockRejectedValue(new HttpError(400, "Validation failed"));
```

## Anti-Patterns to Avoid

### Over-Mocking

```typescript
// BAD: Mocking domain objects
const mockUser = { id: "1", email: { value: "test@example.com" } };

// GOOD: Use real domain objects
const user = User.create({
  email: Email.create("test@example.com").getValue(),
  password: Password.create("ValidPass123!").getValue()
}).getValue();
```

### Strict Mock Expectations

```typescript
// BAD: Pre-programmed expectations (Mockist style)
const mock = jest.fn();
mock.mockImplementation(() => {
  if (mock.mock.calls.length === 1) return "first";
  if (mock.mock.calls.length === 2) return "second";
  throw new Error("Unexpected call");
});

// GOOD: Simple stub
const stub = jest.fn().mockReturnValue("value");
```

### Testing Implementation Order

```typescript
// BAD: Verifying call order
expect(repo.findByEmail).toHaveBeenCalledBefore(repo.save);

// GOOD: Verify observable outcome
expect(result.isSuccess).toBe(true);
```

## Cleanup

Always reset mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

// Or reset specific mock
userRepository.findByEmail.mockClear();
```
