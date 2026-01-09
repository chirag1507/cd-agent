# Eval Principles for Agent Testing

> Based on XP/CD principles, Hamel Husain's LLM eval guidance, and behavior-driven development

## Core Philosophy

**Test agent behavior, not implementation details.**

Just like in TDD:
- ✅ Test observable outcomes
- ✅ Test user-facing behavior
- ✅ Decouple from implementation
- ❌ Don't test internal state
- ❌ Don't test exact tool usage
- ❌ Don't over-specify output format

---

## The Golden Rule

> "If you completely rewrote the agent's internals but kept the same external behavior, would your tests still pass?"

If the answer is **NO**, your tests are too coupled to implementation.

---

## Principles from Hamel Husain's Eval Guidance

### 1. **Use LLM-as-Judge for Subjective Criteria**

```python
# ✅ GOOD: LLM evaluates quality
class BlockingMessageQualityMetric:
    """Does the blocking message help the user understand what to do next?"""

    prompt = """
    Evaluate if this message:
    1. Clearly explains WHY the action was blocked
    2. Suggests actionable next steps
    3. Is helpful and not just technical

    Message: {actual_output}
    Score: 0.0-1.0
    """
```

### 2. **Use Deterministic Checks for Objective Criteria**

```python
# ✅ GOOD: Deterministic validation
def check_contains_blocking_emoji(output: str) -> bool:
    return "⛔" in output

def check_suggests_next_step(output: str) -> bool:
    return "/cd-init" in output.lower()
```

### 3. **Combine Both Approaches**

```python
# ✅ BEST: Hybrid scoring
score = (deterministic_score * 0.4) + (llm_judge_score * 0.6)
```

### 4. **Test at the Right Abstraction Level**

```python
# ❌ BAD: Testing internal agent routing
assert "Routing to Plan Agent..." in output

# ✅ GOOD: Testing user-observable outcome
assert "Feature planning started" in output
# User doesn't care which agent handled it
```

---

## From XP/CD: Test Behavior, Not Implementation

### Example from TDD (Unit Tests)

```typescript
// ❌ BAD: Mockist/Implementation-focused
expect(repository.save).toHaveBeenCalledWith(expectedUser);
expect(emailService.send).toHaveBeenCalledTimes(1);

// ✅ GOOD: Classical/Behavior-focused
expect(result.isSuccess).toBe(true);
expect(user.isEmailVerified).toBe(false);
```

### Same Principle in Evals

```python
# ❌ BAD: Implementation-focused
expected_output_contains: [
    "Using Write tool",
    "Calling repository.save()",
    "Executing workflow transition"
]

# ✅ GOOD: Behavior-focused
expected_output_contains: [
    "Feature planning started",
    "Ready for implementation",
]
```

---

## Practical Rules for Writing Evals

### Rule 1: Test User Intent → Observable Outcome

```python
{
    "scenario_id": "S3",
    "user_intent": "Start planning a feature",  # What user wants
    "input": "I want to plan a new authentication feature",
    "expected_behavior": {
        "planning_initiated": True,  # Observable outcome
        "blocks_if_no_vision": True, # Gate enforcement
    }
}
```

**Don't test**:
- Which agent was invoked
- Exact wording of responses
- Internal state transitions
- Tool usage order

### Rule 2: Use Natural Language Inputs (When Possible)

```python
# ✅ GOOD: Natural language (real user input)
"input": "I want to start planning a new feature"

# ⚠️ OK: Command syntax (if that's the real interface)
"input": "/orchestrate plan new-feature"

# ❌ BAD: Implementation detail
"input": "Route to PlanAgent with context={phase: 'idle'}"
```

### Rule 3: Test Sequences, Not Single Interactions

```python
# ✅ GOOD: Test workflow behavior
"test_sequence": [
    {
        "input": "Initialize workflow",
        "expect": "Ready for planning"
    },
    {
        "input": "Plan new feature",
        "expect": "Planning started"  # Should work after init
    }
]

# ❌ BAD: Test isolated command without context
"input": "/plan"
"expect": Contains "plan.md"  # Doesn't test gate logic
```

