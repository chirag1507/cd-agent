# Recommended Multi-Agent Architecture

## Executive Summary

Transform CD-Agent from a **single generalist agent** to a **specialized agent fleet** with orchestrated workflow enforcement to achieve:
- **95%+ accuracy** in following XP/CD practices
- **0-1 manual interventions** per feature
- **85-95% token cost reduction**
- **Zero workflow violations** via validation gates

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   USER INTERFACE                         │
│  (CLI + Web UI)                                          │
│  - Shows: Current Phase, Active Agent, Progress          │
│  - Approval gates for human review                       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              WORKFLOW ORCHESTRATOR                       │
│  - State Machine (tracks workflow phase)                 │
│  - Validation Gates (enforces transitions)               │
│  - Agent Router (delegates to specialists)               │
│  - Token Budget Manager (optimizes cost)                 │
│  - Context Compressor (reduces token usage)              │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼───────┐ ┌─────▼──────┐ ┌───────▼───────┐
│  VISION       │ │   PLAN     │ │    ATDD       │
│  Agent        │ │   Agent    │ │    Agent      │
│               │ │            │ │               │
│ - Vision doc  │ │ - Example  │ │ - Gherkin     │
│ - DORA goals  │ │   mapping  │ │ - DSL         │
│ - Metrics     │ │ - Tasks    │ │ - Drivers     │
└───────────────┘ └────────────┘ └───────────────┘

┌───────────────┐ ┌────────────┐ ┌───────────────┐
│  TDD          │ │ ARCHITECTURE│ │   CI/CD       │
│  Coordinator  │ │   Agent    │ │   Agent       │
│               │ │            │ │               │
│ Orchestrates: │ │ - Clean    │ │ - Pipelines   │
│ ├─ RED Agent  │ │   Arch     │ │ - Deployment  │
│ ├─ GREEN      │ │ - Boundary │ │ - Monitoring  │
│ └─ REFACTOR   │ │   checks   │ │               │
└───────────────┘ └────────────┘ └───────────────┘

┌───────────────┐ ┌────────────┐
│  CONTRACT     │ │   REVIEW   │
│  Agent        │ │   Agent    │
│               │ │            │
│ - Pact tests  │ │ - Code     │
│ - Provider    │ │   quality  │
│ - Consumer    │ │ - Best     │
│               │ │   practices│
└───────────────┘ └────────────┘
```

## Core Components

### 1. Workflow Orchestrator

**Responsibilities**:
- Execute workflow state machine
- Validate phase transitions
- Route tasks to specialist agents
- Manage token budgets
- Compress context between agents

**State Schema**:
```json
{
  "projectId": "project-uuid",
  "currentWorkflow": {
    "phase": "tdd-green",
    "featureName": "user-registration",
    "agentActive": "green-phase-agent",
    "startedAt": "2025-12-25T10:00:00Z"
  },
  "gates": {
    "visionDefined": true,
    "planApproved": true,
    "acceptanceTestWritten": true,
    "redPassed": true,
    "greenPassed": false,
    "refactorPassed": false
  },
  "tddCycle": {
    "currentPhase": "green",
    "testFile": "src/register-user.use-case.test.ts",
    "testStatus": "failing",
    "implementationFile": "src/register-user.use-case.ts",
    "cycleCount": 1
  },
  "tokenUsage": {
    "budgetTotal": 100000,
    "used": 23450,
    "remaining": 76550,
    "byAgent": {
      "vision-agent": 5000,
      "plan-agent": 8000,
      "red-agent": 10450
    }
  }
}
```

**State Machine**:
```typescript
const WORKFLOW_TRANSITIONS = {
  'vision': {
    allowedNext: ['plan'],
    validator: validateVisionComplete,
    message: "Must define product vision before planning"
  },
  'plan': {
    allowedNext: ['acceptance-test'],
    validator: validatePlanApproved,
    message: "Must create execution plan before tests"
  },
  'acceptance-test': {
    allowedNext: ['tdd-red'],
    validator: validateAcceptanceTestExists,
    message: "Must write acceptance test before TDD"
  },
  'tdd-red': {
    allowedNext: ['tdd-green'],
    validator: validateTestFails,
    message: "Test must fail before implementation"
  },
  'tdd-green': {
    allowedNext: ['tdd-refactor', 'tdd-red'],
    validator: validateTestPasses,
    message: "Test must pass before refactor or next test"
  },
  'tdd-refactor': {
    allowedNext: ['tdd-red', 'review'],
    validator: validateTestsStillGreen,
    message: "Tests must remain green after refactor"
  },
  'review': {
    allowedNext: ['commit', 'tdd-red'],
    validator: validateCodeQuality,
    message: "Code quality must meet standards"
  },
  'commit': {
    allowedNext: ['tdd-red', 'ship'],
    validator: validateAllTestsPass,
    message: "All tests must pass before commit"
  },
  'ship': {
    allowedNext: ['vision'],
    validator: validatePipelineGreen,
    message: "CI/CD pipeline must be green"
  }
};
```

### 2. Specialist Agents

#### VISION Agent

**Purpose**: Define product vision and success metrics

**System Prompt**:
```
You are a product strategy specialist focused on XP/CD practices.
Your role:
1. Help define clear product vision
2. Identify success metrics (DORA + business + user metrics)
3. Ensure feature aligns with vision
4. Set quality gates

