---
description: TDD Red Phase - Write ONE failing test
argument-hint: [behavior to test]
---

# Red Phase: Write ONE Failing Test

$ARGUMENTS

(If no input provided, check conversation context for the current behavior to test)

## The Red Phase

You are in the **RED** phase of the TDD cycle. Your ONLY job is to write ONE failing test.

```
    ┌─────────┐
───▶│   RED   │  ◀── YOU ARE HERE
    │  Write  │
    │ failing │
    │  test   │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │  GREEN  │
    └─────────┘
```

## Rules (Non-Negotiable)

### DO
- Write exactly ONE test
- Make the test fail for the RIGHT reason (assertion failure, not syntax/import error)
- Use descriptive, behavior-focused test names
- Follow the Arrange-Act-Assert pattern
- Use Test Data Builders for entity creation
- Use `jest.fn()` for stubs and spies at boundaries

### DON'T
- Write multiple tests at once
- Write any implementation code
- Fix import errors by writing implementation (create empty stubs only)
- Add extra assertions "while you're at it"

## Test Layer Selection

If the layer is not clear from context, I will ask:

```
Which test layer are you implementing?

1. Sociable Unit (BE) - Use Case behavior
2. Sociable Unit (FE) - Use Case/hooks
3. Component (BE) - HTTP vertical slice
4. Component (FE) - React component behavior
5. Narrow Integration (BE) - Repository with real DB
6. Narrow Integration (FE) - Hooks with real Use Cases
7. Contract (Consumer) - API client expectations
8. Contract (Provider) - Verifying consumer contracts
9. Acceptance - Business behavior E2E

Enter number or layer name:
```

| Layer | When to Use | Rules File |
|-------|-------------|------------|
| **Sociable Unit** (BE) | Testing Use Case behavior | `rules/sociable-unit-test.md` |
| **Sociable Unit** (FE) | Testing Use Case/hooks | `rules/sociable-unit-test-fe.md` |
| **Component** (BE) | Testing HTTP vertical slice | `rules/component-test-be.md` |
| **Component** (FE) | Testing React component behavior | `rules/component-test-fe.md` |
| **Narrow Integration** (BE) | Testing repository with real DB | `rules/narrow-integration-test.md` |
| **Narrow Integration** (FE) | Testing hooks with real Use Cases | `rules/narrow-integration-test-fe.md` |
| **Contract** (Consumer) | Testing API client expectations | `rules/contract-test-consumer.md` |
| **Contract** (Provider) | Verifying consumer contracts | `rules/contract-test-provider.md` |
| **Acceptance** | Testing business behavior E2E | `rules/acceptance-test.md` |

**IMPORTANT**: Before writing a test, read and follow the rules in the appropriate rules file.

## Key Principles (Apply to ALL Test Types)

### Test Behavior, Not Implementation

```typescript
// BAD: Testing interactions (brittle)
expect(repository.findByEmail).toHaveBeenCalledWith("test@example.com");

// GOOD: Testing state/outcome (robust)
expect(result.isSuccess).toBe(true);
expect(result.getValue().email).toBe("test@example.com");
```

### Use Test Data Builders

```typescript
// BAD: Direct instantiation
const user = User.create({ email: Email.create("test@example.com").getValue() });

// GOOD: Use builder (see rules/test-data-builders.md)
const user = new UserBuilder().withEmail("test@example.com").build();
```

### Stub Boundaries, Use Real Domain Objects

```typescript
// REAL: Domain entities and value objects
const email = Email.create("test@example.com").getValue();

// STUB: Infrastructure boundaries (see rules/test-doubles.md)
const userRepository = {
  findByEmail: jest.fn().mockResolvedValue(null),
  save: jest.fn(),
};
```

## Quick Reference by Test Type

### Sociable Unit Test (Backend Use Case)
```typescript
describe('RegisterUserUseCase', () => {
  it('should register user when email is not taken', async () => {
    // Arrange - stub boundaries, real domain
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(user => Promise.resolve(user)),
    };
    const useCase = new RegisterUserUseCase(userRepository);

    // Act
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'ValidPass123!'
    });

    // Assert - verify state, minimal interaction
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().email.value).toBe('test@example.com');
  });
});
```

### Component Test (Frontend)
```typescript
describe('RegistrationForm', () => {
  it('should display a loading indicator while submitting', () => {
    // Arrange - use builder, page object
    const props = new RegistrationFormPropsBuilder().isLoading().build();
    const { page } = renderComponent(props);

    // Assert - behavior-focused
    page.shouldBeInLoadingState();
  });
});
```

### Component Test (Backend)
```typescript
describe('POST /api/users/register', () => {
  it('should return 201 when registration succeeds', async () => {
    // Arrange
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockResolvedValue(undefined);

    // Act
    const response = await request(app)
      .post('/api/users/register')
      .send({ email: 'test@example.com', password: 'ValidPass123!' })
      .expect(201);

    // Assert
    expect(response.body.email).toBe('test@example.com');
  });
});
```

## Process

1. **Identify the behavior** to test from the plan
2. **Determine the test layer** (use table above)
3. **Read the appropriate rules file** for that test type
4. **Write the test** following the patterns in the rules
5. **Run the test** and verify it fails for the RIGHT reason
6. **If import/syntax error**: Create minimal stub only, then re-run

## Handling Import Errors

If the test fails because a class/function doesn't exist:

```typescript
// Create ONLY a stub - no implementation
export class RegisterUserUseCase {
  async execute(request: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  }
}
```

Then re-run the test. It should now fail with an assertion error, not an import error.

## Verification

Before moving to GREEN phase, confirm:
- [ ] Test is written and saved
- [ ] Test has been run
- [ ] Test fails with an ASSERTION error (not import/syntax)
- [ ] Test follows the rules for its test type
- [ ] Test name clearly describes the expected behavior

## Output

After writing the test, report:

```
RED PHASE COMPLETE

Test: [test name]
File: [file path]
Type: [Sociable Unit | Component | Integration | Contract | Acceptance]
Failure: [the assertion that failed]

Ready for GREEN phase: /green
```

## Next Step

Once the test fails correctly, use `/green` to write the minimal implementation.
