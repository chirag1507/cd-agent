# CD-Agent: Continuous Delivery as a Learning System

> An opinionated AI development agent that embeds XP/CD best practices to achieve Elite DORA metrics.
> **Build the product right. Ship value fast. Learn continuously.**

## Vision

**Problem**: 90% of engineers have adopted AI-assisted coding (DORA 2025), but AI amplifies existing organizational patterns—both good and bad. Without engineering discipline, AI accelerates chaos.

**Solution**: This agent encodes proven XP/CD practices directly into the development workflow. It doesn't just generate code—it generates **disciplined, continuously deployable code** through TDD, Clean Architecture, and comprehensive testing.

**Goal**: Teams using this agent will achieve **Elite DORA metrics**:
- Deployment Frequency: On-demand (multiple deploys per day)
- Lead Time for Changes: Less than one hour
- Change Failure Rate: 0-15%
- Time to Restore Service: Less than one hour

## Target Users

- **CTOs/Engineering Managers**: Seeking engineering transformation and AI ROI
- **Tech Leads**: Implementing best practices at team level
- **Individual Developers**: Building features with built-in quality

---

## The CD Learning System

Continuous Delivery is not just about deployment automation—it's a **product learning system**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PDCA LEARNING LOOP                               │
│                                                                          │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│    │   PLAN   │─────▶│    DO    │─────▶│  CHECK   │─────▶│   ACT    │   │
│    │          │      │          │      │          │      │          │   │
│    │Hypothesis│      │Experiment│      │ Evidence │      │ Decision │   │
│    └──────────┘      └──────────┘      └──────────┘      └──────────┘   │
│         ▲                                                      │        │
│         └──────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Every feature is an experiment**:
1. **Hypothesis**: "We believe [feature] will [outcome] for [users]"
2. **Experiment**: Build, test, deploy (TDD ensures quality)
3. **Evidence**: Gather production metrics, user feedback
4. **Decision**: Pivot, persevere, or kill

### XP Values

These values guide every decision this agent makes:

| Value | How It Manifests |
|-------|------------------|
| **Communication** | Clear code, meaningful tests, readable commits |
| **Simplicity** | YAGNI, minimal code to pass tests, no over-engineering |
| **Feedback** | Fast test cycles, CI/CD pipelines, production metrics |
| **Courage** | Refactor fearlessly with test coverage, delete dead code |
| **Respect** | Honor team conventions, clean architecture boundaries |
| **Humility** | Accept that tests reveal truth, learn from failures |
| **Curiosity** | Explore edge cases, question assumptions |
| **Empathy** | Write code for the next developer |

---

## Core Practices

### 1. Test-Driven Development (TDD) & BDD

The agent enforces **pure TDD** with the Red-Green-Refactor cycle:

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR │
│  Write  │     │  Make   │     │ Improve  │
│ failing │     │  test   │     │  code    │
│  test   │     │  pass   │     │structure │
└─────────┘     └─────────┘     └──────────┘
      ▲                               │
      └───────────────────────────────┘
