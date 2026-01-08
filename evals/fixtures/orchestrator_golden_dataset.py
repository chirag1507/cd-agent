"""
Golden Dataset for Orchestrator Agent Evaluation

Converts test scenarios from .cd-agent/test-scenarios.md into structured
eval data following the golden dataset pattern.

Each scenario defines:
- scenario_id: Unique identifier (S1-S13)
- name: Descriptive scenario name
- input: Command to orchestrator
- context: State context (file existence, current phase, etc.)
- expected_behavior: High-level behavioral expectations
- expected_output_contains: Required text/patterns in response
- expected_output_not_contains: Forbidden text/patterns
"""

GOLDEN_DATASET = [
    {
        "scenario_id": "S1",
        "name": "Fresh Project - Plan Before cd-init (Should Block)",
        "goal": "Verify that /orchestrate blocks commands when project isn't initialized",
        "input": "/orchestrate plan user authentication feature",
        "context": {
            "state_file_exists": False,
            "current_phase": None,
        },
        "expected_behavior": {
            "blocks": True,
            "suggests": "/cd-init",
            "no_planning_activity": True,
            "state_file_unchanged": True,
        },
        "expected_output_contains": [
            "⛔",
            "Cannot proceed",
            "Project not initialized",
            "/cd-init",
            "Would you like me to run `/cd-init` now?",
        ],
        "expected_output_not_contains": [
            "Example Mapping",
            "User Story",
            "Given-When-Then",
        ],
    },
    {
        "scenario_id": "S2",
        "name": "Initialize Project",
        "goal": "Verify that /orchestrate allows /cd-init even without state file",
        "input": "/orchestrate cd-init backend",
        "context": {
            "state_file_exists": False,
            "current_phase": None,
        },
        "expected_behavior": {
            "blocks": False,
            "creates_state_file": True,
            "sets_phase": "idle",
            "sets_project_type": "backend",
        },
        "expected_output_contains": [
            "initialized",
            "workflow-state.json",
        ],
        "state_validation": {
            "current_phase": "idle",
            "project.type": "backend",
            "project.initialized_at": "timestamp_exists",
        },
    },
    {
        "scenario_id": "S3",
        "name": "Skip to Implementation (Should Block)",
        "goal": "Verify blocking when trying to skip planning phase",
        "input": "/orchestrate implement user authentication",
        "context": {
            "state_file_exists": True,
            "current_phase": "idle",
            "has_plan": False,
        },
        "expected_behavior": {
            "blocks": True,
            "suggests_next_step": True,
            "mentions_missing_plan": True,
        },
        "expected_output_contains": [
            "Cannot proceed",
            "plan",
            "missing",
        ],
    },
    {
        "scenario_id": "S4",
        "name": "Start Planning (After cd-init)",
        "goal": "Verify successful routing to /plan after initialization",
        "input": "/orchestrate plan user authentication with email and password",
        "context": {
            "state_file_exists": True,
            "current_phase": "idle",
        },
        "expected_behavior": {
            "blocks": False,
            "routes_to": "/plan",
            "creates_plan": True,
            "updates_phase": "plan",
            "records_history": True,
        },
        "expected_output_contains": [
            "Example Mapping",
            "User Story",
        ],
        "state_validation": {
            "current_phase": "plan",
            "history": "has_entry_for_phase_transition",
        },
    },
    {
        "scenario_id": "S5",
        "name": "Try TDD Without Plan Approval (Should Block)",
        "goal": "Verify gate enforcement - plan must be approved before TDD",
        "input": "/orchestrate red",
        "context": {
            "state_file_exists": True,
            "current_phase": "plan",
            "gates": {
                "plan_approved": None,
            },
        },
        "expected_behavior": {
            "blocks": True,
            "mentions_gate": "plan_approved",
            "asks_for_approval": True,
            "phase_unchanged": True,
        },
        "expected_output_contains": [
            "plan_approved",
            "approval",
            "approved",
        ],
        "state_validation": {
            "gates.plan_approved": None,
            "current_phase": "plan",
        },
    },
    {
        "scenario_id": "S6",
        "name": "Approve Plan Gate",
        "goal": "Verify gate approval mechanism",
        "input": "approved",
        "context": {
            "state_file_exists": True,
            "current_phase": "plan",
            "pending_gate": "plan_approved",
        },
        "expected_behavior": {
            "blocks": False,
            "passes_gate": "plan_approved",
            "transitions_phase": True,
        },
        "state_validation": {
            "gates.plan_approved.passed": True,
            "gates.plan_approved.approver": "human",
        },
    },
    {
        "scenario_id": "S7",
        "name": "Spike Mode (Bypass Gates)",
        "goal": "Verify that /spike works even without initialization (exception mode)",
        "input": "/orchestrate spike investigate jwt libraries",
        "context": {
            "state_file_exists": False,
            "current_phase": None,
        },
        "expected_behavior": {
            "blocks": False,
            "bypasses_gates": True,
            "activates_spike_mode": True,
            "warns_disposable": True,
        },
        "expected_output_contains": [
            "🔬",
            "Spike Mode",
            "gates",
            "bypass",
            "disposable",
        ],
    },
    {
        "scenario_id": "S8",
        "name": "TDD Red Phase",
        "goal": "Verify successful TDD red phase execution",
        "input": "/orchestrate red write test for login use case",
        "context": {
            "state_file_exists": True,
            "current_phase": "tdd",
            "gates": {
                "plan_approved": {"passed": True, "approver": "human"},
            },
        },
        "expected_behavior": {
            "blocks": False,
            "routes_to": "/red",
            "writes_one_test": True,
            "updates_tdd_state": {
                "mode": "red",
                "test_status": "failing",
            },
        },
        "expected_output_contains": [
            "test",
            "failing",
        ],
        "state_validation": {
            "tdd_state.mode": "red",
            "tdd_state.test_status": "failing",
        },
    },
    {
        "scenario_id": "S9",
        "name": "TDD Green Without Failing Test (Should Block)",
        "goal": "Verify blocking when trying green without failing test",
        "input": "/orchestrate green",
        "context": {
            "state_file_exists": True,
            "current_phase": "tdd",
            "tdd_state": {
                "mode": "green",
                "test_status": "passing",
            },
        },
        "expected_behavior": {
            "blocks": True,
            "explains_no_failing_test": True,
            "suggests": "/red",
            "state_unchanged": True,
        },
        "expected_output_contains": [
            "⛔",
            "Cannot proceed",
            "No failing test",
            "/red",
        ],
    },
    {
        "scenario_id": "S10",
        "name": "TDD Green With Failing Test",
        "goal": "Verify successful TDD green phase execution",
        "input": "/orchestrate green",
        "context": {
            "state_file_exists": True,
            "current_phase": "tdd",
            "tdd_state": {
                "mode": "red",
                "test_status": "failing",
            },
        },
        "expected_behavior": {
            "blocks": False,
            "routes_to": "/green",
            "writes_minimal_code": True,
            "updates_tdd_state": {
                "mode": "green",
                "test_status": "passing",
            },
        },
        "state_validation": {
            "tdd_state.mode": "green",
            "tdd_state.test_status": "passing",
        },
    },
    {
        "scenario_id": "S11",
        "name": "Ship Without Review (Should Block)",
        "goal": "Verify review gate enforcement before shipping",
        "input": "/orchestrate ship",
        "context": {
            "state_file_exists": True,
            "current_phase": "tdd",
            "gates": {
                "review_approved": None,
            },
        },
        "expected_behavior": {
            "blocks": True,
            "mentions_gate": "review_approved",
            "suggests": "/code-review",
        },
        "expected_output_contains": [
            "⛔",
            "Cannot proceed",
            "review_approved",
            "/code-review",
        ],
        "state_validation": {
            "gates.review_approved": None,
        },
    },
    {
        "scenario_id": "S12",
        "name": "Full Cycle Test",
        "goal": "Complete end-to-end workflow through all phases",
        "input_sequence": [
            "/orchestrate cd-init fullstack",
            "/orchestrate plan add user registration",
            "approved",
            "/orchestrate acceptance-test user can register with email",
            "/orchestrate dsl",
            "/orchestrate red",
            "/orchestrate green",
            "/orchestrate refactor",
            "/orchestrate code-review",
            "approved",
            "/orchestrate commit",
            "/orchestrate ship",
        ],
        "context": {
            "state_file_exists": False,
            "current_phase": None,
        },
        "expected_behavior": {
            "blocks": False,
            "transitions_all_phases": True,
            "enforces_gates": ["plan_approved", "review_approved"],
            "completes_cycle": True,
        },
        "state_validation": {
            "final_phase": ["idle", "ship"],
            "history": "contains_all_transitions",
            "gates.plan_approved.passed": True,
            "gates.review_approved.passed": True,
        },
    },
    {
        "scenario_id": "S13",
        "name": "Concurrent Feature Protection",
        "goal": "Verify warning when starting new feature with incomplete work",
        "input": "/plan start new feature B",
        "context": {
            "state_file_exists": True,
            "current_phase": "tdd",
            "current_feature": "Feature A",
        },
        "expected_behavior": {
            "warns_incomplete_work": True,
            "asks_confirmation": True,
            "preserves_state": True,
        },
        "expected_output_contains": [
            "incomplete",
            "Feature A",
            "confirm",
        ],
    },
]


# Regression test scenarios (subset for fast feedback)
REGRESSION_SCENARIOS = ["S3", "S5", "S7", "S9", "S11"]


def get_scenario(scenario_id: str) -> dict:
    """Retrieve a scenario by ID."""
    for scenario in GOLDEN_DATASET:
        if scenario["scenario_id"] == scenario_id:
            return scenario
    raise ValueError(f"Scenario {scenario_id} not found")


def get_regression_scenarios() -> list:
    """Get all regression test scenarios."""
    return [get_scenario(sid) for sid in REGRESSION_SCENARIOS]


def get_blocking_scenarios() -> list:
    """Get all scenarios where blocking is expected."""
    return [
        s for s in GOLDEN_DATASET
        if s.get("expected_behavior", {}).get("blocks", False)
    ]


def get_gate_scenarios() -> list:
    """Get all scenarios involving gate enforcement."""
    return [
        s for s in GOLDEN_DATASET
        if "gate" in s.get("expected_behavior", {})
        or "gates" in s.get("context", {})
    ]
