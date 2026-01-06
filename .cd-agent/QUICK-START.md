# Quick Start - Testing Orchestrator in Your Project

## Using the Feature Branch in Another Project

### Method 1: Use npx directly from local path

```bash
# In your test project directory
cd /path/to/your/test-project

# Run init from the feature branch
npx /home/av19/Projects/cd-agent init --with-claude-md
```

This will copy all files including:
- ✅ 21 commands to `.claude/commands/`
- ✅ 21 rules to `.claude/rules/`
- ✅ 2 agent specs to `.claude/agents/` (orchestrator.md, tdd-agent.md)
- ✅ 4 workflow files to `.cd-agent/` (schemas, template, testing guide)
- ✅ CLAUDE.md template
- ✅ workflow-flowchart.md to `docs/`

### Method 2: Publish to npm as beta version

```bash
# In cd-agent directory
npm version 0.2.0-beta.1
npm publish --tag beta

# In your test project
npx @avesta/cd-agent@beta init --with-claude-md
```

## Verify Installation

After running init, check:

```bash
# Verify Orchestrator command exists
ls .claude/commands/orchestrate.md

# Verify workflow state files
ls .cd-agent/workflow-state.schema.json
ls .cd-agent/workflow-state.template.json
ls .cd-agent/TESTING-GUIDE.md

# Verify agent specs
ls .claude/agents/orchestrator.md
ls .claude/agents/tdd-agent.md
```

## Start Testing

Open your project in VS Code with Claude Code:

```bash
code .
```

Then in Claude Code chat, run:

```
/orchestrate help me implement user authentication
```

Should respond with: "No workflow state found. Run /cd-init first."

Then proceed through the test scenarios in `.cd-agent/test-scenarios.md`

## Quick Test Sequence

```
1. /cd-init backend
   ✓ Creates workflow-state.json

2. /orchestrate implement auth
   ⛔ Should block: "No plan exists"

3. /plan add user authentication
   ✓ Creates plan, phase → "plan"

4. approved
   ✅ Gate passed, can proceed to next phase

5. /red write test for login use case
   ✓ Writes failing test

6. /green
   ✓ Makes test pass

7. /ship
   ⛔ Should block: "Review required"
```

## View Workflow State

```bash
# Pretty-print current state
cat .cd-agent/workflow-state.json | jq '.'

# Watch state changes in real-time
watch -n 2 'cat .cd-agent/workflow-state.json | jq "{phase: .current_phase, gates: .gates}"'
```

## Full Test Scenarios

See `.cd-agent/test-scenarios.md` for 13 comprehensive test scenarios.

See `.cd-agent/TESTING-GUIDE.md` for detailed testing instructions.

## Troubleshooting

### Command not found

```bash
# Ensure orchestrate.md was copied
ls .claude/commands/orchestrate.md

# If missing, re-run init
npx /home/av19/Projects/cd-agent init --with-claude-md
```

### State file not updating

```bash
# Check permissions
ls -la .cd-agent/

# Manually create if needed
mkdir -p .cd-agent
cp .cd-agent/workflow-state.template.json .cd-agent/workflow-state.json
```

### VS Code not recognizing commands

- Restart VS Code
- Or: Cmd+Shift+P → "Developer: Reload Window"

## Next Steps After Testing

1. **Report bugs**: Open issue in cd-agent repo
2. **Suggest improvements**: Comment on agent design docs
3. **Test TDD Agent**: Use `/red`, `/green`, `/refactor` commands
4. **Test full cycle**: Run through complete feature workflow