```

**TDD Core Rules**:
- ONE test at a time (no batch test writing)
- Test must fail for the RIGHT reason
- MINIMAL code to pass the test (no anticipatory coding)
- Refactor ONLY with green tests

**BDD Integration**:
- Use **Example Mapping** for shared understanding
  - Yellow cards: User Story
  - Green cards: Examples (acceptance criteria)
  - Red cards: Rules (business logic)
  - Blue cards: Questions (unknowns to resolve)
- Use **User Story Mapping** to visualize feature scope
- Express acceptance criteria as Gherkin scenarios

### 2. Modern Test Pyramid

Based on the comprehensive testing strategy:

```
┌───────────────────────────────────────────────────────────────────────┐
│                        SYSTEM LEVEL TESTS                              │
│  (Separate repo: <project>-system-tests)                              │
├───────────────────────────────────────────────────────────────────────┤
│                         ┌───────────────┐                              │
│                         │  Smoke Tests  │  ◀── Production health       │
│                         ├───────────────┤                              │
│                         │   E2E Tests   │  ◀── Critical user journeys  │
│              ┌──────────┴───────────────┴──────────┐                   │
│              │  Acceptance    │   External System  │                   │
│              │    Tests       │   Contract Tests   │                   │
│              └────────────────┴────────────────────┘                   │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                       COMPONENT LEVEL TESTS                            │
│  (Same repo as production code)                                        │
├───────────────────────────────────────────────────────────────────────┤
│              ┌────────────────┬────────────────────┐                   │
│              │   Component    │     Contract       │                   │
│              │    Tests       │      Tests         │                   │
│              ├────────────────┴────────────────────┤                   │
│              │    Sociable Unit Tests              │                   │
│              ├─────────────────────────────────────┤                   │
│              │    Narrow Integration Tests         │                   │
│              └─────────────────────────────────────┘                   │
└───────────────────────────────────────────────────────────────────────┘
```

**Layer Definitions**:

| Layer | Purpose | Speed | Scope |
|-------|---------|-------|-------|
| **Sociable Unit Tests** | Test behavior with real domain collaborators, stubs for boundaries | Fast (~ms) | Use case + domain |
| **Narrow Integration** | Test adapters with real infrastructure (DB, file system) | Medium | Adapter + real dependency |
| **Component Tests** | Test use cases through HTTP interface | Medium | Full vertical slice |
| **Contract Tests** | Consumer-driven contracts via Pact | Fast | API boundaries |
| **Acceptance Tests** | Executable Specifications via Four-Layer Model | Slow | Full system via UI/API |
| **E2E Tests** | Critical user journeys end-to-end | Slowest | Multiple systems |
| **Smoke Tests** | Production deployment validation | Fast | Health endpoints |

**Test Double Strategy** (Stubs & Spies with `jest.fn()`):
- Use stubs for boundaries (repositories, external services)
- Use real domain objects for collaborators within the domain
- Prefer Classical TDD (state verification) over Mockist TDD (behavior verification)
- Avoid strict mocks with pre-defined expectations

### 3. Clean Architecture (Uncle Bob)

Use-case driven design with strict dependency rules:

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION                                 │
│  Controllers, Routes, DTOs, View Mappers                         │
├──────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                               │
│  Repositories (impl), External Services, Mappers, Config         │
├──────────────────────────────────────────────────────────────────┤
│                      APPLICATION                                  │
│  Use Cases, Request/Response Types, Validators, Factories        │
├──────────────────────────────────────────────────────────────────┤
│                         DOMAIN                                    │
│  Entities, Value Objects, Domain Events, Repository              │
│  Interfaces, Service Interfaces, Domain Errors                   │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                    Dependencies point inward
```

**Dependency Rule**: Inner layers know nothing about outer layers. Domain is pure business logic with no framework dependencies.

**Use Case Standards**:
- Single Responsibility: One business purpose per use case
- No framework dependencies (no Express, Prisma, JWT in use cases)
- Business-focused naming (`RegisterUserUseCase`, not `SaveUserToDatabase`)
- Return `Result<Success, BusinessError>` types
- Cross-cutting concerns via decorators (logging, caching, session management)

**Project Structure**:
```
src/
├── <bounded-context>/
│   ├── domain/
│   │   ├── entities/           # Rich domain objects
│   │   ├── value-objects/      # Immutable value types
│   │   ├── events/             # Domain events
│   │   ├── errors/             # Domain-specific errors
│   │   └── interfaces/         # Ports (repository, service contracts)
│   │       ├── repositories/
│   │       └── services/
│   ├── application/
│   │   └── use-cases/
│   │       └── <use-case>/
│   │           ├── <use-case>.use-case.ts
│   │           ├── <use-case>.types.ts
│   │           ├── <use-case>.factory.ts
│   │           ├── <use-case>.validator.ts
│   │           └── <use-case>.use-case.test.ts
│   ├── infrastructure/
│   │   ├── repositories/       # Adapters (Prisma, etc.)
│   │   ├── services/           # External service implementations
│   │   ├── mappers/            # Domain ↔ Persistence mappers
│   │   └── config/
│   ├── presentation/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── dtos/
│   │   └── mappers/            # Domain ↔ HTTP mappers
│   ├── external-system-stubs/  # Test doubles for external systems
│   └── __tests__/
│       ├── builders/           # Test data builders
│       └── component/          # Component tests
```

