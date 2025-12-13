---
description: Create implementation plan using Example Mapping and behavioral analysis
argument-hint: <feature description, user story, or JIRA ticket>
---

# Plan: Feature Discovery and Implementation Planning

Create a structured implementation plan that bridges product thinking with test-driven development.

## Input

$ARGUMENTS

(If no input provided, check conversation context or ask for feature details)

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