### Rule 4: Assert on User-Visible Effects

```python
# ✅ GOOD: User can observe this
expected_behavior: {
    "can_proceed_to_next_phase": True,
    "shows_helpful_message": True,
    "blocks_invalid_transitions": True
}

# ❌ BAD: Internal implementation
expected_behavior: {
    "state_file_phase_field_equals_idle": True,
    "used_write_tool": True,
    "called_routing_function": True
}
```

### Rule 5: Make Tests Robust to Refactoring

```python
# ✅ GOOD: Survives agent refactoring
"expected_output_contains": [
    "planning",      # Any mention is fine
    "feature",       # Core concept present
]

# ❌ BAD: Brittle exact matching
"expected_output_exact": "✅ Planning phase initiated for feature X"
# Breaks if we improve the message wording
```

---

## Eval Structure Template

```python
{
    "scenario_id": "SXX",
    "name": "Short Description",
    "goal": "What are we validating about agent behavior?",

    # User-facing input
    "input": "Natural language user request OR command",

    # Context (if needed for setup)
    "context": {
        "current_phase": "planning",
        "has_vision": True,
    },

    # Expected BEHAVIOR (not implementation)
    "expected_behavior": {
        "action_succeeds": True,
        "gates_enforced": True,
        "helpful_feedback": True,
    },

    # Flexible validation (not over-specified)
    "expected_output_contains": [
        "key concept 1",  # Loose matching
        "key concept 2",
    ],

    "expected_output_not_contains": [
        "error indicators",
        "blocking messages",
    ],

    # Optional: State validation (minimal)
    "state_validation": {
        "phase_advanced": True,  # High-level check
        # NOT: "current_phase": "exact-value"
    }
}
```

---

## Metrics Design Principles

### Good Metric Design

1. **Focus on outcomes, not process**
   - ✅ "Did user achieve their goal?"
   - ❌ "Did agent use the right tool?"

2. **Use appropriate evaluation method**
   - Deterministic for objective criteria (emoji present, gate blocked)
   - LLM-as-Judge for subjective criteria (helpfulness, clarity)

3. **Make metrics robust**
   - Don't break when agent improves its responses
   - Flexible matching (contains, not equals)
   - Focus on meaning, not exact wording

### Example Metrics

```python
# ✅ GOOD: Behavior-focused metric
class GateEnforcementMetric(BaseMetric):
    """Verifies agent correctly blocks invalid workflow transitions."""

    def measure(self, test_case: LLMTestCase) -> float:
        # Check observable behavior
        has_block_emoji = "⛔" in test_case.actual_output
        has_explanation = len(test_case.actual_output) > 50
        suggests_next_step = any(
            step in test_case.actual_output.lower()
            for step in ["/plan", "/vision", "initialize"]
        )

        return (has_block_emoji + has_explanation + suggests_next_step) / 3

# ❌ BAD: Implementation-focused metric
class ToolUsageMetric(BaseMetric):
    """Verifies agent used Write tool to create state file."""
    # This is testing HOW, not WHAT
```

---

## Common Anti-Patterns

### Anti-Pattern 1: Over-Specification

```python
# ❌ BAD
"expected_output_exact": """✅ Project initialized successfully!

Created workflow state file: `.cd-agent/workflow-state.json`

Initial configuration:
- Current phase: idle
- Project type: backend"""

# ✅ GOOD
"expected_output_contains": ["initialized", "idle", "backend"]
```

### Anti-Pattern 2: Testing Internal State

```python
# ❌ BAD
"state_validation": {
    "current_phase": "idle",
    "last_agent": "orchestrator",
    "artifacts.plan": None,
}

# ✅ GOOD
"validation_sequence": [
    {"input": "/plan feature", "should_not_be_blocked": True}
]
```

