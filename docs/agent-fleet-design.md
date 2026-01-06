# CD-Agent Fleet Architecture

> A fleet of specialized AI agents that enforce XP/CD practices to achieve Elite DORA metrics.

## Design Philosophy

### Core Principles

1. **Single Responsibility**: Each agent owns ONE domain of expertise
2. **Rule Enforcement**: Agents REFUSE to proceed if rules are violated
3. **Handoff Protocol**: Clear contracts between agents
4. **Human Gates**: Strategic checkpoints for approval
5. **Audit Trail**: Every decision is traceable

### Agent Categories

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR AGENT                               │
│  Coordinates workflow, routes tasks, enforces gates                      │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────────────┐
         │                                                               │
         ▼                                                               ▼
┌─────────────────────┐                                    ┌─────────────────────┐
│   PLANNING AGENTS   │                                    │  EXECUTION AGENTS   │
├─────────────────────┤                                    ├─────────────────────┤
│ • Vision Agent      │                                    │ • TDD Agent         │
│ • Story Agent       │                                    │ • Acceptance Agent  │
│ • Architecture Agent│                                    │ • Pipeline Agent    │
└─────────────────────┘                                    └─────────────────────┘
         │                                                               │
         └──────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   QUALITY AGENTS    │
                         ├─────────────────────┤
                         │ • Review Agent      │
                         │ • Contract Agent    │
                         │ • Compliance Agent  │
                         └─────────────────────┘
```

---

## Agent Specifications

### 1. Orchestrator Agent (Primary)

**Purpose**: Coordinates the entire development workflow, routes tasks to specialists, enforces gates.

**Triggers**: All user requests enter here first.

**Responsibilities**:
- Parse user intent and determine workflow phase
- Route to appropriate specialist agent
- Enforce gate requirements (human approval, test passing)
- Maintain workflow state and history
- Block rule violations

**Rules It Enforces**:
- Workflow order (Vision → Plan → ATDD → TDD → Ship)
- Gate passage requirements
- No skipping phases

**Handoffs**:
- `/vision` → Vision Agent
- `/plan` → Story Agent
- `/acceptance-test`, `/dsl`, `/driver` → Acceptance Agent
- `/red`, `/green`, `/refactor`, `/cycle` → TDD Agent
- `/commit`, `/ship` → Ship Agent
- `/code-review` → Review Agent
- `/commit-stage`, `/release-stage`, `/acceptance-stage` → Pipeline Agent

**Example Interaction**:
```
User: "Add user authentication"
Orchestrator:
  1. Check current phase → No vision for this feature
  2. Route to Vision Agent for problem definition
  3. After vision approved → Route to Story Agent
  4. After plan approved → Route to Acceptance Agent
  ... continues through workflow
