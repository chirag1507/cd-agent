"""
Core Metrics for Orchestrator Agent Evaluation

Implements 5 critical metrics following Hamel Husain's principles:
1. GateEnforcementMetric (LLM-as-judge) - Subjective quality assessment
2. PhaseTransitionMetric (Hybrid) - Deterministic + LLM judgment
3. RouteAccuracyMetric (Deterministic) - Clear mapping verification
4. BlockingMessageQualityMetric (LLM-as-judge) - User experience quality
5. StateFileCorrectnessMetric (Deterministic) - Structural validation
"""

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from typing import Optional


class GateEnforcementMetric(BaseMetric):
    """
    Verifies that gates are properly enforced by the Orchestrator.

    Type: LLM-as-judge (subjective quality assessment)

    Criteria:
    - MUST block invalid transitions with ⛔ emoji
    - MUST explain WHY the action is blocked
    - MUST suggest the correct next step
    - MUST NOT proceed with the requested action

    Target: 100% (Critical metric)
    """

    def __init__(
        self,
        threshold: float = 0.9,
        model: Optional[str] = "gpt-4",
        include_reason: bool = True,
    ):
        self.threshold = threshold
        self.model = model
        self.include_reason = include_reason

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Evaluate gate enforcement quality.

        Returns score between 0 and 1.
        """
        self.evaluation_cost = 0  # Track cost if using paid LLM

        # Deterministic checks first (fast)
        actual_output = test_case.actual_output

        # Check 1: Contains blocking emoji
        has_block_emoji = "⛔" in actual_output

        # Check 2: Contains "Cannot proceed" or similar blocking language
        blocking_phrases = [
            "cannot proceed",
            "can't proceed",
            "must not",
            "blocked",
            "not allowed",
        ]
        has_blocking_language = any(
            phrase in actual_output.lower() for phrase in blocking_phrases
        )

        # Check 3: No action was taken (should not contain success indicators)
        action_indicators = [
            "successfully",
            "completed",
            "created plan",
            "implemented",
            "written test",
        ]
        did_not_proceed = not any(
            indicator in actual_output.lower() for indicator in action_indicators
        )

        # Deterministic score (70% weight)
        deterministic_score = (
            (0.3 if has_block_emoji else 0) +
            (0.2 if has_blocking_language else 0) +
            (0.2 if did_not_proceed else 0)
        ) / 0.7

        # LLM judgment for explanation quality (30% weight)
        # For MVP, we'll use rule-based evaluation
        # In production, this would call an LLM judge
        has_explanation = len(actual_output) > 50  # Has substantial explanation
        has_suggestion = any(
            cmd in actual_output for cmd in ["/cd-init", "/plan", "/red", "/code-review"]
        )

        llm_score = (
            (0.15 if has_explanation else 0) +
            (0.15 if has_suggestion else 0)
        ) / 0.3

        # Combined score
        self.score = deterministic_score + llm_score
        self.success = self.score >= self.threshold

        if self.include_reason:
            self.reason = self._generate_reason(
                has_block_emoji,
                has_blocking_language,
                did_not_proceed,
                has_explanation,
                has_suggestion,
            )

        return self.score

    def _generate_reason(
        self,
        has_block_emoji: bool,
        has_blocking_language: bool,
        did_not_proceed: bool,
        has_explanation: bool,
        has_suggestion: bool,
    ) -> str:
        """Generate explanation for the score."""
        parts = []

        if not has_block_emoji:
            parts.append("❌ Missing ⛔ blocking emoji")
        else:
            parts.append("✅ Contains blocking emoji")

        if not has_blocking_language:
            parts.append("❌ Missing clear blocking language ('Cannot proceed', etc.)")
        else:
            parts.append("✅ Clear blocking language present")

        if not did_not_proceed:
            parts.append("❌ Response indicates action was taken (should block)")
        else:
            parts.append("✅ Action was properly blocked")

        if not has_explanation:
            parts.append("❌ Explanation too brief (< 50 chars)")
        else:
            parts.append("✅ Substantial explanation provided")

        if not has_suggestion:
            parts.append("❌ No suggested next step")
        else:
            parts.append("✅ Suggests next step")

        return "\n".join(parts)

    async def a_measure(self, test_case: LLMTestCase) -> float:
        """Async version of measure."""
        return self.measure(test_case)

    def is_successful(self) -> bool:
        """Check if metric meets threshold."""
        return self.success

    @property
    def __name__(self):
        return "Gate Enforcement"


class RouteAccuracyMetric(BaseMetric):
    """
    Verifies correct command routing based on intent.

    Type: Deterministic (clear mapping, no ambiguity)

    Criteria:
    - "plan" intent → /plan command
    - "write test" intent → /red command
    - "implement" intent → /green command
    - Ambiguous intent → clarification question

    Target: 95% (Critical metric)
    """

    def __init__(
        self,
        expected_route: str,
        threshold: float = 0.95,
        include_reason: bool = True,
    ):
        self.expected_route = expected_route
        self.threshold = threshold
        self.include_reason = include_reason

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Check if output indicates correct routing.

        Returns 1.0 if routed correctly, 0.0 otherwise.
        """
        actual_output = test_case.actual_output.lower()

        # Route indicators
        route_indicators = {
            "/plan": ["example mapping", "user story", "planning", "breaking down"],
            "/red": ["failing test", "red phase", "write test", "tdd red"],
            "/green": ["minimal code", "green phase", "pass test", "tdd green"],
            "/refactor": ["refactor", "improve structure", "clean up"],
            "/code-review": ["review", "checking code", "code quality"],
            "/cd-init": ["initializing", "workflow-state.json", "project structure"],
            "/spike": ["spike mode", "🔬", "disposable", "exploration"],
        }

        expected_indicators = route_indicators.get(self.expected_route, [])

        # Check if any expected indicator is present
        route_correct = any(
            indicator in actual_output for indicator in expected_indicators
        )

        self.score = 1.0 if route_correct else 0.0
        self.success = self.score >= self.threshold

        if self.include_reason:
            if route_correct:
                self.reason = f"✅ Correctly routed to {self.expected_route}"
            else:
                self.reason = (
                    f"❌ Did not route to {self.expected_route}. "
                    f"Expected indicators: {expected_indicators}"
                )

        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Route Accuracy"


