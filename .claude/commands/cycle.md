---
description: Execute complete feature implementation (Phases 2-5) with TDD and review gates
argument-hint: [feature name or continue from context]
---

# Cycle: Complete Feature Implementation Workflow

Execute Phases 2-5 of the workflow after you've completed Phase 0 (plan) and Phase 1 (feature file + DSL).

## Prerequisites

**BEFORE running /cycle, you MUST have:**
- ✅ Phase 0 COMPLETE: Feature planned with behavioral analysis (via `/plan`)
- ✅ Phase 1 COMPLETE: Gherkin feature file + DSL layer created (via `/acceptance-test` + `/dsl`)

**What /cycle will execute:**
- Phase 2: Backend Implementation (TDD)
- Phase 3: Frontend Implementation (TDD)
- Phase 4: Contract Verification
- Phase 5: System Test Implementation

## Input

$ARGUMENTS

(If no input, continue with the feature from context)

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 0: UNDERSTAND (Manual - /plan)                                        │
│ Phase 1: SYSTEM TEST DEFINITION (Manual - /acceptance-test + /dsl)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User runs: /cycle
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: BACKEND IMPLEMENTATION (with TDD)                                  │
│ ├─ Sociable Unit Tests → Use Case                                           │
│ ├─ Narrow Integration Tests → Repository                                    │
│ ├─ Component Tests → Full vertical slice                                    │
│ └─ Gate: Backend Review (automated check)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: FRONTEND IMPLEMENTATION (with TDD)                                 │
│ ├─ Use Case Tests → Use Case (no React)                                     │
│ ├─ Mapper Tests → Mappers                                                   │
│ ├─ Hook Tests → Custom Hooks                                                │
│ ├─ Component Tests → UI Components (Atomic Design)                          │
│ └─ Gate: Frontend Review (automated check)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 4: CONTRACT VERIFICATION                                              │
│ ├─ Consumer contracts (FE)                                                  │
│ ├─ Provider verification (BE)                                               │
│ └─ Gate: Contracts Verified                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: SYSTEM TEST IMPLEMENTATION                                         │
│ ├─ Step Definitions                                                         │
│ ├─ Protocol Drivers (UI/API)                                                │
│ ├─ Page Objects + Services                                                  │
│ └─ Gate: System Tests Pass                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────┐
                      │   ✅ READY TO COMMIT         │
                      │   Use: /commit               │
                      └─────────────────────────────┘
```

## Phase 2: Backend Implementation (TDD)

### 2.1 Sociable Unit Tests → Use Case

**File**: `features/<feature>/application/use-cases/<use-case>/<use-case>.use-case.test.ts`
**Rule**: `.claude/rules/sociable-unit-test.md`
**Pattern**: `.claude/rules/controller-pattern-be.md` for controllers

```
RED → GREEN → REFACTOR cycle for each behavior:

1. Write ONE failing test for use case behavior
2. Minimal implementation to pass
3. Refactor if needed (tests stay green)

Key rules:
- Real domain collaborators (entities, value objects)
- Stub boundaries (repositories, services)
- State verification over interaction verification
- Use Result<Success, DomainError> pattern
- Domain errors (UserAlreadyExistsError, InvalidEmailError, etc.)
```

### 2.2 Narrow Integration Tests → Repository

**File**: `features/<feature>/infrastructure/repositories/<repository>.integration.test.ts`
**Rule**: `.claude/rules/narrow-integration-test.md`

```
RED → GREEN → REFACTOR cycle:

1. Test repository with REAL test database
2. Verify correct data persistence
3. Test error scenarios

Key rules:
- Real test database instance
- Clean state before each test
- Test concrete implementation (PrismaUserRepository)
```

### 2.3 Component Tests → Full Vertical Slice

**File**: `features/<feature>/__tests__/component/<endpoint>.component.test.ts`
**Rule**: `.claude/rules/component-test-be.md`

```
RED → GREEN → REFACTOR cycle:

1. Test through HTTP interface (supertest)
2. Verify status codes and responses
3. Test error scenarios