```

---

### 2. Vision Agent

**Purpose**: Define product vision, success metrics, and constraints.

**Triggers**: `/vision`, new feature requests without existing vision

**Rules It Enforces**:
- `CLAUDE.md` Vision section requirements
- Problem-Solution-Goal structure
- DORA metrics targets

**Inputs**:
- User's feature request or problem statement
- Existing `PRODUCT-VISION.md` (if any)

**Outputs**:
- Updated `PRODUCT-VISION.md`
- Success metrics definition
- Scope boundaries

**Gate**: Human approval of vision document

**Refuses To**:
- Skip problem definition
- Define solutions without hypotheses
- Proceed without success metrics

---

### 3. Story Agent

**Purpose**: Break features into TDD-ready tasks using Example Mapping and behavioral analysis.

**Triggers**: `/plan`, approved vision

**Rules It Enforces**:
- `CLAUDE.md` Planning section
- Example Mapping (Yellow/Green/Red/Blue cards)
- Behavioral variant documentation
- User Story Mapping structure

**Inputs**:
- Approved vision
- User stories or feature requests
- Existing codebase context

**Outputs**:
- Example Map (stories, examples, rules, questions)
- Behavioral variants document
- Task breakdown with acceptance criteria
- Updated plan file

**Gate**: Human approval of plan

**Refuses To**:
- Create implementation plans without behavioral analysis
- Skip Example Mapping for complex features
- Proceed with unresolved questions (blue cards)

---

### 4. Architecture Agent

**Purpose**: Ensure Clean Architecture compliance and make structural decisions.

**Triggers**: New modules, structural changes, architecture questions

**Rules It Enforces**:
- `clean-architecture-fe.md` (Frontend)
- `controller-pattern-be.md` (Backend)
- `atomic-design.md` (UI Components)
- `infrastructure-services.md` (Port/Adapter pattern)
- Dependency direction (always inward)

**Inputs**:
- Feature requirements
- Existing codebase structure
- Technology constraints

**Outputs**:
- File/folder structure recommendations
- Interface definitions (Ports)
- Layer placement decisions
- Architectural Decision Records (ADRs)

**Refuses To**:
- Allow domain layer to import from infrastructure
- Place business logic in controllers
- Mix atomic design levels incorrectly
- Skip interface definitions for boundaries

---

### 5. Acceptance Agent

**Purpose**: Implement Four-Layer Model acceptance tests (Executable Specifications).

**Triggers**: `/acceptance-test`, `/dsl`, `/driver`

**Rules It Enforces**:
- `acceptance-test.md` (Four-Layer Model)
- `test-flakiness.md` (Anti-flakiness patterns)
- `code-style.md` (No WHAT comments)

**Sub-Modes**:
1. **Test Case Mode** (`/acceptance-test`):
   - Write Gherkin scenarios in domain language
   - NO implementation details (no JWT, HTTP, database mentions)
   - Litmus test: Would a non-technical stakeholder understand?

2. **DSL Mode** (`/dsl`):
   - Implement Domain Specific Language layer
   - Optional parameters with sensible defaults
   - Domain concepts only

3. **Driver Mode** (`/driver`):
   - Implement Protocol Drivers (UI/API)
   - Production routes for ACTIONS
   - Back-door routes for SETUP and VERIFICATION
   - Page Object pattern for UI
   - Scenarist integration for external system stubs

**Inputs**:
- Approved plan with acceptance criteria
- Existing DSL/Driver patterns

**Outputs**:
- Feature files (Gherkin)
- DSL implementations
- Protocol Drivers
- Page Objects
- Test Data Builders

**Refuses To**:
- Write implementation details in Gherkin
- Use hard-coded waits (`waitForTimeout`)
- Share test data between scenarios
- Test through back-doors for ACTIONS

---

### 6. TDD Agent

**Purpose**: Execute pure TDD with Red-Green-Refactor discipline.

**Triggers**: `/red`, `/green`, `/refactor`, `/cycle`

**Rules It Enforces**:
- `sociable-unit-test.md` / `sociable-unit-test-fe.md`
- `component-test-be.md` / `component-test-fe.md`
- `narrow-integration-test.md` / `narrow-integration-test-fe.md`
- `test-doubles.md`
- `test-data-builders.md`
- `code-style.md`

**Sub-Modes**:
1. **Red Mode** (`/red`):
   - Write ONE failing test
   - Test must fail for the RIGHT reason
   - Verify test actually fails before proceeding

2. **Green Mode** (`/green`):
   - Write MINIMAL code to pass
   - No anticipatory coding
   - No refactoring yet

3. **Refactor Mode** (`/refactor`):
   - Tests MUST be green
   - Improve structure without changing behavior
   - Apply design patterns if appropriate

4. **Cycle Mode** (`/cycle`):
   - Automated Red→Green→Refactor loop
   - Human approval at each phase transition

**Inputs**:
- Acceptance criteria from plan
- Existing test patterns in codebase
- Architecture guidelines from Architecture Agent

**Outputs**:
- Test files (sociable unit, component, integration)
- Implementation code
- Test Data Builders

**Refuses To**:
- Write multiple tests at once in Red phase
- Write more code than needed in Green phase
- Refactor with failing tests
- Use strict mocks (prefer stubs/spies)
- Test implementation details

---

### 7. Contract Agent

**Purpose**: Manage consumer-driven contracts with Pact.

**Triggers**: API client creation, provider implementation, CI setup

**Rules It Enforces**:
- `contract-test-consumer.md`
- `contract-test-provider.md`

**Sub-Modes**:
1. **Consumer Mode**:
   - Define expectations with matchers
   - Generate pact files
   - Publish to Pact Broker

2. **Provider Mode**:
   - State handlers for all consumer states
   - Verification against Broker
   - CI webhook integration

**Inputs**:
- API client implementations
- Consumer contracts from Broker
- Provider implementation

**Outputs**:
- Consumer pact tests
- Provider verification tests
- State handler implementations
- CI configuration for Pact

**Refuses To**:
- Skip state handlers
- Verify without publishing results
- Allow breaking consumer contracts

---

### 8. Pipeline Agent

**Purpose**: Set up and maintain CI/CD pipelines.

**Triggers**: `/commit-stage`, `/release-stage`, `/acceptance-stage`

**Rules It Enforces**:
- `commit-stage-pipeline.md`
- `release-stage-pipeline.md`
- `acceptance-stage-pipeline.md`
- `dependency-management.md`

**Sub-Modes**:
1. **Commit Stage** (`/commit-stage`):
   - Test pyramid execution
   - Conditional Docker builds (main branch only)
   - SHA-tagged artifacts
   - Contract publishing

2. **Release Stage** (`/release-stage`):
   - Manual trigger only
   - `can-i-deploy` verification
   - Deployment recording
   - Smoke tests

3. **Acceptance Stage** (`/acceptance-stage`):
   - Version-based test execution
   - Sequential test layers
   - State file management
   - Scheduled execution

**Inputs**:
- Project structure
- Deployment targets
- Existing workflows

**Outputs**:
- GitHub Actions workflow files
- State file structures
- Pipeline documentation

**Refuses To**:
- Auto-deploy to production
- Skip `can-i-deploy` checks
- Use hard-coded secrets
- Run tests without version checking

---

### 9. Review Agent

**Purpose**: Enforce code quality through XP/CD lens.

**Triggers**: `/code-review`, pre-commit hook, PR review

**Rules It Enforces**:
- ALL rules in `.claude/rules/`
- Clean Architecture boundaries
- Test coverage requirements
- Code style guidelines

**Review Dimensions**:
1. **Architecture Compliance**: Dependency direction, layer separation
2. **Test Quality**: Test types, coverage, patterns
3. **Code Style**: Comments, naming, structure
4. **Security**: Input validation, secrets management
5. **Performance**: N+1 queries, unnecessary computations

**Inputs**:
- Changed files
- Test results
- Architecture context

**Outputs**:
- Review comments with line references
- Approval/rejection decision
- Suggested fixes

**Refuses To**:
- Approve code without tests
- Approve Clean Architecture violations
- Approve untested acceptance criteria

---

### 10. Ship Agent

**Purpose**: Safe and traceable commits and merges.

**Triggers**: `/commit`, `/ship`

**Rules It Enforces**:
- Conventional commit format
- Git safety protocol
- PR creation standards

**Sub-Modes**:
1. **Commit Mode** (`/commit`):
   - Generate conventional commit message
   - Verify tests pass before commit
   - Never amend pushed commits
   - Include co-author attribution

2. **Ship Mode** (`/ship`):
   - Create PR with proper format
   - Verify all gates passed
   - Update main branch

**Inputs**:
- Staged changes
- Test results
- Review approval

**Outputs**:
- Git commits
- Pull requests
- Merge confirmation

**Refuses To**:
- Commit without passing tests
- Force push to main
- Skip review gate
- Amend pushed commits

---

### 11. Compliance Agent

**Purpose**: Continuous monitoring of XP/CD practice adherence.

**Triggers**: Background monitoring, audit requests

**Rules It Enforces**:
- All rules from `.claude/rules/`
- Workflow compliance
- DORA metrics tracking

**Responsibilities**:
- Monitor for rule violations during development
- Track DORA metrics (deployment frequency, lead time, etc.)
- Generate compliance reports
- Alert on anti-pattern detection

**Outputs**:
- Violation alerts
- DORA metrics reports
- Compliance audit trails

---

## Agent Communication Protocol

### Message Format

```typescript
interface AgentMessage {
  from: AgentId;
  to: AgentId;
  type: 'request' | 'response' | 'handoff' | 'gate_check' | 'violation';
  payload: {
    task: string;
    context: Record<string, any>;
    artifacts: Artifact[];
    rules_applied: string[];
    gates_passed: string[];
  };
  timestamp: ISO8601;
}
```

### Handoff Protocol

```
1. Source Agent completes task
2. Source Agent validates own output against rules
3. Source Agent creates handoff message with:
   - Completed artifacts
   - Applied rules
   - Passed gates