### 3b. Clean Architecture (Frontend)

Frontend follows the same principles with React/Next.js adaptations:

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION                                 │
│  Pages (app/), Feature Components, Custom Hooks                  │
├──────────────────────────────────────────────────────────────────┤
│                      APPLICATION                                  │
│  Use Cases (pure TypeScript, no React)                           │
├──────────────────────────────────────────────────────────────────┤
│                      DOMAIN                                       │
│  Types, Interfaces (Ports), Mappers, Constants                   │
├──────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                               │
│  Repositories (Adapters), Services (Http, Storage, Navigation)   │
└──────────────────────────────────────────────────────────────────┘
```

**Frontend Project Structure**:
```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx
│   └── <route>/page.tsx
├── features/                      # Feature modules (Bounded Contexts)
│   └── <feature>/
│       ├── application/usecases/  # Business logic (NO React imports)
│       ├── components/            # Feature-specific UI
│       ├── hooks/                 # Custom React hooks
│       ├── interfaces/            # Repository ports
│       ├── mappers/               # Domain → Presentation
│       ├── repositories/          # Repository adapters
│       └── types/                 # Domain types
└── shared/
    ├── components/
    │   ├── atoms/                 # Basic building blocks (Button, Input)
    │   ├── molecules/             # Composed atoms (SearchBar, IconButton)
    │   ├── organisms/             # Complex sections (AuthForm, Navbar)
    │   ├── templates/             # Page layouts
    │   └── shadcn/                # shadcn/ui components
    ├── interfaces/                # Service interfaces (HttpClient, etc.)
    ├── providers/                 # React Context (Dependency Injection)
    ├── services/                  # Service adapters
    └── lib/utils.ts               # Tailwind cn() helper
```

**Key Frontend Rules**:
- **Use Cases**: Pure TypeScript, NO React imports, constructor injection
- **Mappers**: Static methods, pure functions, domain → presentation
- **Hooks**: Coordinate use cases + React state, inject dependencies
- **Components**: Thin presentation, delegate logic to hooks
- **Atomic Design**: atoms → molecules → organisms → templates

### 4. Four-Layer Model (Dave Farley)

System-level acceptance tests live in a separate repository: `<project>-system-tests`

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: TEST CASES (Executable Specifications)                │
│  Written in problem-domain language                             │
│  From perspective of external user                              │
│  Focus on WHAT, not HOW                                         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: DOMAIN SPECIFIC LANGUAGE (DSL)                        │
│  Shared between test cases                                      │
│  Optional parameters for precision where needed                 │
│  Domain concepts only - clean from HOW                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │   Protocol   │  │   Protocol   │  │  External System │       │
│  │    Driver    │  │    Driver    │  │      Stubs       │       │
│  │    (UI)      │  │    (API)     │  │                  │       │
│  └──────────────┘  └──────────────┘  └──────────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                   SYSTEM UNDER TEST (SUT)                       │
│  Deployed using same tools as production                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles**:
- Test Cases should make sense to the least technical person who understands the domain
- If you replaced the SUT completely, your tests should still make sense
- Use `placeAnOrder()` not "click submit button" - domain language only
- Make scenarios atomic - no shared test data between tests

**System Tests Structure**:
```
<project>-system-tests/
├── test-cases/             # Executable Specifications
│   ├── shopping/
│   │   └── buy-book.test.ts
│   └── account/
│       └── registration.test.ts
├── dsl/                    # Domain Specific Language
│   ├── shopping.dsl.ts
│   ├── account.dsl.ts
│   └── params.ts           # Parameter parsing utilities
├── drivers/
│   ├── interfaces/         # Driver contracts
│   │   ├── shopping.driver.ts
│   │   └── account.driver.ts
│   ├── ui/                 # UI Protocol Drivers
│   │   └── shopping-ui.driver.ts
│   └── api/                # API Protocol Drivers
│       └── shopping-api.driver.ts
└── support/
    ├── config.ts
    └── hooks.ts
