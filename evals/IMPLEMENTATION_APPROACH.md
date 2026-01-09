# Evals-Driven Agent Development Implementation

> Following Hamel Husain's principles for professional AI engineering

## Current Status

**Phase:** S1 and S2 Implementation (Initialization Scenarios)
**Approach:** Evals-First Development (Test-Driven Development for Agents)
**Date:** 2026-01-08

### Scenario Status

| Scenario | Goal | Status | Score |
|----------|------|--------|-------|
| **S1** | Block plan without /cd-init | ✅ PASSING | - |
| **S2** | Initialize project | 🔄 IN PROGRESS | 0.67/0.95 |

## Architecture: Agent Fleet Pattern

We're building a **fleet of specialized agents** coordinated by the Orchestrator:

```
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                     │
│  • Workflow coordination                                │
│  • Gate enforcement                                     │
│  • Routing to specialists                               │
└─────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                       │
         ▼                                       ▼
┌──────────────────┐                 ┌──────────────────┐
│ PLANNING AGENTS  │                 │ EXECUTION AGENTS │
├──────────────────┤                 ├──────────────────┤
│ • Vision         │                 │ • TDD            │
│ • Story          │                 │ • Acceptance     │
│ • Architecture   │                 │ • Pipeline       │
└──────────────────┘                 └──────────────────┘
```

## Key Insights from Hamel Husain's Framework

### 1. The Three Gulfs (from Building LLM Applications)

**Gulf of Specification:**
- Clear user intent is needed
- Our solution: Natural language prompts with Role/Objective/Instructions structure
- Example: "Initialize a backend project with workflow tracking" → Clear specification

**Gulf of Comprehension:**
- Agent needs proper tools and context
- Our solution: Read/Write tools for state management, clear agentic loop
- Problem we had: Too prescriptive instructions, agent couldn't execute

**Gulf of Generalization:**
- Need consistent behavior across scenarios
- Our solution: Golden dataset with expected behaviors, eval metrics
- Measurement: DeepEval scores with thresholds

### 2. Agentic Loop Pattern

Agents use **Observe → Decide → Act → Observe** loop:

```python
# S2 Initialization Example:
# 1. OBSERVE: Read .cd-agent/workflow-state.json (doesn't exist)
# 2. DECIDE: Parse project type from input ("backend")
# 3. ACT: Write state file with proper JSON structure
# 4. OBSERVE: Confirm write succeeded
# 5. RESPOND: Output success message with details
```

### 3. Prompt Engineering Best Practices

**Bad Approach (What we had before):**
```markdown
## SYSTEM OVERRIDE: DO THIS IMMEDIATELY
**STEP 1:** Read file
**STEP 2:** Parse type
**STEP 3:** Write JSON with PLACEHOLDER_HERE
```
❌ Too prescriptive, uses placeholders, unnatural

**Good Approach (Current):**
```markdown
## Role
You are the Orchestrator Agent...

## Objective
Ensure developers follow workflow sequence...

## Instructions
1. ALWAYS check initialization status first
2. For initialization: follow this agentic loop...
   - Observe: Use Read tool on state file
   - Decide: Parse project type
   - Act: Use Write tool with actual values

## Examples
Input: "Initialize a backend project"
Process: [step by step with real example]
Output: [expected response format]
```
✅ Natural language, clear structure, real examples

## Implementation Strategy

### Evals-First Workflow

```
┌─────────────────────────────────────────────────────┐
│ 1. WRITE EVAL (Golden Dataset + Metrics)            │
│    S2: Initialize project scenario                  │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 2. RUN EVAL - See it FAIL                          │
│    Score: 0.67/0.95 (State validation failing)      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 3. IMPROVE AGENT (Prompt + Tools)                   │
│    - Rewrite with Role/Objective/Instructions       │
│    - Add clear agentic loop                         │
│    - Provide concrete examples                      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 4. RUN EVAL - See it PASS                          │
│    Score: > 0.95 (target)                           │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 5. ITERATE to Next Scenario (S3, S4, ...)          │
│    Repeat cycle for each behavior                   │
└─────────────────────────────────────────────────────┘
```

### Why This Works

1. **Fast Feedback**: Evals run in ~30 seconds
2. **Objective Measurement**: Scores, not subjective judgment
3. **Regression Detection**: S1 must still pass when fixing S2
4. **Iterative Improvement**: Each eval failure teaches us something
5. **Confidence**: Ship when all evals pass

## Tools & Technologies

- **Eval Framework**: DeepEval (LLM-as-Judge + deterministic checks)
- **Testing**: pytest with custom fixtures
- **Agent Execution**: Claude Code CLI via subprocess
- **Metrics**: Custom GEval metrics for behavioral validation
- **Dataset**: Golden dataset from test scenarios

## Current Challenge: S2 Implementation

### Problem
S2 eval failing with score 0.67/0.95 due to:
- State file creation not being validated properly
- Agent may be timing out (120s) - suggests loop or waiting

### Root Cause Analysis
- Previous prompt was too prescriptive with "SYSTEM OVERRIDE" sections
- Used placeholder text like `PROJECT_TYPE_HERE` which confuses LLMs
- Lacked clear agentic loop structure
- Not following natural language prompt best practices

### Solution Applied
1. ✅ Rewrote prompt using Role/Objective/Instructions/Examples structure
2. ✅ Defined clear 5-step agentic loop (Observe → Decide → Act → Observe → Respond)
3. ✅ Removed placeholder text, use actual values
4. ✅ Added concrete examples with real inputs/outputs
5. 🔄 Testing now...

## Next Steps

1. **Immediate**: Confirm S2 passes with improved prompt
2. **Verify**: Run S1 regression check (must still pass)
3. **Iterate**: Move to S3, S4 once S1+S2 are stable
4. **Scale**: Apply same pattern to remaining scenarios

## Metrics for Success

**Per-Scenario Targets:**
- Gate Enforcement: 100% (critical)
- State File Correctness: >= 0.95
- Blocking Message Quality: >= 0.85
- Route Accuracy: >= 0.95

**Overall:**
- All 13 scenarios passing
- Regression suite < 10 seconds
- Full suite < 60 seconds

## References

- **Evals Strategy**: `/home/av19/Projects/cd-agent/docs/evals-strategy.md`
- **Agent Fleet Design**: `/home/av19/Projects/cd-agent/docs/agent-fleet-design.md`
- **Golden Dataset**: `/home/av19/Projects/cd-agent/evals/fixtures/orchestrator_golden_dataset.py`
- **Hamel Husain's Blog**: https://hamel.dev/blog/posts/evals/

---

**Status**: Actively developing S2 behavior with improved prompt structure
**Last Updated**: 2026-01-08 16:45 UTC
