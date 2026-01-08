"""
Client for invoking the real Orchestrator Agent via Claude Code CLI.

This allows evals to test the actual production agent, not a mock.
"""

import subprocess
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional


class OrchestratorAgentClient:
    """Client to invoke .claude/agents/orchestrator.md via Claude Code CLI."""

    def __init__(self, project_root: str = None):
        """
        Initialize the agent client.

        Args:
            project_root: Path to cd-agent project root. Auto-detected if None.
        """
        if project_root is None:
            # Auto-detect: evals/test_cases/orchestrator -> cd-agent root
            current_file = Path(__file__).resolve()
            project_root = current_file.parent.parent.parent.parent

        self.project_root = Path(project_root)
        self.claude_bin = self._find_claude_binary()

        # Verify agent file exists
        self.agent_file = self.project_root / ".claude" / "agents" / "orchestrator.md"
        if not self.agent_file.exists():
            raise FileNotFoundError(
                f"Orchestrator agent not found at {self.agent_file}"
            )

    def _find_claude_binary(self) -> str:
        """Find Claude Code CLI binary."""
        # Try common locations
        candidates = [
            "claude",  # In PATH
            os.path.expanduser("~/.nvm/versions/node/v22.16.0/bin/claude"),
            "/usr/local/bin/claude",
        ]

        for candidate in candidates:
            result = subprocess.run(
                ["which", candidate],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                return candidate.strip()

        raise RuntimeError("Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code")

    def execute(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None,
        simulate_state: bool = True,
    ) -> str:
        """
        Execute orchestrator agent with given input.

        Args:
            user_input: User command/request (e.g., "/orchestrate plan feature X")
            context: Test context (state_file_exists, current_phase, etc.)
            simulate_state: If True, create temporary state file for context

        Returns:
            Agent output as string
        """
        # Setup context
        state_file = self.project_root / ".cd-agent" / "workflow-state.json"
        original_state_existed = state_file.exists()
        original_state_content = None

        try:
            # Simulate context if provided
            if context and simulate_state:
                if context.get("state_file_exists"):
                    # Create state file with context
                    state_file.parent.mkdir(parents=True, exist_ok=True)
                    state_data = {
                        "current_phase": context.get("current_phase", "idle"),
                        "current_feature": context.get("current_feature"),
                        "gates_passed": context.get("gates_passed", []),
                        "project": {
                            "type": context.get("project_type"),
                            "initialized_at": "2024-01-01T00:00:00Z",
                        },
                    }
                    if original_state_existed:
                        original_state_content = state_file.read_text()
                    state_file.write_text(json.dumps(state_data, indent=2))
                else:
                    # Ensure state file doesn't exist for this test
                    if state_file.exists():
                        original_state_content = state_file.read_text()
                        state_file.unlink()

            # Build command
            cmd = [
                self.claude_bin,
                "-p",  # Programmatic mode
                user_input,
                "--agent", "orchestrator",
            ]

            # Execute agent
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(self.project_root),
                timeout=30,  # 30s timeout
            )

            if result.returncode != 0:
                # Agent execution failed
                return f"Agent execution failed: {result.stderr}"

            # Return output
            return result.stdout.strip()

        finally:
            # Cleanup: restore original state
            if simulate_state and context:
                if original_state_existed and original_state_content is not None:
                    # Restore original state
                    state_file.write_text(original_state_content)
                elif not original_state_existed and state_file.exists():
                    # Remove temporary state file
                    state_file.unlink()


# Singleton instance for tests
_agent_client = None


def get_orchestrator_agent() -> OrchestratorAgentClient:
    """Get singleton Orchestrator agent client."""
    global _agent_client
    if _agent_client is None:
        _agent_client = OrchestratorAgentClient()
    return _agent_client
