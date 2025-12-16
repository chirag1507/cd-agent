# CD-Agent

> AI development commands that embed XP/CD best practices to achieve Elite DORA metrics.

**Build the product right. Ship value fast. Learn continuously.**

## What is CD-Agent?

CD-Agent is a set of Claude Code slash commands and rules that enforce disciplined software development practices:

- **Test-Driven Development** (Red-Green-Refactor cycle)
- **Clean Architecture** (Use-case driven, dependency rule)
- **Acceptance Test-Driven Development** (Dave Farley's Four-Layer Model)
- **Continuous Delivery** (Always deployable, small batches)

## Quick Start

### Option 1: npx (Recommended)

```bash
# Navigate to your project
cd my-project

# Install CD-Agent commands and rules
npx @avesta/cd-agent init

# Also copy CLAUDE.md template
npx @avesta/cd-agent init --with-claude-md
```

### Option 2: Git Clone

```bash
# Clone cd-agent
git clone https://github.com/chirag1507/cd-agent.git

# Copy to your project
cp -r cd-agent/.claude your-project/
cp cd-agent/CLAUDE.md your-project/
```

### After Installation

1. **Customize CLAUDE.md** for your project:
   - Tech stack (framework, database, etc.)
   - Domain concepts and bounded contexts
   - Team conventions

2. **Initialize project structure** (or use `/init` command in Claude):
   ```bash
   pnpm init
   pnpm add -D typescript jest ts-jest @types/jest
   pnpm add -D eslint prettier
   pnpm add -D @pact-foundation/pact  # For contract tests
   ```

3. **Start building with product vision**:
   ```bash
   # Define product vision first
   /vision

   # Plan your first feature
   /plan implement user registration

   # Write your first test
   /red user can register with email and password

   # Make it pass
   /green

   # Improve the code
   /refactor
   ```

## Available Commands

### Setup

| Command | Purpose |
|---------|---------|
| `/init [type]` | Initialize project structure (backend/frontend/fullstack/system-tests) |

### Discovery & Planning

| Command | Purpose |
|---------|---------|
| `/vision` | Define product vision, goals, and success metrics |
| `/plan <feature>` | Break feature into TDD-ready tasks using Example Mapping |
| `/spike <question>` | Technical exploration (disposable code) |

### Acceptance Testing (ATDD)

| Command | Purpose |
|---------|---------|
| `/acceptance-test <behavior>` | Write Executable Specification (Test Case layer) |
| `/dsl <method>` | Implement Domain Specific Language layer |
| `/driver <type>` | Implement Protocol Driver (UI/API) |

### Test-Driven Development (TDD)

| Command | Purpose |
|---------|---------|
| `/red <behavior>` | Write ONE failing test |
| `/green` | Minimal code to pass the test |
| `/refactor` | Improve structure (tests must be green) |
| `/cycle <behavior>` | Full TDD cycle with layer selection |

### Shipping

| Command | Purpose |
|---------|---------|
| `/commit` | Conventional commit |
| `/ship` | Merge to main |
| `/code-review` | Review for XP/CD best practices |

## Test Pyramid

CD-Agent enforces a comprehensive test strategy:

```
┌─────────────────────────────────────────────────────┐
│           SYSTEM TESTS (separate repo)              │
│  Acceptance Tests │ E2E Tests │ Smoke Tests         │
├─────────────────────────────────────────────────────┤
│           COMPONENT TESTS (same repo)               │
│  Component │ Contract │ Sociable Unit │ Integration │
└─────────────────────────────────────────────────────┘
```

Each test layer has specific rules. See `.claude/rules/` for details.

## Project Structure (Clean Architecture)

```
src/
├── <bounded-context>/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── interfaces/         # Ports
│   ├── application/
│   │   └── use-cases/
│   ├── infrastructure/
│   │   ├── repositories/       # Adapters
│   │   └── services/
│   └── presentation/
│       ├── controllers/
│       └── routes/
```

## Four-Layer Model (Acceptance Tests)

System-level tests use Dave Farley's Four-Layer Model:

```
┌─────────────────────────────────────────────────────┐
│  TEST CASES (Executable Specifications)             │
│  Written in problem-domain language                 │
├─────────────────────────────────────────────────────┤
│  DOMAIN SPECIFIC LANGUAGE (DSL)                     │
│  Shared methods, optional parameters                │
├─────────────────────────────────────────────────────┤
│  PROTOCOL DRIVERS          │  SCENARIST STUBS       │
│  (UI, API)                 │  (External Systems)    │
├─────────────────────────────────────────────────────┤
│  SYSTEM UNDER TEST (SUT)                            │
└─────────────────────────────────────────────────────┘
```

External systems are mocked with [Scenarist](https://scenarist.io/).

## Development Workflow

```
┌──────────────────────────────────────────────────────────────┐
│  1. VISION                                                    │
│     /vision → Define problem, users, goals, metrics           │
├──────────────────────────────────────────────────────────────┤
│  2. PLAN                                                      │
│     /plan <feature> → Example Mapping → TDD-ready tasks       │
├──────────────────────────────────────────────────────────────┤
│  3. ACCEPTANCE TEST (Outside-In)                              │
│     /acceptance-test → /dsl → /driver                         │
├──────────────────────────────────────────────────────────────┤
│  4. TDD (Inside-Out Implementation)                           │
│     /red → /green → /refactor (repeat)                        │
├──────────────────────────────────────────────────────────────┤
│  5. SHIP                                                      │
│     /commit → /ship                                           │
└──────────────────────────────────────────────────────────────┘
```

## Key Principles

### TDD Rules (Non-Negotiable)
- ONE test at a time
- Test must fail for the RIGHT reason
- MINIMAL code to pass
- Refactor ONLY when green

### Clean Architecture Rules
- Dependencies point inward
- Domain has ZERO external dependencies
- Use cases orchestrate domain logic

### XP Values
- **Simplicity**: YAGNI, no over-engineering
- **Feedback**: Fast tests, small batches
- **Courage**: Refactor with confidence

## Requirements

- Node.js 18+
- pnpm (recommended) or npm
- Claude Code CLI

## License

MIT

## Contributing

Issues and PRs welcome at [github.com/chirag1507/cd-agent](https://github.com/chirag1507/cd-agent)
