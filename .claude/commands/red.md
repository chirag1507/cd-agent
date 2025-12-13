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
- Use descriptive test names that explain the behavior
- Follow the Arrange-Act-Assert pattern
- Use `data-testid` for DOM element selection
- Use `jest.fn()` for stubs and spies at boundaries

### DON'T
- Write multiple tests at once
- Write any implementation code
- Fix import errors by writing implementation (create empty stubs only)
- Add extra assertions "while you're at it"

## Test Structure by Layer

### Sociable Unit Test (Use Case)
```typescript
describe('RegisterUserUseCase', () => {
  it('should register user when email is not taken', async () => {
    // Arrange
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(user => Promise.resolve(user)),
    };
    const useCase = new RegisterUserUseCase(userRepository);
    const request = { email: 'test@example.com', password: 'ValidPass123!' };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(userRepository.save).toHaveBeenCalled();
  });
});
```

### Narrow Integration Test (Repository)
```typescript
describe('PrismaUserRepository', () => {
  it('should persist user to database', async () => {
    // Arrange - use real test database
    const repository = new PrismaUserRepository(prismaClient);
    const user = UserBuilder.aUser().build();

    // Act
    await repository.save(user);
    const found = await repository.findByEmail(user.email);

    // Assert
    expect(found).not.toBeNull();
    expect(found?.email).toBe(user.email);
  });
});
```

### Component Test (HTTP API)
```typescript
describe('POST /api/users/register', () => {
  it('should return 201 when registration succeeds', async () => {
    // Arrange
    const request = { email: 'test@example.com', password: 'ValidPass123!' };

    // Act
    const response = await supertest(app)
      .post('/api/users/register')
      .send(request);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(request.email);
  });
});
```

### Frontend Component Test
```typescript
describe('RegistrationForm', () => {
  it('should display validation error when email is invalid', async () => {
    // Arrange
    render(<RegistrationForm onSubmit={jest.fn()} />);

    // Act
    await userEvent.type(screen.getByTestId('email-input'), 'invalid-email');
    await userEvent.click(screen.getByTestId('submit-button'));

    // Assert
    expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email');
  });
});
```

## Process

1. **Identify the behavior** to test from the plan
2. **Determine the test layer** (unit, integration, component)
3. **Write the test** following the patterns above
4. **Run the test** and verify it fails for the RIGHT reason
5. **If import/syntax error**: Create minimal stub only, then re-run

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
- [ ] Test name clearly describes the expected behavior

## Output

After writing the test, report:

```
RED PHASE COMPLETE

Test: [test name]
File: [file path]
Failure: [the assertion that failed]

Ready for GREEN phase: /green
```

## Next Step

Once the test fails correctly, use `/green` to write the minimal implementation.