### Anti-Pattern 3: Testing Tool Usage

```python
# ❌ BAD
"expected_behavior": {
    "used_write_tool": True,
    "called_read_before_write": True,
}

# ✅ GOOD
"expected_behavior": {
    "workflow_enabled": True,
    "next_command_works": True,
}
```

---

## Checklist Before Writing New Eval

- [ ] Am I testing user-observable behavior?
- [ ] Will this test pass if I refactor the agent internals?
- [ ] Am I using natural language input (or actual command syntax)?
- [ ] Are my assertions focused on outcomes, not process?
- [ ] Does this test a complete user workflow/scenario?
- [ ] Am I using appropriate metrics (deterministic vs LLM-judge)?
- [ ] Have I avoided over-specifying exact output format?
- [ ] Does this test actual gate enforcement, not just happy path?

---

## Example: Good vs Bad Eval

### ❌ BAD: Implementation-Focused

```python
{
    "scenario_id": "S2",
    "input": "/orchestrate cd-init backend",
    "expected_behavior": {
        "creates_workflow_state_json": True,
        "uses_write_tool": True,
        "doesnt_route_to_cd_init_skill": True,
    },
    "expected_output_exact": "✅ Project initialized...",
    "state_validation": {
        "current_phase": "idle",
        "project.type": "backend",
        "gates_passed": [],
    }
}
```

**Problems**:
- Tests HOW agent does it (Write tool, routing)
- Over-specifies exact output format
- Tests internal state structure
- Brittle - breaks with refactoring

### ✅ GOOD: Behavior-Focused

```python
{
    "scenario_id": "S2",
    "user_intent": "Enable workflow tracking for project",
    "input": "Initialize workflow for backend project",
    "expected_behavior": {
        "workflow_enabled": True,
        "subsequent_commands_not_blocked": True,
    },
    "validation_sequence": [
        {
            "step": 1,
            "action": "Initialize",
            "input": "Initialize workflow for backend",
            "expect_keywords": ["initialized", "backend", "ready"]
        },
        {
            "step": 2,
            "action": "Verify workflow works",
            "input": "/orchestrate plan new-feature",
            "should_not_contain": ["⛔", "not initialized", "Cannot proceed"]
        }
    ]
}
```

**Benefits**:
- Tests user workflow end-to-end
- Doesn't care about internal implementation
- Robust to refactoring
- Tests actual gate behavior

---

## When to Use Different Eval Types

### Unit Eval (Single Agent Behavior)
- Test one agent's decision making
- Mock all dependencies
- Fast feedback loop
- Example: "Does Plan Agent enforce vision gate?"

### Integration Eval (Multi-Agent Flow)
- Test agent-to-agent handoffs
- Test workflow gates
- Real agent instances
- Example: "Can user complete Vision → Plan → TDD flow?"

### End-to-End Eval (Full System)
- Test complete user workflows
- Real file system, real tools
- Expensive but highest confidence
- Example: "Can user ship a feature from idea to PR?"

---

## References

1. **Hamel Husain's Eval Principles**:
   - Use LLM-as-Judge for subjective criteria
   - Combine with deterministic checks
   - Test at appropriate abstraction level
   - Make evals robust to model improvements

2. **XP/CD Test Principles** (from CLAUDE.md):
   - Classical TDD: Test state, not interactions
   - Sociable Unit Tests: Real collaborators, stubbed boundaries
   - Component Tests: Test through public interface
   - Acceptance Tests: User-facing behavior only

3. **Dave Farley's Four-Layer Model**:
   - Test cases in problem-domain language
   - No implementation details in test layer
   - Focus on WHAT, not HOW

---

## Conclusion

**The Best Eval = Behavior-Driven + Robust + User-Focused**

When in doubt, ask:
> "If I showed this eval to a non-technical product owner, would they understand what user behavior is being tested?"

If yes → Good eval
If no → Too implementation-focused
