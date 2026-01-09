# Commit Stage Pipeline Rules

> **Trigger**: Creating or modifying commit stage CI/CD workflows (`.github/workflows/commit-stage.yml`)

## Purpose

Establish non-negotiable rules for commit stage pipelines that provide fast feedback, maintain quality gates, and enable continuous deployment with confidence.

## Core Principle

**The commit stage is the first and most critical quality gate.** Every commit must prove it's production-ready through comprehensive automated checks before any manual intervention.

## Non-Negotiable Rules

### 1. Fast Feedback (< 10 Minutes)

The commit stage MUST complete in under 10 minutes to maintain flow state.

```yaml
# ❌ BAD: Sequential jobs waste time
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  component-tests:
    runs-on: ubuntu-latest
    needs: unit-tests  # Unnecessary dependency
    steps:
      - run: npm run test:component

# ✅ GOOD: Parallel execution where possible
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit
      - run: npm run test:component
      - run: npm run test:integration
```

**Speed Optimization Strategies:**
- Run tests in parallel within a single job when no dependencies exist
- Cache dependencies (`node_modules`, Docker layers)
- Use `npm ci` instead of `npm install` for faster, deterministic installs
- Skip non-critical checks on PR (run full suite only on main branch)

### 2. Test Pyramid Enforcement

All test layers MUST pass before building artifacts.

```yaml
# ✅ GOOD: Complete test pyramid
steps:
  - name: Compile Code (TypeScript)
    run: npm run build

  - name: Run Unit Tests
    run: npm run test:unit -- --coverage --watchAll=false

  - name: Run Component Tests
    run: npm run test:component

  - name: Run Narrow Integration Tests
    run: npm run test:integration

  - name: Run Contract Verification Tests
    run: npm run test:contract

  - name: Run Linting
    run: npm run lint

  - name: Run Static Code Analysis
    run: npm run lint:check
```

**Required Test Layers:**
- **Unit Tests**: Sociable unit tests for use cases
- **Component Tests**: Full vertical slice through HTTP interface
- **Integration Tests**: Narrow integration with real dependencies (DB, APIs)
- **Contract Tests**: Pact consumer/provider verification
- **Static Analysis**: Linting, TypeScript checks, code quality

### 3. Conditional Docker Builds (Main Branch Only)

Docker images are ONLY built on successful merge to main branch.

```yaml
# ✅ GOOD: Docker builds conditional on main branch
docker_backend:
  name: Docker Build & Publish Backend Image
  runs-on: ubuntu-latest
  needs: [test_and_checks]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'

  steps:
    - name: Build Backend Image
      run: docker build -t project:${{ github.sha }} .
```

**Why:**
- PRs should focus on fast test feedback, not artifact creation
- Docker builds add 2-5 minutes to pipeline
- Only production-bound code needs artifacts

### 4. Immutable Artifact Tagging

Docker images MUST be tagged with commit SHA for traceability.

```yaml
# ✅ GOOD: SHA-based immutable tagging
- name: Build Backend Image
  run: |
    docker build -t project:${{ github.sha }} .
    docker tag project:${{ github.sha }} project:latest

- name: Publish Backend Image
  run: |
    docker tag project:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}
    docker tag project:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/project:latest
    docker push ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}
    docker push ghcr.io/${{ github.repository_owner }}/project:latest
```

**Required Tags:**
- `${{ github.sha }}`: Immutable version identifier
- `latest`: Convenience tag for development
- `latest-<environment>` (optional): Environment-specific latest (e.g., `latest-uat`)

**Why:**
- SHA tags enable precise deployment tracking
- `can-i-deploy` checks require version identification
- Rollback to specific commit SHA when issues arise

### 5. Contract Testing Integration

#### Consumer (Frontend/API Client)

```yaml
- name: Run Contract Verification Tests
  run: npm run test:contract

- name: Publish Pact Contract
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npm run publish:pacts
  env:
    PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
    GITHUB_SHA: ${{ github.sha }}
```

#### Provider (Backend/API Server)

```yaml
- name: Run Provider Contract Verification (conditional)
  if: ${{ (github.event_name == 'push' && github.ref == 'refs/heads/main') || github.event_name == 'workflow_dispatch' }}
  env:
    PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
    GITHUB_SHA: ${{ github.sha }}
    PACT_URL: ${{ github.event.inputs.pact_url }}
  run: npm run test:contract
```

