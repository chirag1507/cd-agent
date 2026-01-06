# Orchestrator Test Scenarios

> Manual test scenarios to validate the Orchestrator Agent works correctly.

## Test Setup

1. Ensure `.cd-agent/workflow-state.json` does NOT exist (fresh start)
2. Run tests in order - they build on each other

---

## Scenario 1: Fresh Project - No State File

**Input:** `/orchestrate help me implement user login`

**Expected Response:**
- Should detect no state file exists
- Should suggest running `/cd-init` first
- Should NOT proceed with implementation

**Validation:**
- [ ] Response mentions missing workflow state
- [ ] Response suggests `/cd-init`
- [ ] No code is generated

---

## Scenario 2: Initialize Project

**Input:** `/cd-init backend`

**Expected Response:**
- Should create `.cd-agent/workflow-state.json`
- Should set `current_phase` to "idle"
- Should set `project.type` to "backend"

**Validation:**
- [ ] State file created
- [ ] Phase is "idle"
- [ ] Project type is "backend"

---

## Scenario 3: Skip to Implementation (Should Block)

**Input:** `/orchestrate implement user authentication`

**Expected Response:**
- Should block with "Cannot proceed"
- Should explain that plan is missing
- Should suggest `/plan` command

**Validation:**
- [ ] Response contains "Cannot proceed"
- [ ] Response mentions missing plan
- [ ] Response suggests next step

---

## Scenario 4: Start Planning

**Input:** `/plan user authentication with email and password`

**Expected Response:**
- Should create plan with Example Mapping
- Should update state to `current_phase: "plan"`
- Should record in history

**Validation:**
- [ ] Plan created in `.claude/plan.md` or similar
- [ ] State file shows `current_phase: "plan"`
- [ ] History has `phase_entered` event

---

## Scenario 5: Try TDD Without Plan Approval (Should Block)

**Input:** `/red`

**Expected Response:**
- Should block with gate requirement
- Should explain plan needs approval
- Should prompt for "approved" response

**Validation:**
- [ ] Response mentions gate: plan_approved
- [ ] Response asks for approval
- [ ] State NOT changed to tdd

---

## Scenario 6: Approve Plan Gate

**Input:** `approved` (after plan is complete)

**Expected Response:**
- Should pass plan_approved gate
- Should transition to next phase (atdd or tdd depending on workflow)
- Should update state

**Validation:**
- [ ] gates.plan_approved.passed = true
- [ ] gates.plan_approved.approver = "human"
- [ ] Phase transitions appropriately

---

## Scenario 7: Spike Mode (Bypass Gates)

**Input:** `/spike investigate jwt libraries`

**Expected Response:**
- Should activate spike mode
- Should clearly state gates are bypassed
- Should warn code is disposable

**Validation:**
- [ ] exceptions.spike_mode = true
- [ ] Response mentions gates bypassed
- [ ] Response warns about disposable code

---

## Scenario 8: TDD Red Phase

**Prerequisites:** Plan approved, in TDD phase

**Input:** `/red write test for login use case`

**Expected Response:**
- Should write ONE failing test
- Should update tdd_state.mode = "red"
- Should update tdd_state.test_status = "failing"

**Validation:**
- [ ] Exactly ONE test written
- [ ] Test actually fails when run
- [ ] State reflects red mode

---

## Scenario 9: TDD Green Without Failing Test (Should Block)

**Prerequisites:** No failing test exists

**Input:** `/green`

**Expected Response:**
- Should block
- Should explain no failing test exists
- Should suggest running `/red` first

**Validation:**
- [ ] Response blocks the action
- [ ] Response explains why
- [ ] Suggests correct next step

---

## Scenario 10: TDD Green With Failing Test

**Prerequisites:** Failing test from `/red`

**Input:** `/green`

**Expected Response:**
- Should write minimal code to pass test
- Should update tdd_state.mode = "green"
- Should update tdd_state.test_status = "passing"

**Validation:**
- [ ] Minimal implementation written
- [ ] Test now passes
- [ ] State reflects green mode

---

## Scenario 11: Ship Without Review (Should Block)

**Input:** `/ship`

**Expected Response:**
- Should block with missing review gate
- Should explain review is required
- Should suggest `/code-review`

**Validation:**
- [ ] Response contains "Cannot proceed"
- [ ] Mentions review requirement
- [ ] Suggests correct command

---

## Scenario 12: Full Cycle Test

**Prerequisites:** Clean state

**Sequence:**
1. `/cd-init fullstack`
2. `/plan add user registration`
3. `approved`
4. `/acceptance-test user can register with email`
5. `/dsl`
6. `/red`
7. `/green`
8. `/refactor`
9. `/code-review`
10. `approved`
11. `/commit`
12. `/ship`

**Validation:**
- [ ] Each step transitions correctly
- [ ] Gates enforced at appropriate points
- [ ] Final state is "idle" with completed feature
- [ ] History contains all transitions

---

## Scenario 13: Concurrent Feature Protection

**Prerequisites:** Feature A in progress (tdd phase)

**Input:** `/plan start new feature B`

**Expected Response:**
- Should warn about incomplete feature A
- Should ask for confirmation to switch
- Should preserve feature A state if switching

**Validation:**
- [ ] Warning about incomplete work
- [ ] Option to continue or switch
- [ ] Previous work not lost

---

## Test Results Log

| Scenario | Date | Result | Notes |
|----------|------|--------|-------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |
| 13 | | | |

---

## Regression Tests

After any changes to Orchestrator, re-run:
- Scenario 3 (blocking without plan)
- Scenario 5 (gate enforcement)
- Scenario 7 (spike bypass)
- Scenario 9 (TDD state validation)
- Scenario 11 (review gate)