4. Orchestrator receives handoff
5. Orchestrator validates gate requirements
6. Orchestrator routes to next agent
7. Target Agent receives context and artifacts
```

### Gate Protocol

```typescript
interface Gate {
  id: string;
  name: string;
  type: 'human_approval' | 'automated_check' | 'test_pass';
  requirements: GateRequirement[];
  blocking: boolean;
}

// Example gates
const GATES = {
  VISION_APPROVED: {
    type: 'human_approval',
    requirements: ['vision_document_exists', 'success_metrics_defined'],
    blocking: true
  },
  PLAN_APPROVED: {
    type: 'human_approval',
    requirements: ['example_map_complete', 'no_unresolved_questions'],
    blocking: true
  },
  TESTS_PASSING: {
    type: 'automated_check',
    requirements: ['all_tests_green', 'coverage_threshold_met'],
    blocking: true
  },
  REVIEW_APPROVED: {
    type: 'human_approval',
    requirements: ['no_violations', 'all_comments_resolved'],
    blocking: true
  }
};
```

---

## Workflow State Machine

```
                    ┌─────────────────┐
                    │     START       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  VISION PHASE   │◄───────────────┐
                    │  (Vision Agent) │                │
                    └────────┬────────┘                │
                             │                         │
                    [GATE: Vision Approved]            │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │   PLAN PHASE    │                │
                    │  (Story Agent)  │                │
                    └────────┬────────┘                │
                             │                         │
                    [GATE: Plan Approved]              │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │   ATDD PHASE    │                │
                    │(Acceptance Agent)                │
                    └────────┬────────┘                │
                             │                         │
                    [GATE: Specs Written]              │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │   TDD PHASE     │                │
                    │   (TDD Agent)   │◄───┐           │
                    └────────┬────────┘    │           │
                             │             │           │
                    [Red→Green→Refactor]   │           │
                             │             │           │
                    [More tests needed?]───┘           │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │  REVIEW PHASE   │                │
                    │ (Review Agent)  │                │
                    └────────┬────────┘                │
                             │                         │
                    [GATE: Review Approved]            │
                             │                         │
                    [Changes requested?]───────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   SHIP PHASE    │
                    │  (Ship Agent)   │
                    └────────┬────────┘
                             │
                    [GATE: Pipeline Green]
                             │
                             ▼
                    ┌─────────────────┐
                    │     DONE        │
                    └─────────────────┘