**Why:**
- Consumers publish contracts on main branch
- Providers verify contracts on main branch AND via webhook (`workflow_dispatch`)
- Enables independent deployment with confidence

### 6. Database Setup for Integration Tests

When integration tests require a database:

```yaml
- name: Start Test Database
  run: docker compose up postgres -d

- name: Wait for Test Database
  run: |
    until docker compose exec postgres pg_isready -U test_user -d test_db; do
      echo "Waiting for test database..."
      sleep 2
    done

- name: Setup Test Environment
  run: echo "DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db" > .env

- name: Run Database Migrations
  run: npm run migrate

- name: Run Narrow Integration Tests
  run: npm run test:integration

- name: Stop Test Database
  if: always()
  run: docker compose down
```

**Critical Patterns:**
- Use `docker compose` for test database (not external instances)
- Use `if: always()` to ensure cleanup even on failure
- Wait for database readiness before running tests
- Isolate test data (dedicated test database)

### 7. Fail Fast on Any Error

Pipeline MUST stop immediately on first failure.

```yaml
# ✅ GOOD: Default behavior - fails on first error
steps:
  - name: Run Unit Tests
    run: npm run test:unit

  - name: Run Component Tests
    run: npm run test:component  # Skipped if unit tests fail

# ❌ BAD: Continue on error
steps:
  - name: Run Unit Tests
    run: npm run test:unit
    continue-on-error: true  # NEVER DO THIS

  - name: Run Component Tests
    run: npm run test:component
```

**Why:**
- Fast feedback on what broke
- No time wasted running subsequent steps
- Clear signal to developer

### 8. Secrets Management

NEVER hardcode secrets. Use GitHub Secrets.

```yaml
# ❌ BAD: Hardcoded credentials
env:
  PACT_BROKER_TOKEN: "abc123def456"

# ✅ GOOD: Reference secrets
env:
  PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

**Required Secrets:**
- `PACT_BROKER_BASE_URL`: Pact Broker URL
- `PACT_BROKER_TOKEN`: Pact Broker authentication token
- `AWS_ACCESS_KEY_ID` (if using ECR)
- `AWS_SECRET_ACCESS_KEY` (if using ECR)

### 9. Workflow Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:  # For provider contract verification via webhook
    inputs:
      pact_url:
        description: 'URL of the pact file to verify'
        required: false
```

**Trigger Rules:**
- `push` to `main`: Run full pipeline including Docker builds
- `pull_request`: Run tests and checks only (skip Docker builds)
- `workflow_dispatch`: Manual trigger or webhook (for provider verification)

### 10. Permissions

```yaml
permissions:
  contents: read     # Read repository contents
  packages: write    # Publish to GitHub Container Registry
```

**Why:**
- Principle of least privilege
- `contents: read` for checkout
- `packages: write` for GHCR publishing

## Common Anti-Patterns

### ❌ Running Tests Sequentially in Separate Jobs

```yaml
# BAD: Wastes time with multiple checkouts and setups
jobs:
  unit-tests:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit

  component-tests:
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:component
```

### ❌ Building Docker Images on Every PR

```yaml
# BAD: Slows down PR feedback
docker-build:
  runs-on: ubuntu-latest
  # Missing conditional - runs on every PR!
  steps:
    - run: docker build -t project:latest .
```

### ❌ Using `latest` Tag for Deployments

```yaml
# BAD: No version traceability
- run: docker tag project ghcr.io/owner/project:latest
- run: docker push ghcr.io/owner/project:latest
# How do you know what version is deployed?
```

### ❌ Skipping Test Layers

```yaml
# BAD: Only running unit tests
steps:
  - run: npm run test:unit
  # Missing: component, integration, contract tests
```

### ❌ Not Cleaning Up Resources

```yaml
# BAD: Database keeps running after tests
- name: Start Test Database
  run: docker compose up postgres -d

- name: Run Integration Tests
  run: npm run test:integration

# Missing: docker compose down
```

## Pipeline Structure Template

