---
description: Execute complete TDD cycle with layer selection
argument-hint: <behavior to implement>
---

# TDD Cycle: Complete Implementation Workflow

Execute TDD cycles across selected test layers for the specified behavior.

## Input

$ARGUMENTS

(If no input provided, check conversation context or plan for the next behavior)

## Layer Configuration

Before starting, confirm which layers to include:

### Full Stack (Default)
```
Layers: [Acceptance] → [Component] → [Unit] → [Integration] → [Contract]
```

### Common Configurations

**Backend Feature (no UI):**
```
Skip: Acceptance (UI), Frontend Component
Include: Sociable Unit → Narrow Integration → Component (API) → Contract (Provider)
```

**Frontend Feature (Full):**
```
Skip: Backend layers
Include: Use Case → Mapper → Hook → Component → Contract (Consumer)
```

**Frontend Feature (Component Only):**
```
Skip: Use Case, Repository, Contract
Include: Mapper → Hook → Component (RTL)
```

**Frontend Component (Atomic Design):**
```
Skip: Use Case, Hook, Contract
Include: Atom/Molecule/Organism Component Test (RTL)
```

**API Only:**
```
Skip: Acceptance, Frontend
Include: Sociable Unit → Narrow Integration → Component (API) → Contract
```

**Quick Prototype:**
```
Skip: Contract, Acceptance
Include: Unit → Component
```

## Ask Before Starting

Before implementing, I will ask:

```
LAYER CONFIGURATION
───────────────────
Behavior: [the behavior to implement]

Which layers do you want to include?

1. Full Stack (all layers)
2. Backend Only (Unit → Integration → Component → Contract Provider)
3. Frontend Full (Use Case → Mapper → Hook → Component → Contract Consumer)
4. Frontend Component (Mapper → Hook → Component)
5. Frontend UI Only (Atom/Molecule/Organism RTL tests)
6. API Only (Unit → Integration → Component)
7. Minimal (Unit → Component only)
8. Custom (specify layers)

Enter choice or specify custom layers to skip:
```

## The Complete TDD Cycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER: Acceptance Test (Executable Specification)                │   │
│  │ /acceptance-test → /dsl → /driver                                │   │
│  │ [Skip if: API-only, quick prototype]                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER: Sociable Unit Tests                                       │   │
│  │ TDD: RED → GREEN → REFACTOR                                      │   │
│  │ Use Case behavior with stubbed boundaries                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER: Narrow Integration Tests                                  │   │
│  │ TDD: RED → GREEN → REFACTOR                                      │   │
│  │ Repository/Adapter with real dependencies                        │   │
│  │ [Skip if: Frontend-only]                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER: Component Tests                                           │   │
│  │ TDD: RED → GREEN → REFACTOR                                      │   │
│  │ Full vertical slice (HTTP API or React Component)                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER: Contract Tests                                            │   │
│  │ Consumer (FE) or Provider (BE)                                   │   │
│  │ [Skip if: No API boundary, quick prototype]                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## TDD Within Each Layer

For each layer, execute the classic TDD cycle:

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
    ┌─────────┐     ┌─────────┐     ┌──────────┐  │
    │   RED   │────▶│  GREEN  │────▶│ REFACTOR │──┘
    │  Write  │     │  Make   │     │ Improve  │
    │ failing │     │  test   │     │  code    │
    │  test   │     │  pass   │     │structure │
    └─────────┘     └─────────┘     └──────────┘