```

---

## Technical Stack

### Backend
- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express
- **Testing**: Jest (unit/component/contract), Supertest
- **Contract Testing**: Pact (Provider)

### Frontend
- **Language**: TypeScript
- **Framework**: Next.js (App Router)
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Contract Testing**: Pact (Consumer)
- **Architecture**: Clean Architecture + Atomic Design

### Shared
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Acceptance Testing**: Cucumber + Playwright
- **External System Mocking**: [Scenarist](https://scenarist.io/)

---

## CI/CD Pipeline (GitHub Actions)

Each component (Frontend, Backend, microservices) has its own commit stage workflow.
The pipeline is implemented as GitHub Actions workflows with specific triggers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              COMMIT STAGE (per component: FE, BE, microservices)         │
│  Trigger: push/PR to main                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ test_and_checks job:                                            │    │
│  │ ┌────────┬────────┬────────┬─────────────┬───────────────────┐  │    │
│  │ │Compile │  Unit  │Contract│ Integration │    Component      │  │    │
│  │ │  TS    │ Tests  │ Verify │   Tests     │      Tests        │  │    │
│  │ └────────┴────────┴────────┴─────────────┴───────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                         (on main, if tests pass)                         │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Docker Build & Publish to GHCR                                  │    │
│  │ (tagged with commit SHA)                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    (manual trigger with commit SHAs)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     RELEASE STAGE (release-uat.yml)                      │
│  Trigger: workflow_dispatch (manual with inputs)                         │
│  Inputs: frontend_commit_sha, backend_commit_sha, deploy_to_qa/uat       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 1. check_can_deploy: pact-broker can-i-deploy (per environment) │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 2. deploy_to_environment: SSH to EC2, docker compose up        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 3. record_deployment_and_state:                                 │    │
│  │    ├── Record to Pact Broker                                    │    │
│  │    └── Write state/<env>-deployed-versions.json                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 4. run_smoke_tests: Verify deployment health                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                       (scheduled every 15 min)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 ACCEPTANCE STAGE (acceptance-stage-uat.yml)              │
│  Trigger: schedule (*/15 * * * *) OR workflow_dispatch                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Version Check:                                                  │    │
│  │ ├── Read state/<env>-deployed-versions.json                     │    │
│  │ ├── Read state/<env>-last-successfully-tested-versions.json     │    │
│  │ └── Skip tests if versions match (already tested)               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                         (if versions differ)                             │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Test Execution:                                                 │    │
│  │ ├── 1. Backend Connectivity Diagnostics                        │    │
│  │ ├── 2. Smoke Tests                                              │    │
│  │ └── 3. Acceptance Tests (Cucumber + Playwright)                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                          (on success)                                    │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Update state/<env>-last-successfully-tested-versions.json       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pipeline State Management

The pipeline uses JSON state files in `state/` directory to track deployments:

```
state/
├── qa-deployed-versions.json           # What's deployed to QA
├── qa-last-successfully-tested-versions.json
├── uat-deployed-versions.json          # What's deployed to UAT
└── uat-last-successfully-tested-versions.json
```

This enables **intelligent test execution**: acceptance tests only run when new versions are deployed, avoiding redundant test runs.

### Environment Promotion Flow

```
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  Frontend   │   │   Backend   │   │ Microservice│
    │Commit Stage │   │Commit Stage │   │Commit Stage │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           │ (on success)    │ (on success)    │ (on success)
           ▼                 ▼                 ▼
    ┌──────────────────────────────────────────────┐
    │                     GHCR                      │
    │  (Docker images tagged with commit SHA)       │
    └──────────────────────────────────────────────┘
                           │
              (manual release trigger)
                           ▼
    ┌──────────────────────────────────────────────┐
    │     ┌─────────────────┐   ┌─────────────┐    │
    │     │       QA        │   │     UAT     │    │
    │     └─────────────────┘   └─────────────┘    │
    └──────────────────────────────────────────────┘
                           │
              (scheduled acceptance tests)
                           ▼
                    ┌─────────────┐
                    │ Production  │
                    │  (manual)   │
                    └─────────────┘
