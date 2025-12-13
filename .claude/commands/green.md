---
description: TDD Green Phase - Write MINIMAL code to pass the failing test
argument-hint: [implementation hint]
---

# Green Phase: Make the Test Pass

$ARGUMENTS

(If no input provided, check conversation context for the failing test)

## The Green Phase

You are in the **GREEN** phase of the TDD cycle. Your ONLY job is to make the failing test pass with MINIMAL code.

```
    ┌─────────┐
    │   RED   │
    └────┬────┘
         │
         ▼
    ┌─────────┐
───▶│  GREEN  │  ◀── YOU ARE HERE
    │  Make   │
    │  test   │
    │  pass   │
    └────┬────┘
         │
         ▼
    ┌──────────┐
    │ REFACTOR │
    └──────────┘
```

## Rules (Non-Negotiable)

### DO
- Write the MINIMUM code to make the test pass
- Focus on the specific failure message
- Use the simplest implementation that works
- Return hard-coded values if that makes the test pass

### DON'T
- Anticipate future requirements
- Add error handling not required by the test
- Implement features not being tested
- Refactor (that's the next phase)
- Add extra methods or classes

## The Simplicity Principle

**Write the stupidest code that could possibly work.**

If the test expects a function to return `42`, write:
```typescript
function calculate(): number {
  return 42; // Yes, this is correct for GREEN phase
}
```

More tests will drive the need for actual logic. Don't jump ahead.

## Incremental Implementation

Address failures ONE at a time:

| Failure | Action |
|---------|--------|
| "X is not defined" | Create empty class/function stub |
| "X is not a function" | Add method stub |
| "Expected Y but got undefined" | Return the expected value |
| "Expected Y but got Z" | Fix the logic to return Y |

## Example Progression

**Test:**
```typescript
it('should return sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

**First run fails:** `add is not defined`
```typescript
// Minimal fix:
function add(a: number, b: number): number {
  return 0; // Just make it compile
}
```

**Second run fails:** `Expected 5 but got 0`
```typescript
// Minimal fix:
function add(a: number, b: number): number {
  return a + b; // Now implement
}
```

## Clean Architecture Considerations

When implementing, respect layer boundaries:

### Use Case Implementation
```typescript
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(request: RegisterUserRequest): Promise<Result<User, RegisterUserError>> {
    // ONLY what the test requires
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      return Result.fail(new UserAlreadyExistsError());
    }

    const user = User.create(request);
    await this.userRepository.save(user);
    return Result.ok(user);
  }
}
```

### Domain Entity
```typescript
export class User {
  private constructor(
    public readonly email: string,
    public readonly passwordHash: string
  ) {}

  static create(props: { email: string; password: string }): User {
    // ONLY validation the test requires
    return new User(props.email, props.password);
  }
}
```

## Process

1. **Read the failing test** and understand what it expects
2. **Identify the specific failure** from the test output
3. **Write minimal code** to address ONLY that failure
4. **Run the test** to verify it passes
5. **If still failing**, repeat steps 2-4

## Verification

Before moving to REFACTOR phase, confirm:
- [ ] The previously failing test now passes
- [ ] No other tests have broken
- [ ] You wrote ONLY what was needed (no extras)
- [ ] The implementation may look "incomplete" - that's OK

## Output

After making the test pass, report:

```
GREEN PHASE COMPLETE

Test: [test name]
Status: PASSING
Implementation: [brief description of what was added]

Code quality concerns to address in refactor:
- [Any obvious code smells]
- [Duplication]
- [Naming issues]

Ready for REFACTOR phase: /refactor
Or continue with next behavior: /red [next behavior]
```

## Next Steps

- **If code needs cleanup**: Use `/refactor` to improve structure
- **If code is clean enough**: Use `/red` for the next behavior
- **If feature is complete**: Use `/commit` to save progress
