# Evals Strategy for CD-Agent

> **Evals are to agentic systems what tests are to traditional code.**
>
> Following Hamel Husain's principles for professional AI engineering.

## Why Evals-First is Critical for Agent Development

### The TDD Parallel

**Traditional TDD:**
```
Write Test → See it Fail → Write Code → See it Pass → Refactor
```

**Agentic "TDD" (Evals-First):**
```
Write Eval → See it Fail → Improve Prompt/Agent → See it Pass → Refine
```

### Key Differences

| Aspect | Traditional Code | Agentic Systems |
|--------|------------------|-----------------|
| **Determinism** | Same input = same output | Same input ≈ similar output |
| **Debugging** | Stack traces, breakpoints | Prompt analysis, output inspection |
| **Testing** | Unit tests guarantee behavior | Evals measure probability of success |
| **Refactoring** | Safe with green tests | Requires re-validation with evals |

**This makes evals even MORE critical, not less.**

### Why Build Evals Before Agents?

1. ✅ **Clear Success Criteria** - Know what "good" looks like before building
2. ✅ **Rapid Iteration** - Test prompt changes in seconds, not hours
3. ✅ **Regression Detection** - Catch when improvements break existing behavior
4. ✅ **A/B Testing** - Compare prompts/models scientifically
5. ✅ **Confidence** - Ship agents knowing they work

## Hamel Husain's Core Principles

### Principle 1: Evals Should Be Fast
- Target: < 30 seconds for full suite
- Use parallel execution (DeepEval default)
- Use cheaper models for judging (GPT-3.5 or Claude Haiku)
- Cache expensive operations

### Principle 2: Evals Should Be Specific
- ❌ Don't test: "Is it good?"
- ✅ Do test: "Does it block without /cd-init?"
- ✅ Do test: "Does it suggest correct next step?"
- ✅ Do test: "Does it update state correctly?"

### Principle 3: Use LLM-as-a-Judge
- For subjective criteria (tone, helpfulness, clarity)
- Use GEval or custom metrics
- Define clear evaluation criteria
- Examples:
  - "Response is respectful and professional"
  - "Explanation is clear and actionable"
  - "Suggestions are contextually appropriate"

### Principle 4: Use Deterministic Checks Where Possible
- For objective criteria (contains text, state changes)
- Faster and more reliable than LLM judges
- Examples:
  - `assert "⛔" in response`
  - `assert state["current_phase"] == "idle"`
  - `assert file_exists(".cd-agent/workflow-state.json")`

### Principle 5: Track Metrics Over Time
- Regression detection across commits
- A/B test different prompts
- Monitor model performance degradation
- Establish baseline → improve → validate

## Project Structure

```
cd-agent/
├── .claude/
│   ├── agents/          # Agent specs (system prompts)
│   └── commands/        # Current commands
├── evals/               # 🆕 Eval suite
│   ├── test_cases/      # Executable test scenarios
│   │   ├── orchestrator/
│   │   │   ├── test_initialization.py
│   │   │   ├── test_gate_enforcement.py
│   │   │   ├── test_phase_transitions.py
│   │   │   └── test_exception_modes.py
│   │   └── tdd_agent/   # Future: TDD agent evals
│   ├── fixtures/        # Sample inputs, expected outputs
│   │   └── orchestrator_golden_dataset.py
│   ├── metrics/         # Custom evaluation metrics
│   │   └── orchestrator_metrics.py
│   ├── reports/         # Eval run results (gitignored)
│   └── config/          # Eval configuration
│       └── deepeval.config.py
├── tests/               # Traditional unit tests (if any)
└── package.json
```

## Golden Dataset Pattern

Convert test scenarios into structured golden dataset:

```python
# evals/fixtures/orchestrator_golden_dataset.py
GOLDEN_DATASET = [
    {
        "scenario_id": "S1",
        "name": "Fresh Project - Plan Before cd-init",
        "input": "/orchestrate plan user authentication feature",
        "context": {"state_file_exists": False},
        "expected_behavior": {
            "blocks": True,
            "suggests": "/cd-init",
            "no_planning_activity": True,
        },
        "expected_output_contains": [
            "⛔",
            "Cannot proceed",
            "Project not initialized",
            "/cd-init",
        ],
        "expected_output_not_contains": [
            "Example Mapping",
            "User Story",
        ],
    },
    # ... all 13 scenarios from test-scenarios.md
]
```

## Metrics Strategy

### For Orchestrator Agent

#### 1. Gate Enforcement Metric (Critical)
**Criteria:**
- MUST block invalid transitions with ⛔ emoji
- MUST explain WHY the action is blocked
- MUST suggest the correct next step
- MUST NOT proceed with the requested action

**Type:** LLM-as-Judge (GEval)

**Why:** Subjective elements (explanation clarity, suggestion appropriateness)

#### 2. Phase Transition Metric (Critical)
**Criteria:**
- MUST update workflow state correctly
- MUST record transition in history
- MUST set correct current_phase
- MUST route to appropriate specialist command

**Type:** Deterministic + LLM-as-Judge

