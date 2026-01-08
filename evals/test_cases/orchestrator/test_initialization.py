"""
Orchestrator Initialization Tests

Tests Scenarios 1-2 from the golden dataset:
- S1: Fresh Project - Plan Before cd-init (Should Block)
- S2: Initialize Project (Should Succeed)

These tests will FAIL initially since the Orchestrator Agent doesn't exist yet.
This is expected - we're following evals-first approach (like TDD).
"""

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase

# Import golden dataset and metrics
import sys
from pathlib import Path

# Add parent directory to path to import fixtures and metrics
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fixtures.orchestrator_golden_dataset import get_scenario
from metrics.orchestrator_metrics import (
    GateEnforcementMetric,
    BlockingMessageQualityMetric,
    RouteAccuracyMetric,
    StateFileCorrectnessMetric,
)


# Mock Orchestrator Agent (placeholder until real implementation)
class MockOrchestratorAgent:
    """
    Placeholder Orchestrator Agent.

    This will be replaced with the real agent implementation.
    For now, it returns a stub response to establish the eval infrastructure.
    """

    def execute(self, user_input: str, context: dict = None) -> str:
        """
        Execute orchestrator command.

        Args:
            user_input: User command (e.g., "/orchestrate plan feature")
            context: State context (state_file_exists, current_phase, etc.)

        Returns:
            Agent response as string
        """
        # Stub implementation - will fail evals
        return "Orchestrator agent not implemented yet"


@pytest.fixture
def orchestrator_agent():
    """Fixture providing Orchestrator Agent instance."""
    return MockOrchestratorAgent()