Key rules:
- Test through HTTP with supertest
- Mock ALL out-of-process dependencies
- Test route → controller → use case wiring
```

### 🚦 GATE 2: Backend Review (Automated)

Before proceeding to frontend, check:
- [ ] All backend tests passing
- [ ] Clean Architecture layers respected
- [ ] Controller pattern followed (HttpRequest/HttpResponse, instanceof)
- [ ] Domain errors properly mapped to HTTP status
- [ ] No business logic in controllers

Run: Internal review against `.claude/commands/code-review.md`

## Phase 3: Frontend Implementation (TDD)

### 3.1 Use Case Tests → Use Case

**File**: `features/<feature>/application/usecases/<use-case>.use-case.test.ts`
**Rule**: `.claude/rules/sociable-unit-test-fe.md`

```
RED → GREEN → REFACTOR cycle:

1. Test use case with mocked dependencies
2. Pure TypeScript - NO React imports
3. Constructor injection for dependencies

Key rules:
- No React imports in use cases
- Mock repositories and services
- Test business logic only
```

### 3.2 Mapper Tests → Mappers

**File**: `features/<feature>/mappers/<mapper>.mapper.test.ts`
**Rule**: `.claude/rules/clean-architecture-fe.md`

```
RED → GREEN → REFACTOR cycle:

1. Test static pure functions
2. Domain → Presentation transformation
3. No mocks needed (pure functions)

Key rules:
- Static methods only
- Pure functions - no side effects
- Transform domain models to presentation
```

### 3.3 Hook Tests → Custom Hooks

**File**: `features/<feature>/hooks/<hook>.test.ts`
**Rule**: `.claude/rules/narrow-integration-test-fe.md`

```
RED → GREEN → REFACTOR cycle:

1. Use renderHook from RTL
2. Test loading/error/success states
3. Mock use cases only

Key rules:
- Use renderHook, waitFor, act
- Test state management
- Inject dependencies via props
```

### 3.4 Component Tests → UI Components

**File**: `shared/components/<level>/<Component>/<Component>.test.tsx`
**File**: `features/<feature>/components/<Component>.test.tsx`
**Rule**: `.claude/rules/component-test-fe.md`
**Rule**: `.claude/rules/atomic-design.md`

```
RED → GREEN → REFACTOR cycle:

1. Determine Atomic Design level FIRST (Atom/Molecule/Organism/Template/Feature)
2. Test user-facing behavior
3. Use Page Objects pattern
4. Use data-testid selectors

Key rules:
- MANDATORY: Determine atomic level before creating
- Test behavior, not implementation
- Use RTL + Page Objects
- Query by role/label/text, not implementation details
```

### 🚦 GATE 3: Frontend Review (Automated)

Before proceeding to contracts, check:
- [ ] All frontend tests passing
- [ ] Atomic Design hierarchy followed
- [ ] Use cases have NO React imports
- [ ] Mappers are pure static functions
- [ ] Hooks inject dependencies
- [ ] Components are thin (delegate to hooks)

Run: Internal review against `.claude/commands/code-review.md`

## Phase 4: Contract Verification

### 4.1 Consumer Contracts (Frontend)

**File**: `features/<feature>/repositories/<repository>.pact.test.ts`
**Rule**: `.claude/rules/contract-test-consumer.md`

```
Define API expectations:

1. Create Pact provider
2. Define interactions with matchers
3. Test repository against mock
4. Generate pact file

Key rules:
- Use Pact matchers (like, eachLike, regex)
- Optional parameters with defaults
- Provider states for scenarios
- DO NOT commit pact files (generated)
```

### 4.2 Provider Verification (Backend)

**File**: `src/__tests__/contract/provider-contract.test.ts`
**Rule**: `.claude/rules/contract-test-provider.md`

```
Verify provider honors contracts:

1. Fetch contracts from broker
2. Set up state handlers
3. Verify against running server
4. Publish results to broker

Key rules:
- State handlers prepare scenarios
- Black-box verification
- Mock external services
- Use can-i-deploy before release
```

### 🚦 GATE 4: Contracts Verified

Check:
- [ ] Consumer contracts generated
- [ ] Provider verification passing
- [ ] State handlers for all scenarios

## Phase 5: System Test Implementation

### 5.1 Step Definitions

**File**: `<project>-system-tests/step_definitions/<feature>.steps.ts`
**Rule**: `.claude/rules/acceptance-test.md`

```
Map Gherkin to DSL:

1. Import DSL methods
2. Map Given/When/Then to DSL calls
3. Keep steps thin (delegate to DSL)

Key rules:
- No logic in step definitions
- Delegate to DSL layer
- Use World for dependency injection
```

### 5.2 Protocol Drivers

**File**: `<project>-system-tests/drivers/<channel>/<feature>-<channel>-driver.ts`
**Rule**: `.claude/rules/acceptance-test.md`
**Command**: `/driver`

```
Implement driver interface:

1. Create UI driver (Playwright) or API driver
2. Use Page Objects for UI interactions
3. Use Services for state management (UserService, StubService)
4. CRITICAL: Use production routes for actions, back-doors for setup/verification

Key rules:
- Use production routes for WHEN steps (actions being tested)
- Use back-door routes for GIVEN steps (setup) and THEN internal state
- Delegate UI to Page Objects
- Track created data in UserService for cleanup
- Use StubService/Scenarist for external system mocking
```

### 5.3 Page Objects + Services

**File**: `<project>-system-tests/drivers/web/pages/<page>.page.ts`
**File**: `<project>-system-tests/drivers/web/services/<service>.service.ts`
**Rule**: `.claude/rules/acceptance-test.md`

```
Page Objects:
1. Extend BasePage
2. Use data-testid selectors
3. Return domain models
4. Network response capture

Services:
1. UserService: Track test data, cleanup
2. StubService: Control external systems (via Scenarist)
```

### 5.4 Test Data Builders

**File**: `<project>-system-tests/drivers/web/pages/builder/<model>.builder.ts`
**Rule**: `.claude/rules/acceptance-test.md`

```
Builder Pattern:
1. Static factory method: aRegistration()
2. Sensible defaults for all fields
3. Fluent API: withEmail(), withName()
4. Unique identifiers (timestamps) to avoid collisions
```

### 🚦 GATE 5: System Tests Pass

Check:
- [ ] All step definitions implemented
- [ ] Drivers use Page Objects
- [ ] Production routes for actions, back-doors for setup
- [ ] Test data builders used
- [ ] UserService tracks all created data
- [ ] StubService controls external systems
- [ ] All acceptance tests passing

## Execution Flow

```
1. Verify Prerequisites
   └─> Check Phase 0 (plan) and Phase 1 (feature + DSL) complete

2. Phase 2: Backend
   ├─> Sociable Unit Tests (TDD: RED → GREEN → REFACTOR)
   ├─> Narrow Integration Tests (TDD: RED → GREEN → REFACTOR)
   ├─> Component Tests (TDD: RED → GREEN → REFACTOR)
   └─> 🚦 Backend Review Gate

3. Phase 3: Frontend
   ├─> Use Case Tests (TDD: RED → GREEN → REFACTOR)
   ├─> Mapper Tests (TDD: RED → GREEN → REFACTOR)
   ├─> Hook Tests (TDD: RED → GREEN → REFACTOR)
   ├─> Component Tests (Atomic Design + TDD)
   └─> 🚦 Frontend Review Gate

4. Phase 4: Contracts
   ├─> Consumer Contracts (Frontend)
   ├─> Provider Verification (Backend)
   └─> 🚦 Contracts Verified Gate

5. Phase 5: System Tests
   ├─> Step Definitions
   ├─> Protocol Drivers (with Page Objects + Services)
   ├─> Test Data Builders
   └─> 🚦 System Tests Pass Gate

6. Ready to Commit
   └─> /commit
```

## Output Format

```
═══════════════════════════════════════════════════════════════════════
CYCLE: [Feature Name]
═══════════════════════════════════════════════════════════════════════

PREREQUISITES CHECK
───────────────────
✓ Phase 0: Plan complete (behavioral analysis)
✓ Phase 1: Feature file + DSL created

═══════════════════════════════════════════════════════════════════════
PHASE 2: BACKEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ 2.1 SOCIABLE UNIT TESTS                                             │
└─────────────────────────────────────────────────────────────────────┘

Behavior: User can register with valid email and password

🔴 RED PHASE
────────────
Test: should register user when email is not taken
File: features/authentication/application/use-cases/register-user/register-user.use-case.test.ts
Status: FAILING ❌
Reason: RegisterUserUseCase is not defined

