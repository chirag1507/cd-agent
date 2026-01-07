# Orchestrator Test Scenarios

> Manual test scenarios to validate the Orchestrator Agent works correctly.

## Test Setup

1. Ensure `.cd-agent/workflow-state.json` does NOT exist (fresh start)
2. Run tests in order - they build on each other
3. **CRITICAL:** Always invoke commands through `/orchestrate` to test gate enforcement
   - Example: `/orchestrate plan user authentication` (NOT just `/plan`)
   - The Orchestrator intercepts ALL requests and enforces prerequisites
   - Direct commands (e.g., `/plan`) bypass the Orchestrator and won't enforce gates

## Why Test Through /orchestrate?

Individual commands like `/plan`, `/red`, `/vision` do NOT have prerequisite checks built-in. They will work even without `/cd-init`.

The `/orchestrate` command:
- Checks workflow state (Step 2)
- Enforces prerequisites (Step 3)
- Blocks violations (Step 5)
- Routes to appropriate command (Step 6)

This simulates the future agent architecture where the Orchestrator Agent intercepts all user requests.

---

## Scenario 1: Fresh Project - Plan Before cd-init (Should Block)

**Goal:** Verify that `/orchestrate` blocks commands when project isn't initialized

**Input:** `/orchestrate plan user authentication feature`

**Expected Response:**
```
⛔ **Cannot proceed**: Project not initialized.

**Required:** Run `/cd-init` first to initialize workflow tracking.

Example:
  `/cd-init backend`
  `/cd-init frontend`
  `/cd-init fullstack`

This creates the workflow state file (.cd-agent/workflow-state.json) and sets up project structure.

**After initialization**, you can proceed with:
1. `/vision` - Define product vision (optional but recommended)
2. `/plan` - Plan your first feature
3. Other workflow commands

Would you like me to run `/cd-init` now?
```

**Validation:**
- [ ] Response contains "⛔ **Cannot proceed**"
- [ ] Response mentions "Project not initialized"
- [ ] Response suggests running `/cd-init`
- [ ] NO planning activity happens
- [ ] `.cd-agent/workflow-state.json` still does NOT exist

---

## Scenario 2: Initialize Project

**Goal:** Verify that `/orchestrate` allows `/cd-init` even without state file

**Input:** `/orchestrate cd-init backend`

**Expected Response:**
- Should create `.cd-agent/workflow-state.json`
- Should set `current_phase` to "idle"
- Should set `project.type` to "backend"
- Should initialize project structure

**Validation:**
- [ ] State file created at `.cd-agent/workflow-state.json`
- [ ] `current_phase` is "idle"
- [ ] `project.type` is "backend"
- [ ] `project.initialized_at` has timestamp

**Check state file:**
```bash
cat .cd-agent/workflow-state.json | jq '.current_phase, .project.type'
```

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

## Scenario 4: Start Planning (After cd-init)

**Prerequisites:** Scenario 2 completed (project initialized)

**Input:** `/orchestrate plan user authentication with email and password`

**Expected Response:**
- Should route to `/plan` command
- Should create plan with Example Mapping
- Should update state to `current_phase: "plan"`
- Should record in history

**Validation:**
- [ ] Plan created (in conversation or file)
- [ ] State file shows `current_phase: "plan"`
- [ ] History has entry for phase transition

**Check state:**
```bash
cat .cd-agent/workflow-state.json | jq '.current_phase'
# Should show: "plan"
```

---

## Scenario 5: Try TDD Without Plan Approval (Should Block)

**Prerequisites:** Scenario 4 completed (plan created but not approved)

**Input:** `/orchestrate red`

**Expected Response:**
- Should block with gate requirement
- Should explain plan needs approval
- Should prompt for "approved" response

**Validation:**
- [ ] Response mentions gate: `plan_approved`
- [ ] Response asks for approval
- [ ] State NOT changed to tdd phase