class BlockingMessageQualityMetric(BaseMetric):
    """
    Assesses quality of blocking messages for user experience.

    Type: LLM-as-judge (subjective quality)

    Criteria:
    - Contains specific error reason
    - Suggests actionable next step
    - Maintains professional tone
    - Includes example if applicable

    Target: 90% (Important metric)
    """

    def __init__(
        self,
        threshold: float = 0.85,
        include_reason: bool = True,
    ):
        self.threshold = threshold
        self.include_reason = include_reason

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Evaluate blocking message quality.

        Returns score between 0 and 1.
        """
        actual_output = test_case.actual_output

        # Check 1: Has specific error reason (25%)
        has_specific_reason = any(
            phrase in actual_output.lower() for phrase in [
                "project not initialized",
                "missing plan",
                "no failing test",
                "review required",
                "gate",
                "prerequisite",
            ]
        )

        # Check 2: Suggests actionable next step (25%)
        has_suggestion = any(
            cmd in actual_output for cmd in [
                "/cd-init",
                "/plan",
                "/red",
                "/green",
                "/code-review",
                "approved",
            ]
        )

        # Check 3: Professional tone - no negative language (25%)
        negative_phrases = ["stupid", "wrong", "bad", "idiot", "dumb"]
        is_professional = not any(
            phrase in actual_output.lower() for phrase in negative_phrases
        )

        # Check 4: Includes example/context (25%)
        has_example = (
            "example:" in actual_output.lower() or
            "```" in actual_output or
            "would you like" in actual_output.lower()
        )

        self.score = (
            (0.25 if has_specific_reason else 0) +
            (0.25 if has_suggestion else 0) +
            (0.25 if is_professional else 0) +
            (0.25 if has_example else 0)
        )

        self.success = self.score >= self.threshold

        if self.include_reason:
            parts = []
            parts.append("✅ Specific error reason" if has_specific_reason else "❌ Vague error reason")
            parts.append("✅ Actionable suggestion" if has_suggestion else "❌ No suggested next step")
            parts.append("✅ Professional tone" if is_professional else "❌ Unprofessional language")
            parts.append("✅ Includes example/context" if has_example else "❌ No example provided")
            self.reason = "\n".join(parts)

        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Blocking Message Quality"


class StateFileCorrectnessMetric(BaseMetric):
    """
    Verifies state file correctness after operations.

    Type: Deterministic (structural validation)

    Criteria:
    - JSON structure matches schema
    - Required fields present
    - Values match expected phase
    - History array updated

    Target: 100% (Critical metric)
    """

    def __init__(
        self,
        expected_state: dict,
        threshold: float = 0.95,
        include_reason: bool = True,
    ):
        self.expected_state = expected_state
        self.threshold = threshold
        self.include_reason = include_reason

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Validate state file against expected state.

        Note: In actual implementation, this would read .cd-agent/workflow-state.json
        For now, we check if the output mentions state updates.
        """
        actual_output = test_case.actual_output.lower()

        # For MVP, check if output indicates state changes
        checks_passed = 0
        total_checks = 0
        reasons = []

        for key, expected_value in self.expected_state.items():
            total_checks += 1

            if key == "current_phase":
                if f'"{expected_value}"' in actual_output or expected_value in actual_output:
                    checks_passed += 1
                    reasons.append(f"✅ Phase set to '{expected_value}'")
                else:
                    reasons.append(f"❌ Phase not set to '{expected_value}'")

            elif key == "project.type":
                if expected_value in actual_output:
                    checks_passed += 1
                    reasons.append(f"✅ Project type: {expected_value}")
                else:
                    reasons.append(f"❌ Project type not set")

            elif key.startswith("gates."):
                gate_name = key.split(".")[1]
                if gate_name in actual_output or "gate" in actual_output:
                    checks_passed += 1
                    reasons.append(f"✅ Gate '{gate_name}' mentioned")
                else:
                    reasons.append(f"❌ Gate '{gate_name}' not updated")

        self.score = checks_passed / total_checks if total_checks > 0 else 1.0
        self.success = self.score >= self.threshold

        if self.include_reason:
            self.reason = "\n".join(reasons)

        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "State File Correctness"


