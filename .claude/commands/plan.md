---
description: Create implementation plan using Example Mapping and behavioral analysis
argument-hint: <feature description, user story, or JIRA ticket>
---

# Plan: Feature Discovery and Implementation Planning

Create a structured implementation plan that bridges product thinking with test-driven development.

## Rule Loading: Not Required

⚠️ **This command does NOT require rule loading.**

**Why:** The `/plan` command focuses on:
- Feature discovery and requirements gathering
- Example Mapping sessions
- Behavioral analysis
- Planning documentation

**No code is generated**, therefore no coding rules are needed.

**What happens next:** After plan approval, use commands like `/red`, `/acceptance-test`, or `/spike` which will load appropriate rules for code generation.

---

## Input

$ARGUMENTS

(If no input provided, check conversation context or ask for feature details)

**IMPORTANT: Leverage Frontend Reference Materials (If Available)**

Before starting the planning process, check if frontend reference materials exist:

1. **Check for Frontend Screenshots**: `docs/frontend-reference/screenshots/`
   - If screenshots exist, review them to understand:
     - User interface layouts and workflows
     - Form fields and their expected validation
     - Data displayed to users (informs API response structures)
     - User interactions and state transitions
   - Use screenshots to ask better questions about behavior
   - Reference specific UI elements when documenting examples

2. **Check for API Contracts**: `docs/frontend-reference/contracts/`
   - If contracts exist (OpenAPI, Pact, GraphQL schemas), review them to understand:
     - Expected API endpoints and HTTP methods
     - Request/response payload structures
     - Required vs optional fields
     - Data types and validation rules
     - Error response formats
   - Use contracts as a starting point for behavioral scenarios
   - Ensure planned implementation matches contract expectations

**Why this matters:**
- Screenshots provide visual context for "what the user sees"
- Contracts provide technical specification for "what the API must do"
- Together, they bridge the gap between user experience and backend implementation
- Reduces ambiguity and prevents rework

## Process

### Phase 1: Understand the Feature

**1.1 User Story Mapping Context**

If a user story map exists at `<project-root>/docs/user-story-map/`, review it to understand:
- Which activity this feature belongs to
- The user tasks it enables
- How it fits in the overall user journey

**1.2 Example Mapping Session**

Conduct Example Mapping to build shared understanding:

```
┌─────────────────────────────────────────────────────────────┐
│  🟡 STORY (Yellow)                                          │
│  What is the user story or feature?                         │
│  "As a [user], I want [goal] so that [benefit]"            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  🔴 RULE      │   │  🔴 RULE      │   │  🔴 RULE      │
│  Business     │   │  Business     │   │  Business     │
│  rule #1      │   │  rule #2      │   │  rule #3      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
   ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
   ▼         ▼         ▼         ▼         ▼         ▼
┌──────┐ ┌──────┐   ┌──────┐ ┌──────┐   ┌──────┐ ┌──────┐
│🟢 Ex │ │🟢 Ex │   │🟢 Ex │ │🟢 Ex │   │🟢 Ex │ │🟢 Ex │
│ample│ │ample │   │ample │ │ample │   │ample │ │ample │
└──────┘ └──────┘   └──────┘ └──────┘   └──────┘ └──────┘

🔵 QUESTIONS: Capture any unknowns that need clarification
```

Document:
- **Story (Yellow)**: The feature in user story format
- **Rules (Red)**: Business rules that govern behavior
- **Examples (Green)**: Concrete scenarios that illustrate each rule
- **Questions (Blue)**: Unknowns that need clarification before proceeding

### Phase 2: Behavioral Analysis

**CRITICAL GATE**: Document ALL behavioral variants before implementation.

For each rule identified, list:

1. **Happy Path**: The main success scenario
2. **Edge Cases**: Boundary conditions and limits
3. **Error Cases**: What can go wrong and how to handle it
4. **Validation Rules**: Input constraints and business validations

Format as Given-When-Then scenarios:

```gherkin
Rule: [Business rule description]

Example: [Scenario name]
  Given [initial context]
  When [action occurs]
  Then [expected outcome]
```

### Phase 3: Human Confirmation

**Present the behavioral analysis to the user for approval.**

Ask:
> I've identified the following behavioral variants for this feature:
> [List all scenarios]
>
> Are these complete? Should I add, modify, or remove any scenarios?
>
> **No implementation will proceed without your explicit approval.**

Wait for confirmation before proceeding.

### Phase 4: Implementation Plan

Once behaviors are approved, create the implementation plan following the workflow:

**Step 0: System Test Definition** (if applicable)
- [ ] Create Gherkin feature file in system-tests repo
- [ ] Implement DSL layer
- [ ] Define test data models

**Step 1: Backend Implementation** (with TDD)
For each behavior:
- [ ] Sociable Unit Test → Use Case
- [ ] Domain entities and value objects
- [ ] Narrow Integration Test → Repository (if needed)
- [ ] Component Test → Full vertical slice

**Step 2: Frontend Implementation** (with TDD)
For each UI component:
- [ ] Component Test → UI behavior
- [ ] Contract Test → API integration (Pact)

**Step 3: Contract Verification**
- [ ] Provider contract tests in backend

**Step 4: System Test Implementation** (if applicable)
- [ ] Step definitions
- [ ] Driver implementations
- [ ] Page objects

### Output Format

```markdown
## Feature: [Name]

### Story
As a [user], I want [goal] so that [benefit]

### Rules & Examples

#### Rule 1: [Description]
- Example 1.1: [Happy path scenario]
- Example 1.2: [Edge case]

#### Rule 2: [Description]
- Example 2.1: [Scenario]

### Questions (to clarify)
- [ ] [Question 1]
- [ ] [Question 2]

### Implementation Tasks

#### Backend
1. [ ] [Task with Given-When-Then acceptance criteria]
2. [ ] [Task]

#### Frontend
1. [ ] [Task]

#### System Tests
1. [ ] [Task]

### Dependencies
- Requires: [any prerequisites]
- Blocks: [what this unblocks]
```

## Key Principles

**From XP/CD:**
- Shared understanding through Example Mapping
- Small, deployable increments
- Feedback at every step

**From TDD:**
- Acceptance criteria become tests
- Each task maps to test(s)
- Break work into smallest testable pieces

## Integration with Other Commands

- **Before /plan**: Use `/spike` if technical exploration needed
- **After /plan approval**: Use `/red` to start TDD on first task
- **During work**: Return to plan to track progress

---

## MANDATORY: Workflow Checkpoint

After completing this command, you MUST suggest the next step:

**Current Phase**: Phase 0 - UNDERSTAND (Discovery and Planning)

**Suggested Next Steps**:
1. **If plan approved by user**: `/acceptance-test` - Start Phase 1 (System Test Definition) with first Gherkin scenario
2. **If technical unknowns exist**: `/spike` - Technical exploration to resolve unknowns before committing to tests
3. **If need to define product vision first**: `/vision` - Define strategic context before feature planning

**Output Format**:
```
✅ PLAN COMPLETE

Feature: [feature name]
Behavioral Analysis:
- Variants: [count] documented
- Edge Cases: [count] identified
- Questions: [count] resolved

Plan saved to: [file path]

Suggested Next Step:
→ /acceptance-test - Write first Gherkin scenario (Phase 1: System Test Definition)
   OR
→ /spike [technical question] - Explore technical unknowns before committing to tests

See: CLAUDE.md "Development Workflow" and docs/workflow-flowchart.md for complete workflow
```

**DO NOT complete this command without suggesting the appropriate next step based on plan approval.**