You work at the strategic level - no implementation details.
```

**Tools**: `readFile`, `writeFile:PRODUCT-VISION.md`, `webSearch` (market research)

**Output**: Vision document with DORA metrics goals

---

#### PLAN Agent

**Purpose**: Break features into TDD-ready tasks using Example Mapping

**System Prompt**:
```
You are a planning specialist using Example Mapping (BDD).
Your role:
1. Analyze user story for behavioral scenarios
2. Document examples (green cards)
3. Identify rules (red cards)
4. Capture questions (blue cards)
5. Break into testable tasks

You focus on WHAT behavior is needed, not HOW to implement.
```

**Tools**: `readFile`, `writeFile:plan/*.md`, `exampleMapping`

**Output**: Behavioral analysis + task breakdown

---

#### ATDD Agent

**Purpose**: Write acceptance tests using Four-Layer Model

**System Prompt**:
```
You are an acceptance test specialist (Dave Farley's Four-Layer Model).
Your role:
1. Write Gherkin scenarios in problem-domain language
2. Implement DSL layer (domain-specific language)
3. Create protocol drivers (UI/API)
4. Set up external system stubs (Scenarist)

Tests must make sense to non-technical stakeholders.
NEVER use implementation details in test cases.
```

**Tools**: `readFile`, `writeFile:**/*.feature`, `writeFile:dsl/*.ts`, `writeFile:drivers/*.ts`

**Output**: Executable specification (Gherkin + DSL + Drivers)

---

#### TDD Coordinator Agent

**Purpose**: Orchestrate Red-Green-Refactor cycle

**System Prompt**:
```
You coordinate the TDD cycle with three specialist agents.
Your role:
1. Route to RED agent for failing test
2. Validate test fails correctly
3. Route to GREEN agent for implementation
4. Validate test passes
5. Route to REFACTOR agent for improvements
6. Manage cycle iterations

You enforce TDD discipline but don't write code yourself.
```

**Tools**: `routeToAgent`, `validatePhase`, `runTests`, `updateState`

**Handoff Logic**:
```typescript
async coordinateTDDCycle(feature: string) {
  // Phase 1: RED
  const redResult = await routeToAgent('red-agent', {
    instruction: `Write failing test for: ${feature}`,
    constraint: 'ONE test only'
  });

  await validatePhase('red', redResult, {
    checks: ['test-exists', 'test-fails', 'failure-clear']
  });

  // Phase 2: GREEN
  const greenResult = await routeToAgent('green-agent', {
    instruction: 'Write minimal code to pass test',
    context: { testFile: redResult.testFile }
  });

  await validatePhase('green', greenResult, {
    checks: ['test-passes', 'no-new-tests', 'minimal-change']
  });

  // Phase 3: REFACTOR
  const refactorResult = await routeToAgent('refactor-agent', {
    instruction: 'Improve code structure',
    context: { implementationFile: greenResult.file }
  });

  await validatePhase('refactor', refactorResult, {
    checks: ['tests-still-green', 'complexity-reduced']
  });

  return { red: redResult, green: greenResult, refactor: refactorResult };
}
```

---

#### RED Agent (TDD Specialist)

**Purpose**: Write failing tests ONLY

**System Prompt**:
```
You are specialized in TDD Red Phase - writing failing tests.
Rules (NON-NEGOTIABLE):
1. Write EXACTLY ONE test
2. Test must FAIL for the RIGHT reason
3. Use domain language (behavior), not implementation details
4. Test behavior from user perspective

FORBIDDEN:
- Writing implementation code
- Writing multiple tests
- Refactoring existing code
```

**Tool Access Policy**:
```typescript
{
  allowedTools: [
    { name: "readFile", operations: ["read"], scope: "**/*" },
    { name: "writeFile", operations: ["write", "create"], scope: "**/*.test.ts" },
    { name: "runTests", operations: ["execute"] }
  ],
  deniedTools: [
    "writeFile:src/**/*.ts",  // Cannot write production code
    "deleteFile",
    "modifyPackageJson"
  ]
}
```

**Output Validation**:
```typescript
const redPhaseGate = {
  checks: [
    {
      name: "single-test",
      validator: async (output) => {
        const testCount = await countNewTests(output);
        return { passed: testCount === 1, reason: "Exactly one test required" };
      },
      critical: true
    },
    {
      name: "test-fails",
      validator: async (output) => {
        const result = await runTests(output.testFile);
        return { passed: !result.passed, reason: "Test must fail in RED phase" };
      },
      critical: true
    },
    {
      name: "failure-clear",
      validator: async (output) => {
        return {
          passed: output.failureReason && output.failureReason.length > 10,
          reason: "Must document why test fails"
        };
      },
      critical: false
    }
  ],
  onFailure: "retry"
};
```

---

#### GREEN Agent (TDD Specialist)

**Purpose**: Write minimal implementation ONLY

**System Prompt**:
```
You are specialized in TDD Green Phase - minimal implementation.
Rules (NON-NEGOTIABLE):
1. Write MINIMAL code to make test pass
2. NO anticipatory coding (YAGNI)
3. NO refactoring (that's the next phase)
4. NO writing new tests

Your goal: Make test green with absolute minimum changes.
```

**Tool Access Policy**:
```typescript
{
  allowedTools: [
    { name: "readFile", operations: ["read"] },
    { name: "writeFile", operations: ["write", "create"], scope: "src/**/*.ts" },
    { name: "runTests", operations: ["execute"] }
  ],
  deniedTools: [
    "writeFile:**/*.test.ts",  // Cannot write tests in GREEN phase
    "deleteFile"
  ]
}
```

**Output Validation**:
```typescript
const greenPhaseGate = {
  checks: [
    {
      name: "test-passes",
      validator: async (output) => {
        const result = await runAllTests();
        return { passed: result.allPassed, reason: "All tests must pass" };
      },
      critical: true,
      autoFix: async (output) => {
        // Re-run GREEN agent with failure context
        return await retryGreenPhase(output, result.failures);
      }
    },
    {
      name: "no-new-tests",
      validator: async (output) => {
        const newTests = await countNewTests(output);
        return { passed: newTests === 0, reason: "Don't add tests in GREEN" };
      },
      critical: true
    },
    {
      name: "minimal-change",
      validator: async (output) => {
        const linesChanged = await countLinesChanged(output);
        return {
          passed: linesChanged < 50,
          reason: "Implementation should be minimal"
        };
      },
      critical: false  // Warning only
    }
  ],
  onFailure: "retry"
};
```

---

#### REFACTOR Agent (TDD Specialist)

**Purpose**: Improve code structure while keeping tests green

**System Prompt**:
```
You are specialized in TDD Refactor Phase - code improvement.
Rules (NON-NEGOTIABLE):
1. Improve code structure ONLY
2. NO new functionality
3. NO writing tests
4. Tests must remain GREEN throughout

Your goal: Better code structure with zero behavior changes.
```

**Tool Access Policy**:
```typescript
{
  allowedTools: [
    { name: "readFile", operations: ["read"] },
    { name: "writeFile", operations: ["write"], scope: "src/**/*.ts" },
    { name: "runTests", operations: ["execute"] }
  ],
  deniedTools: [
    "writeFile:**/*.test.ts",
    "deleteFile",
    "createFile"  // No new files during refactor
  ]
}
```

**Output Validation**:
```typescript
const refactorPhaseGate = {
  checks: [
    {
      name: "tests-still-green",
      validator: async (output) => {
        const result = await runAllTests();
        return {
          passed: result.allPassed,
          reason: "Refactoring broke tests!"
        };
      },
      critical: true,
      autoFix: async (output) => {
        // Rollback refactor if tests break
        await gitRevert(output.commit);
        return null;  // Cannot auto-fix broken refactor
      }
    },
    {
      name: "complexity-reduced",
      validator: async (output) => {
        const before = await measureComplexity(output.originalFile);
        const after = await measureComplexity(output.refactoredFile);
        return {
          passed: after <= before,
          reason: "Refactoring should reduce complexity"
        };
      },
      critical: false
    },
    {
      name: "no-behavior-change",
      validator: async (output) => {
        const testResults = await runTests();
        const sameResults = compareTestResults(
          output.beforeTests,
          testResults
        );
        return {
          passed: sameResults,
          reason: "Behavior must not change"
        };
      },
      critical: true
    }
  ],
  onFailure: "rollback"
};
```

---

#### ARCHITECTURE Agent

**Purpose**: Enforce Clean Architecture boundaries

**System Prompt**:
```
You are a Clean Architecture enforcer.
Your role:
1. Review code for architecture violations
2. Check dependency directions (inner layers don't depend on outer)
3. Validate layer responsibilities
4. Suggest architectural improvements

You don't write code - you validate and guide.
```

**Tools**: `readFile`, `analyzeAST`, `checkDependencies`, `generateReport`

**Checks**:
- Domain has no framework dependencies
- Use Cases return Result types
- Controllers are thin HTTP adapters
- Infrastructure implements interfaces from domain

---

#### CONTRACT Agent

**Purpose**: Manage consumer/provider contracts (Pact)

**System Prompt**:
```
You are a contract testing specialist (Pact).
Your role:
1. Write consumer contract tests
2. Verify provider implements contracts
3. Ensure backward compatibility
4. Manage contract publishing

You protect against breaking changes between services.
```

**Tools**: `readFile`, `writeFile:**/*.pact.test.ts`, `runPactTests`, `publishContracts`

---

#### REVIEW Agent

**Purpose**: Final code quality check

**System Prompt**:
```
You are a code reviewer focused on XP/CD best practices.
Your role:
1. Check test coverage (must be 100%)
2. Verify workflow was followed (TDD, Clean Arch, etc.)
3. Check for anti-patterns
4. Validate commit readiness

You provide final approval before shipping.
```

**Tools**: `readFile`, `runAllTests`, `checkCoverage`, `lintCode`

---

#### CI/CD Agent

**Purpose**: Set up deployment pipelines

**System Prompt**:
```
You are a CI/CD specialist for GitHub Actions.
Your role:
1. Create commit stage workflows
2. Create release stage workflows
3. Create acceptance stage workflows
4. Configure deployment gates

You ensure pipelines follow CD best practices.
```

**Tools**: `readFile`, `writeFile:.github/workflows/*.yml`, `validateWorkflow`

---

## Context Management & Token Optimization

### Context Compression Strategy

**Problem**: Full conversation history is expensive (50k-100k tokens)

**Solution**: Transfer only essential state between agents

```typescript
// ❌ BAD: Full context (expensive)
const fullContext = {
  conversationHistory: [...100 messages],  // 50k tokens
  allFiles: [...entire codebase],          // 200k tokens
  allTestResults: [...verbose output]      // 30k tokens
};
// Total: 280k tokens (~$4.20)

// ✅ GOOD: Compressed context (efficient)
const compressedContext = {
  previousPhase: {
    phase: "red",
    outcome: "Test written and failing",
    testFile: "src/register-user.use-case.test.ts",
    failureReason: "User class not implemented"
  },
  relevantFiles: [
    { path: "src/register-user.use-case.test.ts", content: "..." }
  ],
  metrics: {
    testCount: 1,
    testStatus: "failing"
  }
};
// Total: 2-3k tokens (~$0.03-0.05)
```

**Compression Rules**:
1. Previous phase: Summary only, not full transcript
2. Files: Only those modified in current phase
3. Test results: Metrics only, not full output
4. References: Point to archived state files

### Token Budget Allocation

```typescript
const TOKEN_BUDGET_PER_FEATURE = {
  total: 50000,  // ~$0.75 per feature

  allocation: {
    "vision-agent": 5000,      // 10% - Vision definition
    "plan-agent": 7500,        // 15% - Behavioral analysis
    "atdd-agent": 10000,       // 20% - Acceptance tests
    "red-agent": 7500,         // 15% - Failing tests
    "green-agent": 10000,      // 20% - Implementation
    "refactor-agent": 5000,    // 10% - Refactoring
    "review-agent": 2500,      // 5%  - Final review
    "reserve": 2500            // 5%  - Contingency
  },

  perPhaseLimit: {
    red: 7500,
    green: 10000,
    refactor: 5000
  }
};
```

### State Transfer Protocol

```typescript
interface StateTransfer {
  from: string;           // Source agent ID
  to: string;             // Target agent ID
  transferKeys: string[]; // What to transfer
  compressionLevel: "none" | "summary" | "reference";
}

// Example: RED → GREEN transfer
const redToGreenTransfer: StateTransfer = {
  from: "red-agent",
  to: "green-agent",
  transferKeys: [
    "testFile",           // Full content
    "testContent",        // Full content
    "failureReason",      // Summary
    "domainModel"         // Summary
  ],
  compressionLevel: "summary"
};

// Implementation
async function transferState(transfer: StateTransfer) {
  const sourceState = await getAgentState(transfer.from);
  const targetState = await getAgentState(transfer.to);

  for (const key of transfer.transferKeys) {
    const value = sourceState[key];

    if (transfer.compressionLevel === "summary") {
      targetState[key] = summarize(value);
    } else if (transfer.compressionLevel === "reference") {
      const archivePath = await archiveValue(key, value);
      targetState[key] = { ref: archivePath };
    } else {
      targetState[key] = value;  // Full transfer
    }
  }

  await saveAgentState(transfer.to, targetState);
}
```

## Benefits Summary

| Aspect | Current | With Multi-Agent |
|--------|---------|-----------------|
| **Accuracy** | 70-80% | 90-95% |
| **Manual Interventions** | 5-7 per feature | 0-1 per feature |
| **Token Cost** | $1.50-2.00 | $0.10-0.50 |
| **Workflow Violations** | 3-5 per feature | 0 (blocked) |
| **Test Coverage** | 60-70% | 100% (enforced) |
| **Development Time** | 2-3 hours | < 1 hour |
| **DORA Metrics** | Low/Medium | Elite |

## Next Steps

1. **Implement State Management** (Week 1)
2. **Build Orchestrator** (Week 2)
3. **Create Specialist Agents** (Week 3-4)
4. **Add Validation Gates** (Week 5)
5. **Build Platform UI** (Week 6-8)