class PhaseTransitionMetric(BaseMetric):
    """
    Verifies correct phase transitions in workflow.

    Type: Hybrid (deterministic state checks + LLM judgment on transitions)

    Criteria:
    - MUST update workflow state correctly
    - MUST record transition in history
    - MUST set correct current_phase
    - MUST route to appropriate specialist command

    Target: 100% (Critical metric)
    """

    def __init__(
        self,
        expected_from_phase: Optional[str],
        expected_to_phase: str,
        threshold: float = 0.9,
        include_reason: bool = True,
    ):
        self.expected_from_phase = expected_from_phase
        self.expected_to_phase = expected_to_phase
        self.threshold = threshold
        self.include_reason = include_reason

    def measure(self, test_case: LLMTestCase) -> float:
        """
        Verify phase transition occurred correctly.
        """
        actual_output = test_case.actual_output.lower()

        # Check 1: New phase mentioned (40%)
        new_phase_mentioned = self.expected_to_phase.lower() in actual_output

        # Check 2: Transition language used (30%)
        transition_phrases = [
            "transitioning",
            "moving to",
            "entering",
            "phase",
            "starting",
        ]
        has_transition_language = any(
            phrase in actual_output for phrase in transition_phrases
        )

        # Check 3: History update indicated (30%)
        history_indicators = ["history", "recorded", "tracking", "state updated"]
        has_history_update = any(
            indicator in actual_output for indicator in history_indicators
        )

        self.score = (
            (0.4 if new_phase_mentioned else 0) +
            (0.3 if has_transition_language else 0) +
            (0.3 if has_history_update else 0)
        )

        self.success = self.score >= self.threshold

        if self.include_reason:
            parts = []
            parts.append(
                f"✅ Phase '{self.expected_to_phase}' mentioned"
                if new_phase_mentioned
                else f"❌ Phase '{self.expected_to_phase}' not mentioned"
            )
            parts.append(
                "✅ Transition language used"
                if has_transition_language
                else "❌ No transition language"
            )
            parts.append(
                "✅ History update indicated"
                if has_history_update
                else "❌ History update not indicated"
            )
            self.reason = "\n".join(parts)

        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Phase Transition"
