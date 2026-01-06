# Orchestrator Testing Guide

> Step-by-step guide to manually test the Orchestrator Agent

## Quick Start

### Option 1: Test in This Project (cd-agent)

```bash
# You're already in the cd-agent project
# Just start testing by invoking /orchestrate
```

### Option 2: Test in a New/Different Project

**Step 1: Copy files to your test project**

```bash
# From your test project directory
TEST_PROJECT_DIR="/path/to/your/test-project"
CD_AGENT_DIR="/home/av19/Projects/cd-agent"

cd $TEST_PROJECT_DIR

# Create directories
mkdir -p .cd-agent .claude/commands

# Copy Orchestrator files
cp $CD_AGENT_DIR/.cd-agent/workflow-state.schema.json .cd-agent/
cp $CD_AGENT_DIR/.cd-agent/workflow-state.template.json .cd-agent/
cp $CD_AGENT_DIR/.claude/commands/orchestrate.md .claude/commands/

# Copy TDD agent (if testing TDD routing)
cp $CD_AGENT_DIR/.claude/agents/tdd-agent.md .claude/agents/

# Copy existing commands (if you want full routing)
cp -r $CD_AGENT_DIR/.claude/commands/* .claude/commands/
cp -r $CD_AGENT_DIR/.claude/rules/* .claude/rules/
```

**Step 2: Open your test project in Claude Code**

```bash
# In VS Code with Claude Code extension
code $TEST_PROJECT_DIR
```

## Test Execution

### Test 1: Fresh Start (No State File)

**In Claude Code chat:**

```
/orchestrate help me implement user authentication
```

**Expected Result:**
- Should say "No workflow state found"
- Should suggest running `/cd-init`
- Should NOT proceed with implementation

**Validation:**
```bash
# Check that no state file was created
ls -la .cd-agent/workflow-state.json  # Should not exist
```

---

### Test 2: Initialize Project

**In Claude Code chat:**

```
/cd-init backend
```

**Expected Result:**
- Creates `.cd-agent/workflow-state.json`
- Sets `current_phase: "idle"`
- Sets `project.type: "backend"`

**Validation:**
```bash
# Check state file was created
cat .cd-agent/workflow-state.json | jq '.current_phase'
# Should output: "idle"

cat .cd-agent/workflow-state.json | jq '.project.type'
# Should output: "backend"
```

---

### Test 3: Try to Skip to Implementation (Should Block)

**In Claude Code chat:**

```
/orchestrate implement user authentication feature
```

**Expected Result:**
- Response starts with "⛔ **Cannot proceed**"
- Mentions missing plan
- Suggests `/plan` command

**Validation:**
- Read the response - should contain blocking message
- State file phase should still be "idle"

---

### Test 4: Create a Plan

**In Claude Code chat:**

```
/plan add user authentication with email and password
```

**Expected Result:**
- Creates a plan file (`.claude/plan.md` or similar)
- Updates state to `current_phase: "plan"`
- Adds entry to history

**Validation:**
```bash
# Check phase changed
cat .cd-agent/workflow-state.json | jq '.current_phase'
# Should output: "plan"

# Check history
cat .cd-agent/workflow-state.json | jq '.history[-1]'
# Should show recent phase_entered event
```

---

### Test 5: Try TDD Without Approval (Should Block)

**In Claude Code chat:**

```
/red write test for login use case
```

**Expected Result:**
- Response mentions "Gate: plan_approved"
- Asks for approval
- Does NOT write test
- Phase stays "plan"

**Validation:**
```bash
# Check still in plan phase
cat .cd-agent/workflow-state.json | jq '.current_phase'
# Should output: "plan"

# Check gate status
cat .cd-agent/workflow-state.json | jq '.gates.plan_approved'
# Should be null
```

---

### Test 6: Approve Plan Gate

**In Claude Code chat:**

```
approved
```

**Expected Result:**
- Message: "✅ Gate passed: plan_approved"
- Transitions to next phase (atdd or tdd)
- Updates gate status in state

**Validation:**
```bash
# Check gate passed
cat .cd-agent/workflow-state.json | jq '.gates.plan_approved.passed'
# Should output: true

cat .cd-agent/workflow-state.json | jq '.gates.plan_approved.approver'
# Should output: "human"
```