🟢 GREEN PHASE
──────────────
Implementation: Created RegisterUserUseCase with minimal logic
Files:
  - features/authentication/application/use-cases/register-user/register-user.use-case.ts
  - features/authentication/domain/errors/authentication.error.ts (domain errors)
Status: PASSING ✓

🔵 REFACTOR PHASE
─────────────────
Changes: Extracted Email and Password value objects
Status: ALL TESTS PASSING ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 2.2 NARROW INTEGRATION TESTS                                        │
└─────────────────────────────────────────────────────────────────────┘

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: features/authentication/infrastructure/repositories/user.repository.integration.test.ts
Status: ALL TESTS PASSING ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 2.3 COMPONENT TESTS                                                 │
└─────────────────────────────────────────────────────────────────────┘

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: features/authentication/__tests__/component/register.component.test.ts
Files Created:
  - features/authentication/presentation/controllers/register.controller.ts
  - features/authentication/presentation/routes/authentication.routes.ts
  - shared/presentation/http/controller.ts (HttpRequest/HttpResponse)
Status: ALL TESTS PASSING ✓

🚦 GATE 2: BACKEND REVIEW
──────────────────────────
✓ All tests passing (3/3 layers)
✓ Clean Architecture respected
✓ Controller pattern followed (HttpRequest/HttpResponse)
✓ Domain errors mapped via instanceof
✓ No business logic in controllers

═══════════════════════════════════════════════════════════════════════
PHASE 3: FRONTEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ 3.1 USE CASE TESTS                                                  │
└─────────────────────────────────────────────────────────────────────┘

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: features/authentication/application/usecases/authenticate.use-case.test.ts
Status: ALL TESTS PASSING ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 3.2 MAPPER TESTS                                                    │
└─────────────────────────────────────────────────────────────────────┘

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: features/authentication/mappers/user.mapper.test.ts
Status: ALL TESTS PASSING ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 3.3 HOOK TESTS                                                      │
└─────────────────────────────────────────────────────────────────────┘

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: features/authentication/hooks/useAuthentication.test.ts
Status: ALL TESTS PASSING ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 3.4 COMPONENT TESTS (Atomic Design)                                │
└─────────────────────────────────────────────────────────────────────┘

Component: AuthForm
Atomic Level: ORGANISM (complex section with card + button + typography)
Location: shared/components/organisms/AuthForm/

🔴 RED → 🟢 GREEN → 🔵 REFACTOR
File: shared/components/organisms/AuthForm/AuthForm.test.tsx
Page Object: src/__tests__/page-objects/auth-form.page.ts
Status: ALL TESTS PASSING ✓

🚦 GATE 3: FRONTEND REVIEW
──────────────────────────
✓ All tests passing (4/4 layers)
✓ Atomic Design: AuthForm correctly placed in organisms/
✓ Use cases have NO React imports
✓ Mappers are pure static functions
✓ Hooks inject dependencies
✓ Components thin (delegate to hooks)

═══════════════════════════════════════════════════════════════════════
PHASE 4: CONTRACT VERIFICATION
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ 4.1 CONSUMER CONTRACTS (Frontend)                                   │
└─────────────────────────────────────────────────────────────────────┘

File: features/authentication/repositories/authentication.repository.pact.test.ts
Pact: frontend-app <-> api-service
Status: PACT FILE GENERATED ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 4.2 PROVIDER VERIFICATION (Backend)                                 │
└─────────────────────────────────────────────────────────────────────┘

File: src/__tests__/contract/provider-contract.test.ts
State Handlers:
  - "a user with valid credentials exists"
  - "no user exists with invalid email"
Status: PROVIDER VERIFICATION PASSING ✓

🚦 GATE 4: CONTRACTS VERIFIED
─────────────────────────────
✓ Consumer contracts generated
✓ Provider verification passing
✓ State handlers complete

═══════════════════════════════════════════════════════════════════════
PHASE 5: SYSTEM TEST IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ 5.1 STEP DEFINITIONS                                                │
└─────────────────────────────────────────────────────────────────────┘

File: <project>-system-tests/step_definitions/authentication.steps.ts
Mapped: Given/When/Then → AuthenticationDSL
Status: COMPLETE ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 5.2 PROTOCOL DRIVERS                                                │
└─────────────────────────────────────────────────────────────────────┘