@pytest.mark.eval
class TestInitialization:
    """
    Test suite for Orchestrator initialization scenarios.

    Following the evals-first approach:
    1. Write evals based on golden dataset
    2. Run evals - see them fail (agent doesn't exist)
    3. Implement agent to pass evals
    4. Iterate until all evals pass
    """

    def test_s1_blocks_plan_without_cd_init(self, orchestrator_agent):
        """
        Scenario 1: Fresh Project - Plan Before cd-init (Should Block)

        Goal: Verify that /orchestrate blocks commands when project isn't initialized

        Expected behavior:
        - Should block with ⛔ emoji
        - Should explain "Project not initialized"
        - Should suggest "/cd-init"
        - Should NOT proceed with planning
        """
        # Arrange
        scenario = get_scenario("S1")
        user_input = scenario["input"]
        context = scenario["context"]

        # Act
        actual_output = orchestrator_agent.execute(user_input, context)

        # Build test case
        test_case = LLMTestCase(
            input=user_input,
            actual_output=actual_output,
            context=[
                f"State file exists: {context['state_file_exists']}",
                f"Current phase: {context['current_phase']}",
            ],
        )

        # Assert with metrics
        gate_metric = GateEnforcementMetric(threshold=0.9)
        message_quality_metric = BlockingMessageQualityMetric(threshold=0.85)

        # These assertions will FAIL until agent is implemented
        assert_test(test_case, [gate_metric, message_quality_metric])

        # Deterministic checks
        assert "⛔" in actual_output, "Response should contain blocking emoji"
        assert "Cannot proceed" in actual_output or "can't proceed" in actual_output.lower()
        assert "Project not initialized" in actual_output or "not initialized" in actual_output.lower()
        assert "/cd-init" in actual_output, "Response should suggest /cd-init"

        # Should NOT contain planning activity
        planning_indicators = ["Example Mapping", "User Story", "Given-When-Then"]
        for indicator in planning_indicators:
            assert indicator not in actual_output, f"Should not contain '{indicator}' when blocking"

    def test_s1_contains_required_text(self, orchestrator_agent):
        """
        Scenario 1: Verify all required text is present in blocking message.

        This is a deterministic check complementing the metric-based evaluation.
        """
        scenario = get_scenario("S1")
        actual_output = orchestrator_agent.execute(
            scenario["input"],
            scenario["context"]
        )

        # Check all required text from expected_output_contains
        for required_text in scenario["expected_output_contains"]:
            assert required_text in actual_output, (
                f"Response missing required text: '{required_text}'"
            )

        # Check forbidden text from expected_output_not_contains
        for forbidden_text in scenario["expected_output_not_contains"]:
            assert forbidden_text not in actual_output, (
                f"Response contains forbidden text: '{forbidden_text}'"
            )

    def test_s2_allows_cd_init_without_state(self, orchestrator_agent):
        """
        Scenario 2: Initialize Project

        Goal: Verify that /orchestrate allows /cd-init even without state file

        Expected behavior:
        - Should allow the command
        - Should route to /cd-init
        - Should indicate state file creation
        - Should set phase to "idle"
        - Should set project type to "backend"
        """
        # Arrange
        scenario = get_scenario("S2")
        user_input = scenario["input"]
        context = scenario["context"]

        # Act
        actual_output = orchestrator_agent.execute(user_input, context)

        # Build test case
        test_case = LLMTestCase(
            input=user_input,
            actual_output=actual_output,
            context=[
                f"State file exists: {context['state_file_exists']}",
                f"Command: cd-init backend",
            ],
        )

        # Assert with metrics
        route_metric = RouteAccuracyMetric(expected_route="/cd-init", threshold=0.95)
        state_metric = StateFileCorrectnessMetric(
            expected_state=scenario.get("state_validation", {}),
            threshold=0.95
        )

        # These assertions will FAIL until agent is implemented
        assert_test(test_case, [route_metric, state_metric])

        # Deterministic checks
        assert "initialized" in actual_output.lower() or "created" in actual_output.lower()
        assert "workflow-state.json" in actual_output or "state file" in actual_output.lower()

        # Should indicate success, not blocking
        assert "⛔" not in actual_output, "Should not block /cd-init command"
        assert "Cannot proceed" not in actual_output, "Should allow initialization"

    def test_s2_state_validation(self, orchestrator_agent):
        """
        Scenario 2: Verify state file would be created correctly.

        This test validates the expected state updates.
        In a real implementation, this would check the actual state file.
        """
        scenario = get_scenario("S2")
        actual_output = orchestrator_agent.execute(
            scenario["input"],
            scenario["context"]
        )

        # Check state validation expectations
        state_validation = scenario.get("state_validation", {})

        if "current_phase" in state_validation:
            expected_phase = state_validation["current_phase"]
            assert expected_phase in actual_output or f'"{expected_phase}"' in actual_output, (
                f"Response should indicate phase set to '{expected_phase}'"
            )

        if "project.type" in state_validation:
            expected_type = state_validation["project.type"]
            assert expected_type in actual_output, (
                f"Response should indicate project type '{expected_type}'"
            )


@pytest.mark.eval
@pytest.mark.regression
class TestInitializationRegression:
    """
    Regression tests for initialization scenarios.

    These are run on every change to catch regressions.
    Subset of full test suite for fast feedback.
    """

    def test_always_blocks_without_cd_init(self, orchestrator_agent):
        """
        Critical regression test: Must always block commands without initialization.

        This is the most fundamental gate enforcement behavior.
        """
        scenario = get_scenario("S1")
        actual_output = orchestrator_agent.execute(
            scenario["input"],
            scenario["context"]
        )

        # Critical checks
        assert "⛔" in actual_output, "CRITICAL: Must block with emoji"
        assert any(
            phrase in actual_output.lower()
            for phrase in ["cannot proceed", "can't proceed", "blocked"]
        ), "CRITICAL: Must use clear blocking language"
        assert "/cd-init" in actual_output, "CRITICAL: Must suggest /cd-init"


# Pytest configuration
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "eval: marks tests as eval tests")
    config.addinivalue_line("markers", "regression: marks tests as regression tests")


if __name__ == "__main__":
    # Allow running this file directly for quick testing
    pytest.main([__file__, "-v", "--tb=short"])
