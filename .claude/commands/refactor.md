---
description: TDD Refactor Phase - Improve code structure while keeping tests green
argument-hint: [refactoring focus]
---

# Refactor Phase: Improve Code Structure

$ARGUMENTS

(If no input provided, review recent implementation for improvement opportunities)

## The Refactor Phase

You are in the **REFACTOR** phase of the TDD cycle. Improve code structure while keeping ALL tests green.

```
    ┌─────────┐
    │   RED   │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │  GREEN  │
    └────┬────┘
         │
         ▼
    ┌──────────┐
───▶│ REFACTOR │  ◀── YOU ARE HERE
    │ Improve  │
    │  code    │
    │structure │
    └──────────┘
```

## Prerequisites

**STOP!** Before refactoring, verify:
- [ ] All relevant tests are PASSING
- [ ] You have run the tests recently

**If tests are failing, go back to GREEN phase first.**

## Rules (Non-Negotiable)

### DO
- Improve code readability and structure
- Remove duplication (DRY)
- Extract methods/functions for clarity
- Rename for better expressiveness
- Improve type definitions
- Refactor BOTH test and implementation code
- Run tests after each change

### DON'T
- Add new functionality
- Change behavior (tests should still pass unchanged)
- Add new tests (that's RED phase)
- Refactor if tests are failing

## Refactoring Catalog

### Code Smells to Address

| Smell | Refactoring |
|-------|-------------|
| Duplicate code | Extract Method/Function |
| Long method | Extract Method |
| Long parameter list | Introduce Parameter Object |
| Magic numbers/strings | Extract Constant |
| Poor naming | Rename Variable/Method/Class |
| Primitive obsession | Replace with Value Object |
| Feature envy | Move Method |
| Large class | Extract Class |

### Clean Architecture Refactorings

**Domain Layer:**
- Extract Value Objects from primitives
- Group related entities into Aggregates
- Define Domain Events for side effects

**Application Layer:**
- Extract Validators from Use Cases
- Create Factories for complex object creation
- Use Result type for error handling

**Infrastructure Layer:**
- Extract Mappers for data transformation
- Create Repository implementations

## Example Refactorings

### Extract Value Object
```typescript
// Before
class User {
  constructor(public email: string) {}
}

// After
class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<Email, InvalidEmailError> {
    if (!value.includes('@')) {
      return Result.fail(new InvalidEmailError());
    }
    return Result.ok(new Email(value));
  }

  toString(): string {
    return this.value;
  }
}

class User {
  constructor(public email: Email) {}
}
```

### Extract Method
```typescript
// Before
async execute(request: RegisterUserRequest): Promise<Result<User, Error>> {
  if (!request.email.includes('@')) {
    return Result.fail(new InvalidEmailError());
  }
  if (request.password.length < 8) {
    return Result.fail(new WeakPasswordError());
  }
  // ... more code
}

// After
async execute(request: RegisterUserRequest): Promise<Result<User, Error>> {
  const validationResult = this.validateRequest(request);
  if (validationResult.isFailure) {
    return validationResult;
  }
  // ... cleaner code
}

private validateRequest(request: RegisterUserRequest): Result<void, ValidationError> {
  if (!request.email.includes('@')) {
    return Result.fail(new InvalidEmailError());
  }
  if (request.password.length < 8) {
    return Result.fail(new WeakPasswordError());
  }
  return Result.ok(undefined);
}
```

### Refactor Test Code
```typescript
// Before - duplication in tests
it('test 1', () => {
  const userRepository = { findByEmail: jest.fn(), save: jest.fn() };
  const useCase = new RegisterUserUseCase(userRepository);
  // ...
});

it('test 2', () => {
  const userRepository = { findByEmail: jest.fn(), save: jest.fn() };
  const useCase = new RegisterUserUseCase(userRepository);
  // ...
});

// After - extract test setup
describe('RegisterUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    useCase = new RegisterUserUseCase(userRepository);
  });

  it('test 1', () => { /* cleaner */ });
  it('test 2', () => { /* cleaner */ });
});
```

## Process

1. **Identify the smell** - What makes the code hard to read/maintain?
2. **Choose the refactoring** - What technique addresses this smell?
3. **Make ONE small change** - Don't refactor everything at once
4. **Run tests** - Verify nothing broke
5. **Repeat** until satisfied

## Verification

After refactoring, confirm:
- [ ] All tests still pass
- [ ] Code is more readable
- [ ] Duplication is reduced
- [ ] Names are expressive
- [ ] No new behavior was added

## Output

After refactoring, report:

```
REFACTOR PHASE COMPLETE

Changes made:
- [Refactoring 1]
- [Refactoring 2]

Tests: ALL PASSING

Ready for next behavior: /red [next behavior]
Or commit progress: /commit
```

## Next Steps

- **More behaviors to implement**: Use `/red` for the next test
- **Feature complete**: Use `/commit` to save progress
- **Ready to ship**: Use `/ship` to merge