---

### Test 7: Spike Mode (Bypass Gates)

**In Claude Code chat:**

```
/spike investigate JWT vs session-based auth
```

**Expected Result:**
- Message: "🔬 **Spike Mode Activated**"
- States gates are bypassed
- Warns code is disposable
- Allows exploration without gates

**Validation:**
```bash
# Check spike mode active
cat .cd-agent/workflow-state.json | jq '.exceptions.spike_mode'
# Should output: true
```

---

### Test 8: Try to Ship Without Review (Should Block)

**Prerequisites:** Have some code written

**In Claude Code chat:**

```
/ship
```

**Expected Result:**
- Response: "⛔ **Cannot proceed**: Review gate not passed"
- Suggests running `/code-review`
- Does NOT create commit

**Validation:**
- Response should contain blocking message
- No git commit should be created

---

## Quick Test Checklist

Run these in order and check each box:

- [ ] Test 1: Fresh start blocks implementation ✅
- [ ] Test 2: /cd-init creates state file ✅
- [ ] Test 3: Skipping plan is blocked ✅
- [ ] Test 4: /plan creates plan and updates state ✅
- [ ] Test 5: TDD without approval is blocked ✅
- [ ] Test 6: "approved" passes gate ✅
- [ ] Test 7: /spike bypasses gates ✅
- [ ] Test 8: Shipping without review is blocked ✅

## Debugging

### View Current State

```bash
# Pretty-print entire state
cat .cd-agent/workflow-state.json | jq '.'

# Check specific fields
cat .cd-agent/workflow-state.json | jq '.current_phase'
cat .cd-agent/workflow-state.json | jq '.gates'
cat .cd-agent/workflow-state.json | jq '.history'
cat .cd-agent/workflow-state.json | jq '.exceptions'
```

### Reset State

```bash
# Delete state file to start fresh
rm .cd-agent/workflow-state.json

# Or copy template
cp .cd-agent/workflow-state.template.json .cd-agent/workflow-state.json
```

### Check Orchestrator is Loaded

In Claude Code chat:
```
/help
```

You should see `/orchestrate` in the list of available commands.

### View Orchestrator Rules

```bash
cat .claude/commands/orchestrate.md
```

## Common Issues

### Issue: `/orchestrate` not recognized

**Solution:**
- Restart VS Code
- Or reload window: Cmd+Shift+P → "Developer: Reload Window"
- Ensure `orchestrate.md` is in `.claude/commands/`

### Issue: State file not updating

**Solution:**
- Check file permissions: `ls -la .cd-agent/`
- Manually create directory: `mkdir -p .cd-agent`
- Check JSON syntax: `cat .cd-agent/workflow-state.json | jq '.'`

### Issue: Gates not enforcing

**Solution:**
- Verify you're using `/orchestrate` prefix for routing
- Check state file has correct gate structure
- Review orchestrator logic in `orchestrate.md`

### Issue: Commands not routing

**Solution:**
- Ensure target commands exist in `.claude/commands/`
- Check routing table in `orchestrate.md`
- Verify command names match exactly

## Next Steps After Testing

1. **Report issues:** Open issue in cd-agent repo with:
   - Test scenario that failed
   - Expected vs actual behavior
   - State file contents at time of failure

2. **Request features:** If you find missing gate checks or routing needs

3. **Suggest improvements:** Better error messages, clearer blocking responses

## Advanced Testing

### Test Full Workflow Cycle

Run this complete sequence:

```
1. /cd-init fullstack
2. /plan user registration feature
3. approved
4. /acceptance-test user can register
5. /red write test for registration use case
6. /green
7. /refactor
8. /code-review
9. approved
10. /commit
11. /ship
```

Check state file after each step:
```bash
watch -n 2 'cat .cd-agent/workflow-state.json | jq "{phase: .current_phase, gates: .gates}"'
```

### Test Concurrent Features

```
1. /plan feature A
2. approved
3. /red (start implementing)
4. /plan feature B  # Should warn about incomplete feature A
```

### Test Error Recovery

```
1. Manually corrupt state file
2. Try /orchestrate command
3. Should handle gracefully
```