**Check state:**
```bash
cat .cd-agent/workflow-state.json | jq '.gates.plan_approved'
# Should show: null (not passed yet)
```

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

**Goal:** Verify that `/spike` works even without initialization (exception mode)

**Input:** `/orchestrate spike investigate jwt libraries`

**Expected Response:**
- Should allow spike even without `/cd-init`
- Should activate spike mode
- Should clearly state gates are bypassed
- Should warn code is disposable

**Validation:**
- [ ] Spike proceeds even without workflow state
- [ ] Response mentions gates bypassed
- [ ] Response warns about disposable code
- [ ] Response shows 🔬 **Spike Mode Activated**

---

## Scenario 8: TDD Red Phase

**Prerequisites:** Plan approved, in TDD phase

**Input:** `/orchestrate red write test for login use case`

**Expected Response:**
- Should route to `/red` command
- Should write ONE failing test
- Should update tdd_state.mode = "red"
- Should update tdd_state.test_status = "failing"

**Validation:**
- [ ] Exactly ONE test written
- [ ] Test actually fails when run
- [ ] State reflects red mode

**Check state:**
```bash
cat .cd-agent/workflow-state.json | jq '.tdd_state.mode, .tdd_state.test_status'
# Should show: "red" and "failing"
```

---

## Scenario 9: TDD Green Without Failing Test (Should Block)

**Prerequisites:** No failing test exists

**Input:** `/orchestrate green`

**Expected Response:**
- Should block with "Cannot proceed"
- Should explain no failing test exists
- Should suggest running `/red` first

**Validation:**
- [ ] Response blocks the action with ⛔
- [ ] Response explains "No failing test exists"
- [ ] Suggests correct next step: `/red`
- [ ] State remains unchanged

---

## Scenario 10: TDD Green With Failing Test

**Prerequisites:** Failing test from Scenario 8

**Input:** `/orchestrate green`

**Expected Response:**
- Should route to `/green` command
- Should write minimal code to pass test
- Should update tdd_state.mode = "green"
- Should update tdd_state.test_status = "passing"

**Validation:**
- [ ] Minimal implementation written (not over-engineered)
- [ ] Test now passes
- [ ] State reflects green mode

**Check state:**
```bash
cat .cd-agent/workflow-state.json | jq '.tdd_state.mode, .tdd_state.test_status'
# Should show: "green" and "passing"
```

---

## Scenario 11: Ship Without Review (Should Block)

**Input:** `/orchestrate ship`

**Expected Response:**
- Should block with missing review gate
- Should explain review is required
- Should suggest `/code-review`

**Validation:**
- [ ] Response contains "⛔ **Cannot proceed**"
- [ ] Mentions "review_approved" gate requirement
- [ ] Suggests correct command: `/code-review`
- [ ] State shows `gates.review_approved` is null

**Check state:**
```bash
cat .cd-agent/workflow-state.json | jq '.gates.review_approved'
# Should show: null (not passed yet)
```

---

## Scenario 12: Full Cycle Test

**Goal:** Complete end-to-end workflow through all phases

**Prerequisites:** Clean state (remove `.cd-agent/workflow-state.json`)

**Sequence:**
1. `/orchestrate cd-init fullstack`
2. `/orchestrate plan add user registration`
3. `approved` (approve plan gate)
4. `/orchestrate acceptance-test user can register with email`
5. `/orchestrate dsl`
6. `/orchestrate red`
7. `/orchestrate green`
8. `/orchestrate refactor`
9. `/orchestrate code-review`
10. `approved` (approve review gate)
11. `/orchestrate commit`
12. `/orchestrate ship`

**Validation:**
- [ ] Each step transitions correctly
- [ ] Gates enforced at appropriate points (plan, review)
- [ ] Final state is "idle" or "ship" with completed feature
- [ ] History contains all phase transitions

**Check final state:**
```bash
cat .cd-agent/workflow-state.json | jq '.current_phase, .history | length'
# Should show final phase and history count
```

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