**Why:** State changes are deterministic, but routing logic may need judgment

#### 3. Route Accuracy Metric (Critical)
**Criteria:**
- "plan" intent → /plan command
- "write test" intent → /red command
- "implement" intent → /green command
- Ambiguous intent → clarification question

**Type:** Deterministic

**Why:** Clear mapping, no ambiguity

#### 4. Blocking Message Quality (Important)
**Criteria:**
- Contains specific error reason
- Suggests actionable next step
- Maintains professional tone
- Includes example if applicable

**Type:** LLM-as-Judge (GEval)

**Why:** Quality assessment requires judgment

#### 5. State File Correctness (Critical)
**Criteria:**
- JSON structure matches schema
- Required fields present
- Values match expected phase
- History array updated

**Type:** Deterministic

**Why:** Structural validation, no ambiguity

## Implementation Phases

### Phase 1: Evals Infrastructure (Week 1)

**Day 1-2: Setup**
- [x] Create evals/ directory structure
- [ ] Install DeepEval + dependencies
- [ ] Configure pytest
- [ ] Set up gitignore for reports/

**Day 3-4: Golden Dataset**
- [ ] Convert test-scenarios.md to golden dataset
- [ ] Structure all 13 scenarios as data
- [ ] Add context metadata (state, files, etc.)
- [ ] Validate dataset completeness

**Day 5: Core Metrics**
- [ ] Implement GateEnforcementMetric
- [ ] Implement PhaseTransitionMetric
- [ ] Implement RouteAccuracyMetric
- [ ] Test metrics in isolation

**Day 6-7: First Eval Suite**
- [ ] Write test_initialization.py (Scenarios 1-2)
- [ ] Write test_gate_enforcement.py (Scenarios 5-6, 11)
- [ ] Run evals against current /orchestrate command
- [ ] Establish baseline metrics

### Phase 2: Complete Orchestrator Evals (Week 2)

**Day 1-3: Remaining Test Cases**
- [ ] test_planning.py (Scenarios 3-4)
- [ ] test_exception_modes.py (Scenario 7)
- [ ] test_tdd_cycle.py (Scenarios 8-10)
- [ ] test_full_cycle.py (Scenario 12)
- [ ] test_concurrent_features.py (Scenario 13)

**Day 4-5: Refinement**
- [ ] Add edge cases discovered during testing
- [ ] Improve metric sensitivity
- [ ] Optimize eval speed
- [ ] Document eval patterns

**Day 6-7: Integration**
- [ ] CI/CD integration (GitHub Actions)
- [ ] Automated reporting
- [ ] Regression test suite
- [ ] Performance benchmarks

### Phase 3: Eval-Driven Agent Development (Ongoing)

**Pattern:**
```bash
# 1. Run evals - see failures
pytest evals/test_cases/orchestrator/ -v

# 2. Improve agent (prompt, logic, tools)
vim .claude/agents/orchestrator.md

# 3. Run evals again - measure improvement
pytest evals/test_cases/orchestrator/ -v

# 4. Track progress over time
deepeval test run evals/test_cases/orchestrator/

# 5. A/B test variations
pytest evals/test_cases/orchestrator/ --prompt-version=v2
```

## Example Eval Structure

```python
# evals/test_cases/orchestrator/test_initialization.py
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval

from ..fixtures.orchestrator_golden_dataset import GOLDEN_DATASET
from ..metrics.orchestrator_metrics import (
    GateEnforcementMetric,
    BlockingMessageQualityMetric,
)

@pytest.mark.eval
@pytest.mark.parametrize(
    "scenario",
    [s for s in GOLDEN_DATASET if s["scenario_id"] in ["S1", "S2"]],
    ids=lambda s: s["scenario_id"]
)
def test_initialization_scenarios(scenario):
    """
    Test Scenarios 1-2: Project initialization and blocking

    S1: Fresh Project - Plan Before cd-init (Should Block)
    S2: Initialize Project (Should Succeed)
    """
    # Arrange
    user_input = scenario["input"]
    context = scenario["context"]

    # Act
    actual_output = orchestrator_agent.execute(
        user_input,
        context=context
    )

    # Build test case
    test_case = LLMTestCase(
        input=user_input,
        actual_output=actual_output,
        context=context,
        expected_output=scenario.get("expected_output"),
    )

    # Select appropriate metrics based on scenario
    if scenario["expected_behavior"]["blocks"]:
        metrics = [
            GateEnforcementMetric(),
            BlockingMessageQualityMetric(),
        ]
    else:
        metrics = [
            PhaseTransitionMetric(),
            StateFileCorrectnessMetric(),
        ]

    # Assert
    assert_test(test_case, metrics)

    # Deterministic checks
    if scenario["expected_behavior"]["blocks"]:
        assert "⛔" in actual_output
        for required_text in scenario["expected_output_contains"]:
            assert required_text in actual_output
```

## A/B Testing Pattern