```

---

## Implementation Strategy

### Phase 1: Core Agents (MVP)

1. **Orchestrator Agent** - Route and coordinate
2. **TDD Agent** - Red/Green/Refactor discipline
3. **Review Agent** - Quality enforcement

### Phase 2: Planning Agents

4. **Vision Agent** - Product vision
5. **Story Agent** - Example Mapping and planning
6. **Architecture Agent** - Clean Architecture guidance

### Phase 3: Testing Agents

7. **Acceptance Agent** - Four-Layer Model
8. **Contract Agent** - Pact integration

### Phase 4: Delivery Agents

9. **Pipeline Agent** - CI/CD setup
10. **Ship Agent** - Safe commits and merges
11. **Compliance Agent** - Continuous monitoring

---

## Command vs Agent Decision Matrix

| Task | Command | Agent | Reasoning |
|------|---------|-------|-----------|
| Simple commit | ✓ | | Single action, no orchestration |
| Feature implementation | | ✓ | Multi-phase workflow |
| Single test addition | ✓ | | Single action |
| Full TDD cycle | | ✓ | Multi-step discipline |
| Quick fix | ✓ | | Simple change |
| New feature | | ✓ | Full workflow needed |
| Pipeline setup | | ✓ | Complex configuration |
| Code review | | ✓ | Multi-dimensional analysis |
| Dependency update | ✓ | | Single action |

### Commands to Keep

- `/commit` - Simple commit with conventional format (but can escalate to Ship Agent)
- `/spike` - Exploratory coding (disposable)
- `/dependency-review` - Package updates

### Commands to Convert to Agents

- `/vision` → Vision Agent
- `/plan` → Story Agent
- `/acceptance-test`, `/dsl`, `/driver` → Acceptance Agent
- `/red`, `/green`, `/refactor`, `/cycle` → TDD Agent
- `/code-review` → Review Agent
- `/ship` → Ship Agent
- `/commit-stage`, `/release-stage`, `/acceptance-stage` → Pipeline Agent
- `/cd-init` → Orchestrator Agent (project bootstrap)

---

## Rule Enforcement Strategy

### Rule Embedding

Each agent has its relevant rules embedded in its system prompt:

```typescript
const TDD_AGENT_SYSTEM_PROMPT = `
You are the TDD Agent. You enforce strict TDD discipline.

## Non-Negotiable Rules

${readFile('rules/sociable-unit-test.md')}
${readFile('rules/component-test-be.md')}
${readFile('rules/test-doubles.md')}
${readFile('rules/test-data-builders.md')}
${readFile('rules/code-style.md')}

## Refusal Conditions

You MUST REFUSE to proceed if:
- User asks to write multiple tests at once (Red phase)
- User asks to write more code than needed (Green phase)
- User asks to refactor with failing tests (Refactor phase)
- User asks to use strict mocks instead of stubs/spies
- User asks to skip test coverage

When refusing, explain which rule is being violated and why.
`;
```

### Violation Handling

```typescript
interface Violation {
  rule_id: string;
  rule_name: string;
  severity: 'error' | 'warning';
  description: string;
  suggestion: string;
  can_override: boolean;
}

// Agent behavior on violation
function handleViolation(violation: Violation): AgentResponse {
  if (violation.severity === 'error' && !violation.can_override) {
    return {
      status: 'blocked',
      message: `Cannot proceed: ${violation.description}`,
      rule: violation.rule_name,
      suggestion: violation.suggestion
    };
  }
  // ... handle warnings
}
```

---

## Success Metrics

### Agent Performance

- **Rule Compliance Rate**: % of outputs that pass all rules
- **Gate Pass Rate**: % of first-attempt gate passages
- **Handoff Success Rate**: % of successful agent-to-agent handoffs
- **User Override Rate**: % of rule violations that users override

### DORA Metrics (Target: Elite)

- **Deployment Frequency**: Multiple deploys per day
- **Lead Time for Changes**: < 1 hour
- **Change Failure Rate**: 0-15%
- **Time to Restore Service**: < 1 hour

---

## Next Steps

1. Define detailed agent prompts with embedded rules
2. Implement Orchestrator Agent as entry point
3. Build agent communication infrastructure
4. Create gate checking mechanisms
5. Implement agent handoff protocol
6. Build compliance monitoring
7. Add DORA metrics tracking
