# Orchestrator Agent Evals

> Evaluation suite for the Orchestrator Agent following evals-first approach.

## Status: Phase 4 Complete - Baseline Established

✅ **Infrastructure Setup** (Phase 1)
✅ **Golden Dataset** (Phase 2) - 13 scenarios converted
✅ **Core Metrics** (Phase 3) - 5 metrics implemented
✅ **First Eval Suite** (Phase 4) - Tests written, baseline established

**Next:** Implement Orchestrator Agent to pass evals (Phase 5)

## Current Test Results

```bash
$ python3 -m pytest test_cases/orchestrator/test_initialization.py -v

============================= test session starts ==============================
5 failed in 0.18s

FAILED test_s1_blocks_plan_without_cd_init - Gate Enforcement score: 0.0/0.9
FAILED test_s1_contains_required_text - Missing ⛔ blocking emoji
FAILED test_s2_allows_cd_init_without_state - Route Accuracy score: 0.0/0.95
FAILED test_s2_state_validation - Phase not set to 'idle'
FAILED test_always_blocks_without_cd_init - CRITICAL gate enforcement missing
```

**This is expected!** The Orchestrator Agent doesn't exist yet. We're following the evals-first approach:

1. ✅ Write evals based on golden dataset
2. ✅ Run evals - see them fail (agent doesn't exist)
3. ⏳ Implement agent to pass evals
4. ⏳ Iterate until all evals pass

## Quick Start

### Run All Tests

```bash
cd evals
python3 -m pytest test_cases/ -v
```

### Run Specific Test Suite

```bash
# Initialization tests (S1-S2)
python3 -m pytest test_cases/orchestrator/test_initialization.py -v

# Regression tests only
python3 -m pytest test_cases/ -m regression -v
```

### Run with Detailed Output

```bash
python3 -m pytest test_cases/ -v --tb=long
```

## Project Structure

```
evals/
├── README.md                      # This file
├── requirements.txt               # Python dependencies
├── pytest.ini                     # Pytest configuration
├── .gitignore                     # Ignore reports and cache
│
├── fixtures/                      # Golden datasets
│   └── orchestrator_golden_dataset.py  # 13 test scenarios
│
├── metrics/                       # Custom evaluation metrics
│   ├── __init__.py
│   └── orchestrator_metrics.py    # 5 core metrics
│
├── test_cases/                    # Executable specifications
│   └── orchestrator/
│       ├── __init__.py
│       └── test_initialization.py # S1-S2 tests
│
├── reports/                       # Eval run results (gitignored)
└── config/                        # Future: DeepEval config
```

## Metrics Overview

### 1. GateEnforcementMetric (LLM-as-judge)
- **Target:** 100% (Critical)
- **Checks:** Blocking emoji, clear language, explanations, suggestions
- **Weight:** 70% deterministic + 30% quality

### 2. RouteAccuracyMetric (Deterministic)
- **Target:** 95% (Critical)
- **Checks:** Correct command routing based on intent
- **Type:** Clear mapping verification

### 3. BlockingMessageQualityMetric (LLM-as-judge)
- **Target:** 90% (Important)
- **Checks:** Specific reason, actionable suggestion, professional tone, examples
- **Type:** User experience quality

### 4. StateFileCorrectnessMetric (Deterministic)
- **Target:** 100% (Critical)
- **Checks:** Phase transitions, gate updates, project metadata
- **Type:** Structural validation

### 5. PhaseTransitionMetric (Hybrid)
- **Target:** 100% (Critical)
- **Checks:** State updates, transition language, history recording
- **Type:** Deterministic + LLM judgment

## Golden Dataset

13 scenarios covering all Orchestrator behaviors:

- **S1:** Fresh Project - Plan Before cd-init (Should Block)
- **S2:** Initialize Project
- **S3:** Skip to Implementation (Should Block)
- **S4:** Start Planning (After cd-init)
- **S5:** Try TDD Without Plan Approval (Should Block)
- **S6:** Approve Plan Gate
- **S7:** Spike Mode (Bypass Gates)
- **S8:** TDD Red Phase
- **S9:** TDD Green Without Failing Test (Should Block)
- **S10:** TDD Green With Failing Test
- **S11:** Ship Without Review (Should Block)
- **S12:** Full Cycle Test
- **S13:** Concurrent Feature Protection

**Regression subset:** S3, S5, S7, S9, S11 (gate enforcement focus)

## Baseline Metrics (Pre-Implementation)

Current scores with stub agent:

| Metric | Score | Threshold | Status |
|--------|-------|-----------|--------|
| Gate Enforcement | 0.0 | 0.9 | ❌ FAIL |
| Route Accuracy | 0.0 | 0.95 | ❌ FAIL |
| Blocking Message Quality | 0.25 | 0.85 | ❌ FAIL |
| State File Correctness | 0.0 | 0.95 | ❌ FAIL |

**Baseline established.** These scores will improve as the Orchestrator Agent is implemented.

## Development Workflow

### 1. Run Evals - See Failures
```bash
python3 -m pytest test_cases/orchestrator/ -v
```

### 2. Implement Agent Behavior
Edit Orchestrator Agent implementation to satisfy failing evals.

### 3. Run Evals Again - Measure Improvement
```bash
python3 -m pytest test_cases/orchestrator/ -v
```

### 4. Iterate Until All Pass
Repeat steps 1-3 until all metrics meet thresholds.

### 5. A/B Test Variations (Future)
```bash
python3 -m pytest test_cases/orchestrator/ --prompt-version=v2
```

## Integration with CI/CD (Future)

Once agent implementation begins:

```yaml
# .github/workflows/evals.yml
name: Run Orchestrator Evals

on:
  pull_request:
    paths:
      - '.claude/agents/orchestrator.md'
      - 'evals/**'
  push:
    branches: [main]

jobs:
  run-evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Dependencies
        run: |
          pip install -r evals/requirements.txt
      - name: Run Evals
        run: |
          cd evals
          python3 -m pytest test_cases/ -v --tb=short
```

## Resources

- **Strategy Document:** [../docs/evals-strategy.md](../docs/evals-strategy.md)
- **Test Scenarios:** [../.cd-agent/test-scenarios.md](../.cd-agent/test-scenarios.md)
- **DeepEval Docs:** https://docs.confident-ai.com/
- **Hamel Husain on Evals:** https://hamel.dev/blog/posts/evals/

## Philosophy

> "The best time to write evals is before you build the agent. The second best time is now."

> "Evals are not about catching errors - they're about defining success."

> "If you can't eval it, you can't improve it."

---

**Status:** Ready for Orchestrator Agent implementation
**Owner:** CD-Agent Team
**Created:** 2026-01-08