Driver: AuthenticationWebDriver (UI)
File: <project>-system-tests/drivers/web/authentication-web-driver.ts

Implementation:
  ✓ Page Objects: SignupPage, LoginPage (via PageFactory)
  ✓ Services: UserService (tracking), StubService (external systems)
  ✓ Production routes: registerUser(), login() (actions)
  ✓ Back-door routes: createExistingUser(), validateUserNotRegistered() (setup)
  ✓ Cleanup: UserService.cleanupAllTrackedData()

Status: COMPLETE ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 5.3 PAGE OBJECTS + SERVICES                                         │
└─────────────────────────────────────────────────────────────────────┘

Page Objects:
  - SignupPage (extends BasePage)
  - LoginPage (extends BasePage)

Services:
  - UserService: setToken(), trackCreatedProjectId(), cleanupAllTrackedData()
  - StubService: simulateGitHubAuthProviderSuccess/Failure()

Builders:
  - RegistrationDetailsBuilder.aRegistration().withEmail().build()

Status: COMPLETE ✓

┌─────────────────────────────────────────────────────────────────────┐
│ 5.4 RUN ACCEPTANCE TESTS                                            │
└─────────────────────────────────────────────────────────────────────┘

Feature: User Authentication
  Scenario: User can register with valid credentials ✓
  Scenario: User cannot register with existing email ✓
  Scenario: User can login after registration ✓

Status: ALL SCENARIOS PASSING ✓

🚦 GATE 5: SYSTEM TESTS PASS
────────────────────────────
✓ Step definitions complete
✓ Drivers use Page Objects
✓ Production routes for actions
✓ Back-door routes for setup/verification
✓ Test data builders implemented
✓ UserService tracks data
✓ StubService controls external systems
✓ ALL ACCEPTANCE TESTS PASSING

═══════════════════════════════════════════════════════════════════════
✅ FEATURE COMPLETE - READY TO COMMIT
═══════════════════════════════════════════════════════════════════════

Summary:
────────
✓ Backend: 3 test layers passing
✓ Frontend: 4 test layers passing
✓ Contracts: Verified
✓ System Tests: All scenarios passing

Files Created: 24
Tests Added: 18
Coverage: 100%

Next Steps:
───────────
/commit → Create conventional commit
/ship   → Merge to main
```

## Rules Applied

This command automatically applies all relevant rules:

**Backend:**
- `sociable-unit-test.md` - Use case tests
- `narrow-integration-test.md` - Repository tests
- `component-test-be.md` - API tests
- `controller-pattern-be.md` - Controller implementation
- `contract-test-provider.md` - Contract verification
- `test-doubles.md` - Stubbing patterns
- `test-data-builders.md` - Test data creation
- `code-style.md` - NO "WHAT" comments

**Frontend:**
- `clean-architecture-fe.md` - Layer structure
- `atomic-design.md` - Component hierarchy
- `sociable-unit-test-fe.md` - Use case tests
- `narrow-integration-test-fe.md` - Hook tests
- `component-test-fe.md` - Component tests
- `contract-test-consumer.md` - Consumer contracts
- `test-data-builders.md` - Test data creation
- `code-style.md` - NO "WHAT" comments

**System Tests:**
- `acceptance-test.md` - Four-Layer Model, builders, page objects, services

## Important Notes

1. **Prerequisites are MANDATORY**: /cycle will fail if Phase 0 and Phase 1 are not complete
2. **Gates are automated**: Each gate runs checks before proceeding
3. **Atomic Design is enforced**: Frontend components MUST determine level before creation
4. **Controller pattern is enforced**: Backend controllers MUST use HttpRequest/HttpResponse + instanceof
5. **NO "WHAT" comments**: Code must be self-documenting
6. **Production vs Back-door routes**: System tests MUST use production routes for actions

## When to Use /cycle

✅ Use /cycle when:
- You have a complete feature to implement
- You've completed behavioral analysis
- You've created the feature file + DSL
- You want automated TDD through all layers

❌ Don't use /cycle when:
- You just want to test one layer (use `/red`, `/green`, `/refactor`)
- You haven't planned the feature yet (use `/plan` first)
- You haven't created the feature file (use `/acceptance-test` first)
