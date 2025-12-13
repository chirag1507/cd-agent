---
description: Technical exploration - disposable code for learning
argument-hint: <technical question to explore>
---

# Spike: Technical Exploration

Conduct a time-boxed technical exploration to answer a specific question.

## Input

$ARGUMENTS

(The technical question or uncertainty to explore)

## What is a Spike?

A spike is **exploratory, disposable code** used to:
- Answer a technical question
- Reduce uncertainty before committing to an approach
- Learn how a library/API works
- Prototype a solution

**Spike code is NEVER production code.** It will be discarded.

```
┌─────────────────────────────────────────────────────────────┐
│                         SPIKE                                │
│                                                              │
│   Goal: Answer a question, NOT build a feature              │
│   Output: Knowledge and confidence, NOT code                │
│   Fate: DELETE when done                                     │
└─────────────────────────────────────────────────────────────┘
```

## When to Spike

Use a spike when you CAN'T write a meaningful failing test because:
- You don't understand the API/library
- You're unsure which approach is feasible
- The problem space is unclear
- You need to validate an assumption

## When NOT to Spike

Don't spike when:
- Requirements are clear
- You know the approach
- You're procrastinating on TDD
- The "exploration" is actually implementation

## Spike Process

### 1. Define the Question

Be specific about what you're trying to learn:

**Good questions:**
- "Can we use Prisma's `$transaction` for atomic operations?"
- "How does React Query handle cache invalidation?"
- "What's the performance of this algorithm with 10k items?"

**Bad questions:**
- "How does authentication work?" (too broad)
- "Build the login feature" (that's implementation, not exploration)

### 2. Time-Box

Set a strict time limit:
- Small spike: 30 minutes - 1 hour
- Medium spike: 2-4 hours
- Large spike: 1 day maximum

When time is up, STOP and summarize findings.

### 3. Explore

Write quick, dirty code to answer the question:
- No tests needed
- No clean code required
- Comments to self are fine
- Console.logs everywhere is fine

### 4. Document Findings

Record what you learned:

```markdown
## Spike: [Question]

### Approach Tried
[What you did]

### Findings
[What you learned]

### Recommendation
[Which approach to take in production]

### Code Samples (for reference)
[Key snippets that worked]

### Gotchas
[Surprises, pitfalls to avoid]
```

### 5. Discard Code

**DELETE the spike code.** Do not:
- Copy-paste into production
- "Clean up" the spike
- Commit the spike

Start fresh with TDD using the knowledge gained.

## Output Format

```
═══════════════════════════════════════════════════
SPIKE: [Question]
Time-box: [duration]
═══════════════════════════════════════════════════

EXPLORATION
───────────
[What was tried]

FINDINGS
────────
[What was learned]

RECOMMENDATION
──────────────
[Recommended approach]

CODE REFERENCE
──────────────
[Key code snippets for future reference]

GOTCHAS
───────
[Things to watch out for]

═══════════════════════════════════════════════════
SPIKE COMPLETE

Next: /plan [feature] with confidence
      /red [behavior] to start TDD
═══════════════════════════════════════════════════
```

## Integration with Workflow

```
Uncertainty detected
        │
        ▼
    /spike [question]
        │
        ▼
Knowledge gained, spike deleted
        │
        ▼
    /plan [feature]  ← Now with confidence
        │
        ▼
    /cycle [behavior]
```

## Examples

### API Integration Spike
```
/spike How to authenticate with GitHub OAuth API
```

### Performance Spike
```
/spike Will Prisma batch queries for N+1 prevention
```

### Library Evaluation Spike
```
/spike Compare Zod vs Yup for form validation
```

## Warning

**Spikes are seductive.** It's easy to keep "exploring" forever.

Stay disciplined:
- Strict time-box
- Specific question
- Delete when done
- Return to TDD immediately