```yaml
name: <Project Name> Commit Stage

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      pact_url:
        description: 'URL of the pact file to verify'
        required: false

permissions:
  contents: read
  packages: write

jobs:
  # Job 1: Tests and Static Checks (ALWAYS runs)
  test_and_checks:
    name: Install, Tests & Static Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Compile Code (TypeScript)
        run: npm run build

      - name: Run Unit Tests
        run: npm run test:unit -- --coverage --watchAll=false

      - name: Run Component Tests
        run: npm run test:component

      # [Optional: Database setup for integration tests]

      - name: Run Narrow Integration Tests
        run: npm run test:integration

      # [Optional: Database teardown]

      - name: Run Contract Tests
        run: npm run test:contract

      - name: Run Linting
        run: npm run lint

      - name: Run Static Code Analysis
        run: npm run lint:check

  # Job 2: Docker Build (ONLY on main branch)
  docker_build:
    name: Docker Build & Publish
    runs-on: ubuntu-latest
    needs: [test_and_checks]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build Docker Image
        run: |
          docker build -t project:${{ github.sha }} .
          docker tag project:${{ github.sha }} project:latest

      - name: Publish Docker Image
        run: |
          docker tag project:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}
          docker tag project:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/project:latest
          docker push ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}
          docker push ghcr.io/${{ github.repository_owner }}/project:latest
```

## Microservice Pattern (Multiple Docker Images)

For projects with multiple Docker images (e.g., backend + Lambda functions):

```yaml
jobs:
  test_and_checks:
    # ... (same as above)

  # Parallel Docker builds using matrix strategy
  docker_builds:
    name: Docker Build & Publish - ${{ matrix.service }}
    runs-on: ubuntu-latest
    needs: [test_and_checks]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    strategy:
      matrix:
        include:
          - service: backend
            dockerfile: Dockerfile
            registry: ghcr.io
          - service: lambda-process-repo
            dockerfile: Dockerfile.process-repo.lambda
            registry: ecr
          - service: lambda-perform-exam
            dockerfile: Dockerfile.perform-exam.lambda
            registry: ecr

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # [Conditional login based on matrix.registry]

      - name: Build ${{ matrix.service }} Image
        run: |
          docker build -f ${{ matrix.dockerfile }} -t ${{ matrix.service }}:${{ github.sha }} .

      - name: Publish ${{ matrix.service }} Image
        run: |
          # [Registry-specific publish logic]
```

## Frontend Multi-Environment Pattern

For frontend projects requiring multiple environment builds:

```yaml
  build-images:
    runs-on: ubuntu-latest
    needs: commit-stage
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    strategy:
      matrix:
        environment: [uat, qa]

    steps:
      - name: Build Docker Image for ${{ matrix.environment }}
        run: |
          docker build --build-arg NEXT_PUBLIC_APP_ENV=${{ matrix.environment }} \
            -t project:${{ github.sha }}-${{ matrix.environment }} .
          docker tag project:${{ github.sha }}-${{ matrix.environment }} \
            project:latest-${{ matrix.environment }}

      - name: Publish Docker Image for ${{ matrix.environment }}
        run: |
          docker tag project:${{ github.sha }}-${{ matrix.environment }} \
            ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}-${{ matrix.environment }}
          docker push ghcr.io/${{ github.repository_owner }}/project:${{ github.sha }}-${{ matrix.environment }}
```

## Validation Checklist

Before committing a workflow file, verify:

- [ ] Tests run before Docker builds
- [ ] Docker builds only on main branch
- [ ] Images tagged with `${{ github.sha }}`
- [ ] Secrets referenced, not hardcoded
- [ ] Database cleanup uses `if: always()`
- [ ] Contract tests publish only on main
- [ ] Permissions follow least privilege
- [ ] Node.js version matches project
- [ ] Package manager matches project (npm/pnpm/yarn)
- [ ] All test layers included (unit, component, integration, contract)

## Benefits

1. **Fast Feedback**: Developers know within 10 minutes if code is production-ready
2. **Quality Gate**: No broken code reaches main branch
3. **Traceability**: SHA-tagged artifacts enable precise deployments
4. **Confidence**: Comprehensive test pyramid catches issues early
5. **Automation**: No manual steps required for code quality checks
6. **Cost Efficiency**: Skip expensive Docker builds on PRs

## See Also

- [/commit-stage](../commands/commit-stage.md) - Command to generate commit stage workflow
- [test-strategy-reference](../../reference/test-strategy-reference/) - Test pyramid implementation
- [cd-pipeline-reference](../../reference/cd-pipeline-reference/) - Complete CD pipeline architecture
- [contract-test-consumer.md](contract-test-consumer.md) - Consumer contract testing
- [contract-test-provider.md](contract-test-provider.md) - Provider contract verification
