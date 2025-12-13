---
description: Execute complete TDD cycle - Red, Green, Refactor in sequence
argument-hint: <behavior to implement>
---

# TDD Cycle: Red → Green → Refactor

Execute a complete TDD cycle for the specified behavior.

## Input

$ARGUMENTS

(If no input provided, check conversation context or plan for the next behavior)

## The TDD Cycle

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

## Process

This command automates the full TDD cycle. For each behavior:

### 1. RED PHASE

**Write ONE failing test that describes the desired behavior.**

Guidelines:
- Test must fail for the RIGHT reason (assertion failure, not syntax error)
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Use `data-testid` for DOM selection
- Use `jest.fn()` for stubs at boundaries

After writing the test:
- Run the test
- Verify it fails with an ASSERTION error
- If import error, create minimal stub and re-run

### 2. GREEN PHASE

**Write MINIMAL code to make the test pass.**

Guidelines:
- Address ONLY the specific failure
- Use the simplest implementation that works
- Don't anticipate future requirements
- Hard-coded values are acceptable if they pass the test

After implementation:
- Run the test
- Verify it passes
- Verify no other tests broke

### 3. REFACTOR PHASE

**Improve code structure while keeping tests green.**

Only if needed - skip if code is already clean.

Guidelines:
- Remove duplication
- Improve naming
- Extract methods/classes
- Run tests after each change

After refactoring:
- All tests must still pass
- No new behavior added

## Cycle Options

### Standard Cycle
Implement one behavior completely:
```
/cycle register user with valid email
```

### Skip Refactor
When code is clean enough, proceed to next behavior:
```
After GREEN: "Code is clean, proceeding to next behavior"
```

### Multiple Cycles
For complex features, run multiple cycles:
```
/cycle behavior 1
/cycle behavior 2
/cycle behavior 3
```

## Test Layer Selection

Choose the appropriate test layer based on what you're building:

| Building | Test Layer | Location |
|----------|------------|----------|
| Use Case logic | Sociable Unit Test | `*.use-case.test.ts` |
| Repository | Narrow Integration | `*.integration.test.ts` |
| API endpoint | Component Test | `*.component.test.ts` |
| UI component | Component Test | `*.component.test.tsx` |
| API contract | Contract Test | `*.pact.test.ts` |

## Output Format

After each phase, report progress:

```
═══════════════════════════════════════════════════
TDD CYCLE: [behavior description]
═══════════════════════════════════════════════════

RED PHASE
─────────
Test: [test name]
File: [path]
Status: FAILING ❌
Failure: [assertion error]

GREEN PHASE
───────────
Implementation: [what was added]
File: [path]
Status: PASSING ✓

REFACTOR PHASE
──────────────
Changes: [refactorings applied, or "None needed"]
Status: ALL TESTS PASSING ✓

═══════════════════════════════════════════════════
CYCLE COMPLETE

Next: /cycle [next behavior] or /commit
═══════════════════════════════════════════════════
```

## Handling Blocks

### Test Won't Fail for Right Reason
- Check imports and syntax
- Create minimal stubs for missing classes
- Run test again

### Test Won't Pass
- Re-read the test expectations
- Check for typos
- Simplify the implementation

### Refactoring Breaks Tests
- Revert the change
- Make smaller incremental changes
- Run tests after each change

## Integration with Workflow

This cycle fits into the larger workflow:

```
/plan → behavioral analysis
  │
  ▼
/cycle behavior 1  ─┐
/cycle behavior 2   ├─ Repeat for each behavior
/cycle behavior 3  ─┘
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
