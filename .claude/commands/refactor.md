---
description: TDD Refactor Phase - Improve code structure while keeping tests green
argument-hint: [refactoring focus]
---

# Refactor Phase: Improve Code Structure

$ARGUMENTS

(If no input provided, review recent implementation for improvement opportunities)

## CRITICAL: Context-Aware Rule Loading

### Phase 1: Detect Implementation Context (MANDATORY)

⚠️ **Check conversation history for test layer from `/red` command.**

If test layer context exists, proceed to Phase 2 with that context.

**If NO context exists** (e.g., `/refactor` called standalone), ask:

**"What type of code are you refactoring?"**
- Backend Controller / Use Case / Infrastructure / Domain
- Frontend Component / Use Case / Hook / Mapper

---

### Phase 2: Load Applicable Rules (MANDATORY)

Based on the test layer context from `/red` or user response, **YOU MUST read these rule files** in parallel:

| Test Layer / Implementation Type | Required Rules to Load |
|----------------------------------|------------------------|
| **Sociable Unit (BE)** → Backend Use Case | `.claude/rules/code-style.md` |
| **Component (BE)** → Backend Controller | `.claude/rules/controller-pattern-be.md`<br>`.claude/rules/infrastructure-services.md`<br>`.claude/rules/code-style.md` |
| **Narrow Integration (BE)** → Backend Infrastructure | `.claude/rules/infrastructure-services.md`<br>`.claude/rules/code-style.md` |
| **Backend Domain Entity/Value Object** | `.claude/rules/code-style.md` |
| **Sociable Unit (FE)** → Frontend Use Case | `.claude/rules/clean-architecture-fe.md`<br>`.claude/rules/code-style.md` |
| **Component (FE)** → Frontend Component | `.claude/rules/atomic-design.md`<br>`.claude/rules/clean-architecture-fe.md`<br>`.claude/rules/component-test-fe.md`<br>`.claude/rules/code-style.md` |
| **Narrow Integration (FE)** → Frontend Hook | `.claude/rules/clean-architecture-fe.md`<br>`.claude/rules/code-style.md` |
| **Frontend Mapper** | `.claude/rules/clean-architecture-fe.md`<br>`.claude/rules/code-style.md` |

**ACTION REQUIRED**: Use multiple Read tool calls in parallel to load the applicable rule files NOW.

**If you cannot read the rule files, STOP and notify the user.**

---

### Phase 3: Confirm Rules Loaded (MANDATORY CHECKPOINT)

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Context: [Test Layer from /red] → [Implementation Type]
Rules Read:
- [rule-1].md
- [rule-2].md
- [rule-3].md

Proceeding with strict rule compliance for refactoring.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

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

---

## MANDATORY: Workflow Checkpoint

After completing this command, you MUST suggest the next step:

**Current Phase**: Phase 2 (Backend) or Phase 3 (Frontend) - Implementation (TDD Cycle)

**Suggested Next Steps**:
1. **If more behaviors to implement**: `/red [next behavior]` - Continue TDD cycle
2. **If current test layer complete**: Move to next test layer (e.g., Unit → Integration → Component)
3. **If feature implementation complete**: `/code-review` - Review code quality
4. **If all layers done and reviewed**: `/commit` - Save progress with conventional commit

**Output Format**:
```
✅ REFACTOR PHASE COMPLETE

Changes Made:
- [Refactoring 1]
- [Refactoring 2]

Tests: ALL PASSING ✓

Suggested Next Step:
→ /red [next behavior] - [if more work needed in current layer]
   OR
→ /red [next test layer] - [if moving to integration/component tests]
   OR
→ /code-review - [if feature complete, review before commit]
   OR
→ /commit - [if reviewed and ready to save]

See: CLAUDE.md "TDD Cycle" and docs/workflow-flowchart.md for complete workflow
```

**DO NOT complete this command without suggesting the appropriate next step based on feature completeness.**
