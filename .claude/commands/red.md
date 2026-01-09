---
description: TDD Red Phase - Write ONE failing test
argument-hint: [behavior to test]
---

# Red Phase: Write ONE Failing Test

$ARGUMENTS

(If no input provided, check conversation context for the current behavior to test)

## CRITICAL: Mandatory Rule Loading

⚠️ **BEFORE PROCEEDING, YOU MUST:**

1. **Read ALL required rule files** (use multiple Read tool calls in parallel)
2. **Confirm rules are loaded** (brief acknowledgment)
3. **Follow rules strictly** (non-negotiable)

**If you cannot read the rule files, STOP and notify the user.**

---

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

## Execution Protocol

### Phase 1: Identify Test Layer

If the test layer is not clear from context, ask:

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

### Phase 2: Load Applicable Rules (MANDATORY)

Based on the test layer identified, **YOU MUST read these rule files**:

| Layer | Required Rules to Read |
|-------|------------------------|
| **Sociable Unit** (BE) | `.claude/rules/sociable-unit-test.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/test-data-builders.md`<br>`.claude/rules/code-style.md` |
| **Sociable Unit** (FE) | `.claude/rules/sociable-unit-test-fe.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/test-data-builders.md`<br>`.claude/rules/code-style.md` |
| **Component** (BE) | `.claude/rules/component-test-be.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/test-data-builders.md`<br>`.claude/rules/code-style.md` |
| **Component** (FE) | `.claude/rules/component-test-fe.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/test-data-builders.md`<br>`.claude/rules/code-style.md` |
| **Narrow Integration** (BE) | `.claude/rules/narrow-integration-test.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/code-style.md` |
| **Narrow Integration** (FE) | `.claude/rules/narrow-integration-test-fe.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/code-style.md` |
| **Contract** (Consumer) | `.claude/rules/contract-test-consumer.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/code-style.md` |
| **Contract** (Provider) | `.claude/rules/contract-test-provider.md`<br>`.claude/rules/test-doubles.md`<br>`.claude/rules/code-style.md` |
| **Acceptance** | `.claude/rules/acceptance-test.md`<br>`.claude/rules/test-flakiness.md`<br>`.claude/rules/code-style.md` |

**ACTION REQUIRED:**
- Use the Read tool to read ALL applicable rule files in parallel
- Example: For Sociable Unit (BE), read all 4 files listed above

### Phase 3: Confirm Rules Loaded (MANDATORY CHECKPOINT)

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Test Layer: [layer name]
Rules Read:
- [file 1]
- [file 2]
- [file 3]
...

Proceeding with strict rule compliance.
```

**DO NOT SKIP THIS CHECKPOINT. If you cannot confirm rules are loaded, STOP.**

### Phase 4: Write ONE Failing Test

Following the loaded rules:

1. **Identify the behavior** to test from the plan/context
2. **Write exactly ONE test** following patterns from the rules
3. **Use Test Data Builders** for entity creation (see test-data-builders.md)
4. **Stub I/O boundaries** using `jest.fn()` (see test-doubles.md)
5. **Follow code style rules** (see code-style.md)

### Phase 5: Run the Test

Run the test and verify it fails for the RIGHT reason:

- ✅ **Assertion failure** - Good! Ready for GREEN phase
- ❌ **Import/syntax error** - Create minimal stub, re-run test

### Phase 6: Verification Checklist

Before moving to GREEN phase, confirm:
- [ ] Test is written and saved
- [ ] Test has been run
- [ ] Test fails with an ASSERTION error (not import/syntax)
- [ ] Test follows all loaded rules
- [ ] Test name clearly describes expected behavior

## Handling Import Errors

If the test fails because a class/function doesn't exist, create ONLY a minimal stub:

```typescript
// Create ONLY a stub - no implementation
export class RegisterUserUseCase {
  async execute(request: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  }
}
```

Then re-run the test. It should now fail with an assertion error.

## Output Format

After completing all phases, report:

```
RED PHASE COMPLETE

Test: [test name]
File: [file path]
Type: [test layer]
Failure: [the assertion that failed]

Ready for GREEN phase: /green
```

## Next Step

Once the test fails correctly, use `/green` to write the minimal implementation.

---

## Core Principles (Summary - See Rule Files for Details)

- **ONE test at a time** - Never batch tests
- **Test behavior, not implementation** - Verify outcomes, minimize interaction verification
- **Real domain objects** - Use actual entities and value objects
- **Stub I/O boundaries** - Mock only repositories, services, HTTP clients
- **Use builders** - Decouple tests from entity construction
- **Behavior-focused names** - `"should register user when email is available"`