```

---

## Development Workflow

### Implementation Flow

Each feature follows this strict order:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 0. VISION & STRATEGY (/vision)                                           │
│    ├── Define product vision (Problem, Users, Value Prop)                │
│    ├── Set success metrics (DORA + Business + User)                      │
│    ├── Identify constraints and scope boundaries                         │
│    └── GATE: Vision documented in PRODUCT-VISION.md                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. UNDERSTAND (/plan)                                                    │
│    ├── Review User Story Map                                             │
│    ├── Behavioral Analysis (document ALL variants)                       │
│    ├── Ensure alignment with product vision                              │
│    └── GATE: Human approval required before implementation               │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. SYSTEM TEST DEFINITION                                                │
│    ├── Create Gherkin feature file                                       │
│    ├── Implement DSL layer and models                                    │
│    └── GATE: Feature + DSL approved                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. BACKEND IMPLEMENTATION (with TDD)                                     │
│    ├── Sociable Unit Tests → Use Case                                    │
│    ├── Narrow Integration Tests → Repository                             │
│    ├── Component Tests → Full vertical slice                             │
│    └── GATE: Backend reviewed                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. FRONTEND IMPLEMENTATION (with TDD)                                    │
│    ├── Component Tests → UI Components                                   │
│    ├── Contract Tests → API boundaries                                   │
│    └── GATE: Frontend reviewed                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. CONTRACT TESTING                                                      │
│    ├── Provider verification in backend                                  │
│    └── GATE: Contracts verified                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 6. SYSTEM TEST IMPLEMENTATION                                            │
│    ├── Step definitions                                                  │
│    ├── Page objects and drivers                                          │
│    └── GATE: System tests pass                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Command Reference

| Command | Phase | Purpose |
|---------|-------|---------|
| `/vision` | Strategy | Define product vision and goals |
| `/plan` | Discovery | Break feature into TDD-ready tasks |
| `/spike` | Exploration | Technical exploration (disposable code) |
| `/acceptance-test` | ATDD | Write Executable Specification (Test Case) |
| `/dsl` | ATDD | Implement Domain Specific Language layer |
| `/driver` | ATDD | Implement Protocol Driver layer |
| `/red` | TDD | Write ONE failing test |
| `/green` | TDD | Minimal implementation to pass |
| `/refactor` | TDD | Improve structure (tests must be green) |
| `/cycle` | TDD | Automated red-green-refactor |
| `/commit` | Ship | Conventional commit |
| `/ship` | Ship | Merge to main |
| `/code-review` | Quality | Domain-specific review |

---

## Key Constraints

### What This Agent WILL Do

- Enforce TDD discipline (one test at a time)
- Follow Clean Architecture boundaries
- Generate code that's continuously deployable
- Create comprehensive test coverage across the pyramid
- Use conventional commits
- Maintain separation between system tests and unit/component tests
- Follow the PDCA learning loop
- Apply XP values in every decision

### What This Agent WON'T Do

- Write implementation before tests
- Add multiple tests at once
- Over-engineer solutions
- Skip test layers
- Mix test levels inappropriately
- Violate architecture boundaries
- Add framework dependencies to domain/application layers

---

## Rules for Claude

<claude-commands-template>
## Project Rules

### General
- Use pnpm for package management
- Follow conventional commits (feat:, fix:, refactor:, test:, docs:)
- Never mention TDD in code comments or commit messages—the process is invisible
- All code must have tests at the appropriate pyramid level

### TDD Discipline
- ONE test at a time—this is non-negotiable
- Test must fail for the RIGHT reason before implementing
- MINIMAL code to pass—no anticipatory coding
- Refactor ONLY when tests are green

### Clean Architecture
- Domain layer has ZERO external dependencies
- Use Cases orchestrate domain logic
- Infrastructure implements interfaces defined in domain
- Presentation transforms between HTTP and Use Cases

### Testing Strategy
- Sociable unit tests: Real domain collaborators, stubs for boundaries
- Component tests: Use case level through HTTP interface
- Contract tests: Consumer-driven via Pact
- Acceptance tests: Four-layer BDD in separate system-tests repo

### Test Doubles (with Jest)
- Use `jest.fn()` for stubs and spies
- Stub return values: `.mockResolvedValue()`, `.mockReturnValue()`
- Spy verification: `expect(spy).toHaveBeenCalledWith()`
- Prefer Classical TDD (state verification) over Mockist TDD

### File Naming
- Use kebab-case for files: `add-project.use-case.ts`
- Tests co-located with implementation: `*.test.ts`
- Use `.types.ts` for type definitions
- Use `.factory.ts` for dependency injection

### Test Patterns
- Use Builder pattern for test data
- Use data-testid for DOM selection
- No hard-coded timeouts—use async patterns
</claude-commands-template>

---

## Integration: Task Tracking

**Phase 2**: JIRA MCP integration for:
- Linking commits to stories
- Automated status updates
- Sprint tracking
- Deployment notifications

---

## Getting Started

### For New Projects Using This Agent

1. Clone this repository as your starting point
2. Copy `.claude/commands/` to your project
3. Configure CLAUDE.md with your project specifics
4. Start with `/plan` to decompose your first feature
5. Use `/red` to begin TDD

### Project Initialization Checklist

- [ ] CLAUDE.md configured with project specifics
- [ ] `.claude/commands/` installed
- [ ] Package.json with test scripts
- [ ] TypeScript configured
- [ ] ESLint + Prettier configured
- [ ] Jest configured for unit/component tests
- [ ] Pact configured for contract tests
- [ ] System tests repo created (for acceptance tests)

---

## References

- **Workflow Flowchart**: [docs/workflow-flowchart.md](docs/workflow-flowchart.md) - Visual guide to the complete development workflow
- **Clean Architecture**: [reference/clean-architecture-reference/](reference/clean-architecture-reference/)
- **Four-Layer Model**: [reference/acceptance-test-reference/](reference/acceptance-test-reference/)
- **Rules Reference**: [reference/rules-reference/](reference/rules-reference/)
- **Ways of Working**: [reference/wow-reference/](reference/wow-reference/)
- **Test Strategy**: [reference/test-strategy-reference/](reference/test-strategy-reference/)
- **CD Pipeline**: [reference/cd-pipeline-reference/](reference/cd-pipeline-reference/)

---

## Current Status

- [x] Vision and objectives defined
- [x] Architecture documented
- [x] Tech stack chosen (TypeScript, Jest, Pact)
- [x] Testing strategy documented
- [x] Ways of Working integrated
- [x] Commands installed (13 commands in .claude/commands/)
- [x] Test rules installed (13 rules in .claude/rules/)
- [x] Four-Layer Model with Scenarist integration
- [x] npm package structure (package.json)
- [x] User documentation (README.md)
- [x] Frontend Clean Architecture patterns
- [x] Atomic Design with shadcn/ui + Tailwind
- [x] React Testing Library patterns
- [ ] First feature implemented with TDD
- [ ] JIRA MCP integration (Phase 2)
