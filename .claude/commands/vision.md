# /vision - Define Product Vision

> Use this command to define, review, or refine the high-level product vision before feature development.

## Rule Loading: Not Required

⚠️ **This command does NOT require rule loading.**

**Why:** The `/vision` command is for strategic planning that:
- Defines product vision and goals
- Identifies target users and personas
- Creates PRODUCT-VISION.md documentation

**No code generation** occurs, therefore no coding rules are needed.

---

## Purpose

Establish a clear product vision that guides all feature development, ensuring every feature aligns with the overall product goals and user needs.

## When to Use

- **Starting a new product**: Define vision before any feature work
- **Product pivots**: Re-evaluate and update vision
- **Quarterly planning**: Review and refine vision
- **Onboarding new team members**: Share product direction
- **Before major features**: Ensure alignment with vision

## What This Command Does

The agent will guide you through defining or reviewing:

1. **Problem Statement**: What problem are we solving? For whom?
2. **Product Vision**: What is the desired end state?
3. **Target Users**: Who are the primary users/personas?
4. **Value Proposition**: Why would users choose this product?
5. **Success Metrics**: How do we measure if we're succeeding?
6. **Strategic Goals**: What are the high-level objectives? (Elite DORA metrics, business outcomes)
7. **Constraints**: Technical, business, or regulatory constraints
8. **Out of Scope**: What are we explicitly NOT building?

## Output

The agent will create or update `PRODUCT-VISION.md` in your project root with:

```markdown
# Product Vision: [Product Name]

## Problem Statement

**Who**: [Target users]
**Problem**: [Core problem being solved]
**Impact**: [Why this problem matters]

## Product Vision

[Compelling 2-3 sentence vision of the desired end state]

## Target Users

### Primary Persona: [Name]
- Role: [Job title/role]
- Pain Points: [Key frustrations]
- Goals: [What they want to achieve]
- Success Criteria: [How they measure success]

### Secondary Persona: [Name]
[Repeat structure]

## Value Proposition

**For** [target users]
**Who** [statement of need or opportunity]
**The** [product name]
**Is a** [product category]
**That** [key benefit, compelling reason to buy]
**Unlike** [primary competitive alternative]
**Our product** [statement of primary differentiation]

## Success Metrics

### DORA Metrics (Technical Excellence)
- Deployment Frequency: [Target]
- Lead Time for Changes: [Target]
- Change Failure Rate: [Target]
- Time to Restore Service: [Target]

### Business Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]

### User Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]

## Strategic Goals

1. [Goal 1] - [Why it matters]
2. [Goal 2] - [Why it matters]
3. [Goal 3] - [Why it matters]

## Constraints

### Technical Constraints
- [Constraint 1]
- [Constraint 2]

### Business Constraints
- [Constraint 1]
- [Constraint 2]

### Regulatory/Compliance
- [Constraint 1]

## Out of Scope

**We are explicitly NOT building:**
- [Anti-feature 1] - [Rationale]
- [Anti-feature 2] - [Rationale]

## Product Principles

1. [Principle 1] - [What this means in practice]
2. [Principle 2] - [What this means in practice]
3. [Principle 3] - [What this means in practice]

---

**Last Updated**: [Date]
**Next Review**: [Date]
```

## Usage Examples

### Define New Product Vision

```bash
/vision
```

Agent will ask discovery questions:
- What problem are you solving?
- Who are your target users?
- What's the desired end state?
- How will you measure success?
- What are the key constraints?

### Review Existing Vision

```bash
/vision
```

If `PRODUCT-VISION.md` exists, agent will:
- Read the current vision
- Ask if you want to review/update specific sections
- Suggest updates based on learnings

### Update Specific Section

```bash
/vision update metrics
```

Agent will focus on updating just the Success Metrics section.

## Integration with /plan

When you run `/plan` for a feature, the agent will:
1. Read `PRODUCT-VISION.md`
2. Ensure the feature aligns with the vision
3. Reference relevant personas and goals
4. Check against "Out of Scope" to avoid anti-patterns

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCT VISION                          │
│  Define: Problem, Users, Value Prop, Metrics, Goals         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER STORY MAPPING                        │
│  Map user journeys and identify features                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE PLANNING (/plan)                  │
│  Break down individual features with Example Mapping        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION (TDD)                      │
│  /cycle, /red, /green, /refactor                            │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Keep it concise**: Vision should fit on 2-3 pages
2. **Make it testable**: Success metrics should be measurable
3. **Review regularly**: Update quarterly or after major learnings
4. **Share widely**: Vision should be accessible to entire team
5. **Use it actively**: Reference vision in feature planning and code reviews
6. **Be honest about scope**: "Out of Scope" is as important as "In Scope"

## Vision Anti-Patterns

❌ **Too vague**: "Build the best product ever"
✅ **Specific**: "Enable developers to achieve Elite DORA metrics through AI-guided TDD"

❌ **Feature list**: "We'll build X, Y, and Z features"
✅ **Outcome-focused**: "Developers will deploy confidently multiple times per day"

❌ **Technology-focused**: "We'll use React, Node.js, and PostgreSQL"
✅ **User-focused**: "Developers will get instant feedback on code quality"

❌ **Unmeasurable**: "Users will love it"
✅ **Measurable**: "NPS > 50, Weekly Active Users > 10k"

## Example Vision Statement

**For** software development teams
**Who** struggle to maintain quality while moving fast
**The** CD-Agent
**Is an** AI development agent
**That** embeds XP/CD best practices directly into the development workflow
**Unlike** general-purpose AI coding assistants
**Our product** generates disciplined, continuously deployable code through TDD and Clean Architecture

## Related Commands

- `/plan` - Break down features aligned with vision
- `/spike` - Explore technical approaches within constraints
- `/code-review` - Verify implementation aligns with product principles