```

### RED PHASE
- Write ONE failing test for the layer
- Test must fail for the RIGHT reason (assertion, not import)
- Follow rules for that specific test type (see `.claude/rules/`)

### GREEN PHASE
- Write MINIMAL code to pass
- Address ONLY the specific failure
- Hard-coded values are acceptable

### REFACTOR PHASE
- Improve structure while tests stay green
- Remove duplication, improve naming
- Skip if code is already clean

## Layer-Specific Rules

Each layer has specific rules to follow:

| Layer | Rules File | Key Principle |
|-------|------------|---------------|
| Sociable Unit (BE) | `rules/sociable-unit-test.md` | State over interaction verification |
| Use Case (FE) | `rules/component-test-fe.md` | Pure class, no React, mock deps |
| Mapper (FE) | `rules/component-test-fe.md` | Pure functions, no mocks needed |
| Hook (FE) | `rules/component-test-fe.md` | renderHook, waitFor, async states |
| Component (FE) | `rules/component-test-fe.md` | RTL, Page Objects, behavior focus |
| Narrow Integration | `rules/narrow-integration-test.md` | Real DB, test implementation |
| Component (BE) | `rules/component-test-be.md` | HTTP interface, mocked dependencies |
| Contract (Consumer) | `rules/contract-test-consumer.md` | Pact matchers, optional params |
| Contract (Provider) | `rules/contract-test-provider.md` | State handlers, black-box |
| Acceptance | `rules/acceptance-test.md` | Four-Layer Model, domain language |

## Frontend Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND TDD LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: USE CASE TEST                                           │   │
│  │ Pure TypeScript class - no React imports                         │   │
│  │ Test: Jest with mocked repositories/services                     │   │
│  │ File: features/<feature>/application/usecases/*.test.ts          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 2: MAPPER TEST                                             │   │
│  │ Static pure functions - domain → presentation                    │   │
│  │ Test: Jest, no mocks needed                                      │   │
│  │ File: features/<feature>/mappers/*.test.ts                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 3: HOOK TEST                                               │   │
│  │ Custom hooks with injected use cases                             │   │
│  │ Test: renderHook, waitFor, test loading/error/success states     │   │
│  │ File: features/<feature>/hooks/*.test.ts                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 4: COMPONENT TEST (RTL)                                    │   │
│  │ Atoms/Molecules/Organisms with Atomic Design                     │   │
│  │ Test: RTL, userEvent, Page Objects, behavior-focused             │   │
│  │ File: shared/components/**/*.test.tsx                            │   │
│  │       features/<feature>/components/*.test.tsx                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│                                ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 5: CONTRACT TEST (Consumer)                                │   │
│  │ Pact consumer tests for API boundaries                           │   │
│  │ Test: Pact.js, define expectations                               │   │
│  │ [Skip if: no API boundary]                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Output Format

```
═══════════════════════════════════════════════════════════════════════
TDD CYCLE: [behavior description]
═══════════════════════════════════════════════════════════════════════

CONFIGURATION
─────────────
Layers: Sociable Unit → Component (API) → Contract (Provider)
Skipped: Acceptance, Frontend, Narrow Integration

═══════════════════════════════════════════════════════════════════════
LAYER 1: SOCIABLE UNIT TEST
═══════════════════════════════════════════════════════════════════════

RED PHASE
─────────
Test: should register user when email is not taken
File: src/user/application/use-cases/register-user.use-case.test.ts
Status: FAILING ❌
Failure: expect(result.isSuccess).toBe(true) - received false

GREEN PHASE
───────────
Implementation: RegisterUserUseCase.execute()
File: src/user/application/use-cases/register-user.use-case.ts
Status: PASSING ✓

REFACTOR PHASE
──────────────
Changes: Extracted email validation to Email value object
Status: ALL TESTS PASSING ✓

═══════════════════════════════════════════════════════════════════════
LAYER 2: COMPONENT TEST (API)
═══════════════════════════════════════════════════════════════════════

RED PHASE
─────────
Test: POST /api/users/register should return 201
File: src/__tests__/component/register.component.test.ts
Status: FAILING ❌
Failure: Expected 201, received 404

GREEN PHASE
───────────
Implementation: Added route and controller wiring
File: src/user/presentation/routes/user.routes.ts
Status: PASSING ✓

REFACTOR PHASE
──────────────
Changes: None needed
Status: ALL TESTS PASSING ✓

═══════════════════════════════════════════════════════════════════════
LAYER 3: CONTRACT TEST (PROVIDER)
═══════════════════════════════════════════════════════════════════════

... [continues for each layer]

═══════════════════════════════════════════════════════════════════════
CYCLE COMPLETE ✓
═══════════════════════════════════════════════════════════════════════

Summary:
- Sociable Unit Tests: 1 added, all passing
- Component Tests: 1 added, all passing
- Contract Tests: Provider verification passing

Next steps:
- More behaviors: /cycle [next behavior]
- Save progress: /commit
- Feature complete: /ship
```

## Quick Commands

For single-layer TDD (when you know exactly what layer):

```
/red [behavior]      → Write failing test (any layer)
/green               → Make it pass
/refactor            → Improve structure
```

The `/red` command will ask which layer if not obvious from context.

## Handling Layer Dependencies

Some layers depend on others:

```
Component Test (API) ──depends on──▶ Use Case (from Unit Tests)
Contract Provider ──depends on──▶ API endpoints (from Component Tests)
Acceptance Test ──depends on──▶ Full system (all layers)
```

The cycle handles this by working bottom-up:
1. Unit tests create the Use Case
2. Component tests wire it to HTTP
3. Contract tests verify the API contract
4. Acceptance tests verify business behavior

## Integration with Workflow

```
/plan → behavioral analysis + layer selection
  │
  ▼
/cycle behavior 1 [with layer config]  ─┐
/cycle behavior 2 [with layer config]   ├─ Repeat for each behavior
/cycle behavior 3 [with layer config]  ─┘
  │
  ▼
/commit → save progress
  │
  ▼
/ship → merge to main
```

## Next Steps

After completing cycles:
- **More behaviors**: `/cycle [next behavior]`
- **Save progress**: `/commit`
- **Feature complete**: `/ship`
