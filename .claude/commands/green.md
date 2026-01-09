---
description: TDD Green Phase - Write MINIMAL code to pass the failing test
argument-hint: [implementation hint]
---

# Green Phase: Make the Test Pass

$ARGUMENTS

(If no input provided, check conversation context for the failing test)

## CRITICAL: Context-Aware Rule Loading

### Phase 1: Detect Implementation Context (MANDATORY)

⚠️ **Check conversation history for test layer from `/red` command.**

If test layer context exists, proceed to Phase 2 with that context.

**If NO context exists** (e.g., `/green` called standalone), ask:

**"What type of code are you implementing?"**
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

Proceeding with strict rule compliance for implementation.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

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

### Backend Use Case Implementation

For technical services (tokens, email, SMS, payments), see [infrastructure-services.md](../rules/infrastructure-services.md)

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

### Backend Domain Entity
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

### Backend Controller (see [controller-pattern-be.md](../rules/controller-pattern-be.md))
```typescript
// features/authentication/presentation/controllers/register.controller.ts
export class RegisterController implements Controller {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void> {
    const { email, password, name } = httpRequest.body;

    if (!email || !password || !name) {
      httpResponse.badRequest({ error: 'Missing required fields' });
      return;
    }

    const result = await this.registerUserUseCase.execute({ email, password, name });

    if (result.isSuccess) {
      httpResponse.created(result.getValue());
      return;
    }

    const error = result.getError();

    if (error instanceof UserAlreadyExistsError) {
      httpResponse.conflict({ error: error.message });
      return;
    }

    if (error instanceof InvalidEmailError) {
      httpResponse.badRequest({ error: error.message });
      return;
    }

    httpResponse.serverError({ error: 'Unexpected error' });
  }
}
```

## Frontend Implementation Patterns

### Frontend Use Case
```typescript
// features/<feature>/application/usecases/authenticate.use-case.ts
export class AuthenticateUseCase {
  constructor(
    private readonly authRepository: AuthenticationRepository,
    private readonly navigationService: NavigationClient
  ) {}

  async execute(): Promise<void> {
    // ONLY what the test requires - no extra error handling
    const { url } = await this.authRepository.authenticate();
    this.navigationService.navigateTo(url);
  }
}
```

### Frontend Mapper
```typescript
// features/<feature>/mappers/chart-data.mapper.ts
export class ChartDataMapper {
  static toChartData(metrics: Metric[]): ChartData {
    // ONLY the transformation the test requires
    return {
      labels: metrics.map(m => m.date),
      data: metrics.map(m => m.value),
    };
  }
}
```

### Frontend Custom Hook
```typescript
// features/<feature>/hooks/useCategories.ts
export const useCategories = ({ projectId, useCase }: Dependencies) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    useCase.execute(projectId)
      .then(setCategories)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  return { categories, isLoading };
};
```

### Frontend Component - Atomic Design (MANDATORY)

**Before implementing, determine component level:**
- **Atom**: Indivisible (Button, Input, Typography) → `shared/components/atoms/`
- **Molecule**: 2-3 atoms (SearchBar, FormField) → `shared/components/molecules/`
- **Organism**: Complex sections (Navbar, AuthForm) → `shared/components/organisms/`
- **Template**: Page layouts → `shared/components/templates/`
- **Feature**: Domain-specific → `features/<feature>/components/`

**Atom Example:**
```typescript
// shared/components/atoms/Typography/Typography.tsx
export const Typography = ({ variant = 'body', children, className }: Props) => {
  return <p className={cn(variantStyles[variant], className)}>{children}</p>;
};
```

**Molecule Example:**
```typescript
// shared/components/molecules/SearchBar/SearchBar.tsx
export const SearchBar = ({ onSearch, placeholder }: Props) => {
  return (
    <div className="flex gap-2">
      <Input placeholder={placeholder} />
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
};
```

**Organism Example:**
```typescript
// shared/components/organisms/AuthForm/AuthForm.tsx
export const AuthForm = ({ onSubmit, loading }: Props) => {
  return (
    <Card>
      <CardHeader>
        <Typography variant="h2">Sign In</Typography>
      </CardHeader>
      <CardContent>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

**Feature Component Example:**
```typescript
// features/projects/components/ProjectList.tsx
export const ProjectList = ({ projects, onSelect }: Props) => {
  return (
    <div className="grid gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} onSelect={onSelect} />
      ))}
    </div>
  );
};
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

---

## MANDATORY: Workflow Checkpoint

After completing this command, you MUST suggest the next step:

**Current Phase**: Phase 2 (Backend) or Phase 3 (Frontend) - Implementation (TDD Cycle)

**Suggested Next Steps**:
1. **If code has smells/duplication**: `/refactor` - Improve structure while tests stay green
2. **If code is clean AND more behaviors needed**: `/red [next behavior]` - Continue TDD cycle
3. **If this test layer is complete**: Consider next test layer or `/code-review`
4. **If feature implementation complete**: `/code-review` - Review before commit

**Output Format**:
```
✅ GREEN PHASE COMPLETE

Test: [test name]
Status: PASSING ✓
Implementation: [what was added]

Code Quality Assessment:
- [Any code smells detected]
- [Duplication issues]
- [Naming concerns]

Suggested Next Step:
→ /refactor - [if code smells detected]
   OR
→ /red [next behavior] - [if more behaviors to implement]
   OR
→ /code-review - [if feature complete, review before commit]

See: CLAUDE.md "TDD Cycle" and docs/workflow-flowchart.md for complete workflow
```

**DO NOT complete this command without assessing code quality and suggesting the appropriate next step.**