```python
# evals/test_cases/orchestrator/test_prompt_variations.py
import pytest
from deepeval import assert_test

PROMPT_VERSIONS = {
    "v1": "Original orchestrator prompt",
    "v2": "Improved with more examples",
    "v3": "Simplified for clarity",
}

@pytest.mark.parametrize("prompt_version", ["v1", "v2", "v3"])
def test_gate_enforcement_prompt_variations(prompt_version):
    """A/B test different prompt versions for gate enforcement"""
    orchestrator = OrchestratorAgent(
        prompt=PROMPT_VERSIONS[prompt_version]
    )

    # Run standard gate enforcement eval
    test_case = LLMTestCase(...)
    assert_test(test_case, [GateEnforcementMetric()])
```

## CI/CD Integration

```yaml
# .github/workflows/evals.yml
name: Evals

on:
  pull_request:
    paths:
      - '.claude/agents/**'
      - 'evals/**'
  push:
    branches: [main]

jobs:
  run-evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          pip install deepeval pytest

      - name: Run Evals
        run: |
          pytest evals/test_cases/ -v --tb=short

      - name: Generate Report
        if: always()
        run: |
          deepeval test run evals/test_cases/

      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: eval-report
          path: evals/reports/
```

## Regression Testing

**Regression Test Suite** (subset of full suite for fast feedback):

```python
# evals/test_cases/regression_suite.py
"""
Core regression tests - run on every commit
Based on test-scenarios.md regression test list
"""

REGRESSION_SCENARIOS = [
    "S3",  # Blocking without plan
    "S5",  # Gate enforcement
    "S7",  # Spike bypass
    "S9",  # TDD state validation
    "S11", # Review gate
]

@pytest.mark.regression
@pytest.mark.parametrize(
    "scenario",
    [s for s in GOLDEN_DATASET if s["scenario_id"] in REGRESSION_SCENARIOS],
    ids=lambda s: s["scenario_id"]
)
def test_regression_scenarios(scenario):
    """Critical regression tests - must always pass"""
    # ... eval logic
```

**Usage:**
```bash
# Fast regression check (< 10 seconds)
pytest evals/test_cases/regression_suite.py -m regression

# Full eval suite (< 60 seconds)
pytest evals/test_cases/orchestrator/
```

## Success Metrics

### For Orchestrator Agent

**Target Metrics (after agent implementation):**

| Metric | Target | Critical |
|--------|--------|----------|
| Gate Enforcement Accuracy | 100% | ✅ Yes |
| Phase Transition Accuracy | 100% | ✅ Yes |
| Route Accuracy | 95% | ✅ Yes |
| Blocking Message Quality | 90% | ⚠️ Important |
| Helpful Suggestions | 85% | ⚠️ Important |
| State File Correctness | 100% | ✅ Yes |
| No False Positives | 100% | ✅ Yes |

**Regression Detection:**
- Any critical metric drop > 5% = immediate investigation
- Any important metric drop > 10% = review before merge
- Trend analysis over 10 runs

## Resources

### Hamel Husain's Essential Resources
1. [Hamel's Evals Blog Post](https://hamel.dev/blog/posts/evals/)
2. [Building LLM Applications](https://www.wandb.courses/courses/building-llm-applications)
3. [His Twitter/X threads on evals](https://twitter.com/HamelHusain)
4. [LLM Evals Tutorial (DeepLearning.AI)](https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/)

### DeepEval Documentation
1. [DeepEval Quickstart](https://docs.confident-ai.com/docs/getting-started)
2. [Custom Metrics](https://docs.confident-ai.com/docs/metrics-custom-metrics)
3. [G-Eval (LLM-as-Judge)](https://docs.confident-ai.com/docs/metrics-llm-evals)
4. [Test Cases](https://docs.confident-ai.com/docs/evaluation-test-cases)
5. [Evaluation Datasets](https://docs.confident-ai.com/docs/evaluation-datasets)

### Additional Reading
1. [Anthropic's Claude Eval Guidelines](https://docs.anthropic.com/claude/docs/guide-to-anthropics-prompt-engineering-resources)
2. [OpenAI Evals Framework](https://github.com/openai/evals)
3. [Weights & Biases LLM Course](https://www.wandb.courses/)

## Next Steps

### Immediate (Today)
1. ✅ Create this strategy document
2. ✅ Commit current work
3. [ ] Set up evals/ directory structure
4. [ ] Install DeepEval

### This Week
1. [ ] Create golden dataset from test-scenarios.md
2. [ ] Implement core metrics
3. [ ] Write first eval (Scenario 1)
4. [ ] Run it - see it fail
5. [ ] Establish baseline

### Next Week
1. [ ] Complete all 13 scenario evals
2. [ ] Set up CI/CD integration
3. [ ] Document eval patterns
4. [ ] Begin agent implementation with eval feedback

## Philosophy

> "The best time to write evals is before you build the agent. The second best time is now."
>
> "Evals are not about catching errors - they're about defining success."
>
> "If you can't eval it, you can't improve it."

---

**Status:** Ready to implement
**Owner:** CD-Agent Team
**Created:** 2026-01-07
**Last Updated:** 2026-01-07
