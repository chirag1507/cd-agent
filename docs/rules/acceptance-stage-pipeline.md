# Acceptance Stage Pipeline Rules

> **Trigger**: Creating or modifying acceptance stage CI/CD workflows (`.github/workflows/acceptance-*.yml`)

## Purpose

Establish non-negotiable rules for acceptance stage pipelines that validate deployed systems through automated testing in production-like environments (typically UAT).

## Core Principle

**The acceptance stage is a quality gate.** Only systems that pass smoke tests, acceptance tests, and external system contract tests should be considered deployment-ready. Tests must be reliable, fast enough for frequent execution, and provide clear failure diagnostics.

## Non-Negotiable Rules

### 1. Intelligent Version-Based Test Execution

Acceptance tests MUST only run when deployed versions have changed.

```yaml
# ✅ GOOD: Version checking logic
- name: Check Versions and Run Tests
  run: |
    DEPLOYED_VERSIONS_FILE="./main-repo/state/uat-deployed-versions.json"
    LAST_TESTED_VERSIONS_FILE="./main-repo/state/uat-last-successfully-tested-versions.json"

    # Skip if no deployment info
    if [ ! -f "$DEPLOYED_VERSIONS_FILE" ]; then
      echo "No deployment info. Skipping tests."
      exit 0
    fi

    # Read versions
    DEPLOYED_FRONTEND=$(jq -r '.frontend.version' "$DEPLOYED_VERSIONS_FILE")
    DEPLOYED_BACKEND=$(jq -r '.backend.version' "$DEPLOYED_VERSIONS_FILE")

    # Compare with last tested
    if [ -f "$LAST_TESTED_VERSIONS_FILE" ]; then
      LAST_TESTED_FRONTEND=$(jq -r '.frontend' "$LAST_TESTED_VERSIONS_FILE")
      LAST_TESTED_BACKEND=$(jq -r '.backend' "$LAST_TESTED_VERSIONS_FILE")

      if [ "$DEPLOYED_FRONTEND" == "$LAST_TESTED_FRONTEND" ] && \
         [ "$DEPLOYED_BACKEND" == "$LAST_TESTED_BACKEND" ]; then
        echo "Versions unchanged. Skipping tests."
        exit 0
      fi
    fi

    echo "New versions detected. Running tests."
    # ... proceed with tests

# ❌ BAD: Always running tests regardless of versions
- name: Run Tests
  run: npm run test:acceptance  # Wastes resources on unchanged deployments
```

**Why:**
- Prevents redundant test execution on unchanged deployments
- Reduces CI minutes and cost
- Provides faster feedback by skipping unnecessary runs
- Clear audit trail of when versions were tested

### 2. Sequential Test Layer Execution

Tests MUST run in sequential layers with fail-fast behavior.

```yaml
# ✅ GOOD: Sequential layers with proper error handling
- name: Check Versions and Run Acceptance Tests
  run: |
    # ... version checking logic

    # Layer 1: Backend Diagnostics (informational)
    echo "Running backend connectivity diagnostics..."
    npm run test:smoke --prefix ./system-tests-repo -- --grep "Backend Connectivity Diagnostics" || true

    # Layer 2: Smoke Tests (MUST PASS)
    echo "Running smoke tests..."
    if ! npm run test:smoke --prefix ./system-tests-repo; then
      echo "Smoke tests FAILED"
      exit 1  # Stop here if smoke tests fail
    fi

    # Layer 3: Acceptance Tests (MUST PASS)
    echo "Running acceptance tests..."
    if ! npm run test:acceptance --prefix ./system-tests-repo; then
      echo "Acceptance tests FAILED"
      exit 1  # Stop here if acceptance tests fail
    fi

    # Layer 4: External System Contract Tests on Stubs (optional but logged)
    echo "Running external system contract tests on stubs..."
    npm run test:contract:external-stubs --prefix ./system-tests-repo || true

    # Layer 5: External System Contract Tests on Instances (optional but logged)
    echo "Running external system contract tests on real instances..."
    npm run test:contract:external-instances --prefix ./system-tests-repo || true

    # Only reached if all critical tests passed
    echo "All tests passed!"

# ❌ BAD: Running all tests in parallel without dependencies
- name: Run All Tests
  run: |
    npm run test:smoke & \
    npm run test:acceptance & \
    npm run test:e2e &
    wait  # No fail-fast, unclear which layer failed
```

**Test Layer Order:**
1. **Backend Diagnostics** (informational, don't fail on error)
2. **Smoke Tests** (MUST PASS, fail fast)
3. **Acceptance Tests** (MUST PASS, fail fast)
4. **External System Contract Tests - Stubs** (optional, logged)
5. **External System Contract Tests - Instances** (optional, logged)
6. **E2E Tests** (optional, if configured)

**Why:**
- Smoke tests catch environment issues before expensive acceptance tests run
- Fail fast saves time and resources
- Clear error messages show which layer failed
- Optional tests don't block deployment but provide valuable feedback

### 3. Automatic Scheduling with Concurrency Control

Acceptance tests MUST run on a schedule, not just manually.

```yaml
# ✅ GOOD: Scheduled + manual with concurrency control
on:
  workflow_dispatch:  # Allow manual triggers
  schedule:
    - cron: "*/15 * * * *"  # Every 15 minutes

concurrency:
  group: uat-acceptance-tests
  cancel-in-progress: false  # Don't cancel running tests

# ❌ BAD: Manual trigger only
on:
  workflow_dispatch:  # Only manual, no automatic validation

# ❌ BAD: Schedule without concurrency control
on:
  schedule:
    - cron: "*/15 * * * *"
# Missing concurrency group - parallel runs can conflict on state files
```

**Recommended Schedules:**
- **UAT/Acceptance Environment**: Every 15 minutes (`*/15 * * * *`)
- **Production Smoke Tests**: Every 5 minutes (`*/5 * * * *`)
- **Full E2E Suite**: Every hour (`0 * * * *`)

**Why:**
- Automatic scheduling catches environment drift
- Detects issues from external changes (infrastructure, third-party APIs)
- Provides continuous confidence in deployed system
- Concurrency control prevents git conflicts on state files

### 4. Dual Repository Checkout

Workflows MUST checkout both main repository (for state files) and system test repository.

```yaml
# ✅ GOOD: Both repositories checked out
steps:
  - name: Checkout Main Repository (for state files)
    uses: actions/checkout@v4
    with:
      path: main-repo  # State files location

  - name: Checkout System Tests Repository
    uses: actions/checkout@v4
    with:
      repository: ${{ github.repository_owner }}/my-project-system-tests
      path: system-tests-repo  # Test code location
      token: ${{ secrets.PAT_FOR_SYSTEM_TESTS_REPO }}

  - name: Install System Test Dependencies
    working-directory: ./system-tests-repo
    run: npm ci

  - name: Run Tests
    working-directory: ./system-tests-repo
    env:
      BASE_URL: ${{ secrets.UAT_BASE_URL }}
      API_URL: ${{ secrets.UAT_API_URL }}
    run: npm run test:acceptance

# ❌ BAD: Only checking out system tests
steps:
  - name: Checkout System Tests
    uses: actions/checkout@v4
    with:
      repository: my-org/system-tests
  # Missing main repo checkout - can't access state files!
```

**Why:**
- State files live in main repository (version tracking)
- Test code lives in separate system test repository (separation of concerns)
- Both are needed for intelligent test execution
- Main repo needs write access to update state files after success

### 5. State File Updates on Success Only

State files MUST be updated and committed ONLY after all tests pass.

```yaml
# ✅ GOOD: State file update after test success
- name: Run Tests and Update State
  run: |
    # ... version checking logic

    # Run all critical tests
    npm run test:smoke --prefix ./system-tests-repo
    npm run test:acceptance --prefix ./system-tests-repo

    # Only reached if tests passed - update state file
    CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    cat <<EOF > "./main-repo/state/uat-last-successfully-tested-versions.json"
    {
      "frontend": "$DEPLOYED_FRONTEND",
      "backend": "$DEPLOYED_BACKEND",
      "tested_at": "$CURRENT_TIME"
    }
    EOF

    # Commit and push
    cd ./main-repo
    git config --global user.name 'github-actions[bot]'
    git config --global user.email 'github-actions[bot]@users.noreply.github.com'
    git add state/uat-last-successfully-tested-versions.json

    if ! git diff --staged --quiet; then
      git commit -m "CI: Update UAT last successfully tested versions"
      git pull --rebase origin main
      git push origin main
    fi

# ❌ BAD: Updating state file before tests run
- name: Update State
  run: |
    # Update state file BEFORE tests
    echo '{"frontend":"abc123","backend":"def456"}' > state/tested.json
    git commit && git push

- name: Run Tests
  run: npm run test:acceptance  # Tests might fail but state already updated!
```

**Why:**
- State file represents "last **successfully** tested versions"
- Updating before tests creates false confidence
- Failed tests should not update state
- Git history provides audit trail of successful test runs

### 6. Test Container with Required Tools

Workflows MUST use a container with all test dependencies pre-installed.

```yaml
# ✅ GOOD: Custom container with tools pre-installed
jobs:
  run_acceptance_tests:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/${{ github.repository_owner }}/playwright-test-environment:latest
      # This image includes: Node.js, Playwright browsers, jq, git

# ✅ GOOD: Base image with dependencies installed in workflow
jobs:
  run_acceptance_tests:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-jammy
    steps:
      - name: Install jq and git
        run: |
          apt-get update
          apt-get install -y jq git

# ❌ BAD: No container, missing tools
jobs:
  run_acceptance_tests:
    runs-on: ubuntu-latest  # Missing Playwright browsers
    steps:
      - name: Run Tests
        run: npm run test:acceptance  # Will fail - no browsers installed
```

**Required Tools in Container:**
- **Node.js** (matching project version)
- **Playwright/Puppeteer** (with browsers)
- **jq** (for JSON parsing in version checks)
- **git** (for state file commits)
- **curl** (for health checks)

**Why:**
- Pre-installed tools make workflows faster
- Consistent environment across all test runs
- No dependency installation failures during test execution
- Browsers are large downloads - pre-installation saves time

### 7. Comprehensive Environment Configuration

Environment variables MUST be set for all test dependencies.

```yaml
# ✅ GOOD: Complete environment configuration
- name: Run Tests
  env:
    # System URLs
    BASE_URL: ${{ secrets.UAT_BASE_URL }}
    API_URL: ${{ secrets.UAT_API_URL }}

    # Environment identifier
    NODE_ENV: uat

    # Debug options
    SHOW_NETWORK_LOGS: true
    PLAYWRIGHT_SCREENSHOTS_ON_FAILURE: true

    # External system stub URLs (if applicable)
    GITHUB_STUB_URL: ${{ secrets.UAT_GITHUB_STUB_URL }}
    STRIPE_STUB_URL: ${{ secrets.UAT_STRIPE_STUB_URL }}

    # Test configuration
    HEADLESS: true
    TIMEOUT: 30000
  run: npm run test:acceptance --prefix ./system-tests-repo

# ❌ BAD: Missing critical environment variables
- name: Run Tests
  env:
    BASE_URL: http://localhost:8080  # Hardcoded, not using secrets
  run: npm run test:acceptance
  # Missing: API_URL, NODE_ENV, stub URLs
```

**Required Environment Variables:**
- `BASE_URL` - Frontend URL
- `API_URL` - Backend API URL
- `NODE_ENV` - Environment identifier (uat, staging, production)
- `SHOW_NETWORK_LOGS` - For debugging (optional but helpful)
- Stub URLs for external systems (if applicable)

**Why:**
- Tests need correct URLs to run against deployed system
- Environment-specific configuration (uat vs production)
- Debug options help troubleshoot failures
- Secrets protect sensitive URLs from logs

### 8. Fail-Safe Version File Validation

Version files MUST be validated before use.

```yaml
# ✅ GOOD: Robust version file validation
- name: Check Versions
  run: |
    DEPLOYED_VERSIONS_FILE="./main-repo/state/uat-deployed-versions.json"

    # Check file exists
    if [ ! -f "$DEPLOYED_VERSIONS_FILE" ]; then
      echo "Deployed versions file not found. Skipping tests."
      exit 0  # Exit gracefully, not an error
    fi

    # Validate JSON structure
    if ! jq empty "$DEPLOYED_VERSIONS_FILE" 2>/dev/null; then
      echo "Invalid JSON in deployed versions file."
      cat "$DEPLOYED_VERSIONS_FILE"
      exit 1  # This is an error
    fi

    # Read and validate versions
    DEPLOYED_FRONTEND=$(jq -r '.frontend.version' "$DEPLOYED_VERSIONS_FILE")
    DEPLOYED_BACKEND=$(jq -r '.backend.version' "$DEPLOYED_VERSIONS_FILE")

    # Check for null or empty values
    if [ "$DEPLOYED_FRONTEND" == "null" ] || [ -z "$DEPLOYED_FRONTEND" ] || \
       [ "$DEPLOYED_BACKEND" == "null" ] || [ -z "$DEPLOYED_BACKEND" ]; then
      echo "Invalid version information in file:"
      cat "$DEPLOYED_VERSIONS_FILE"
      exit 1
    fi

    echo "Valid versions found:"
    echo "Frontend: $DEPLOYED_FRONTEND"
    echo "Backend: $DEPLOYED_BACKEND"

# ❌ BAD: No validation
- name: Check Versions
  run: |
    DEPLOYED_FRONTEND=$(jq -r '.frontend.version' deployed.json)
    # No check if file exists, valid JSON, or values are valid
```

**Why:**
- Release stage might fail before creating state file
- JSON might be malformed due to deployment errors
- Missing validation causes confusing test failures
- Graceful handling of missing files prevents false failures

### 9. Backend Connectivity Diagnostics First

Health checks MUST run before main test suite.

```yaml
# ✅ GOOD: Diagnostics before tests
- name: Run Tests
  run: |
    # Run diagnostics first (don't fail on error)
    echo "Running backend connectivity diagnostics..."
    if ! npm run test:smoke --prefix ./system-tests-repo -- --grep "Backend Connectivity Diagnostics"; then
      echo "Backend diagnostics FAILED - this helps identify root cause"
      echo "Proceeding with tests to gather more information..."
    else
      echo "Backend diagnostics PASSED."
    fi

    # Now run actual tests
    npm run test:smoke --prefix ./system-tests-repo
    npm run test:acceptance --prefix ./system-tests-repo

# ❌ BAD: No diagnostics, jumping straight to tests
- name: Run Tests
  run: |
    npm run test:acceptance
    # When this fails, unclear if it's network, backend down, or test issue
```

**Diagnostic Test Example:**

```typescript
// features/backend-connectivity.feature
Feature: Backend Connectivity Diagnostics

  Scenario: Backend API is reachable
    When I check backend health endpoint
    Then I should receive a 200 OK response
    And response time should be under 1000ms

  Scenario: Backend can connect to database
    When I check backend database health
    Then database connection should be active

  Scenario: Backend authentication endpoint is accessible
    When I check backend auth endpoint
    Then endpoint should be reachable
```

**Why:**
- Separate network/environment issues from test failures
- Diagnostics provide actionable debugging information
- Continue with tests even if diagnostics fail (informational only)
- Helps identify root cause faster

### 10. Git Conflict Prevention

State file commits MUST use rebase and handle conflicts.

```yaml
# ✅ GOOD: Rebase before push to handle conflicts
- name: Commit State File
  run: |
    cd ./main-repo
    git config --global user.name 'github-actions[bot]'
    git config --global user.email 'github-actions[bot]@users.noreply.github.com'
    git add state/uat-last-successfully-tested-versions.json

    if ! git diff --staged --quiet; then
      git commit -m "CI: Update UAT last successfully tested versions"

      # Pull with rebase to avoid merge commits
      if ! git pull --rebase origin main; then
        echo "Rebase conflict detected. Resolving..."
        # In case of conflict, just use incoming changes
        git checkout --theirs state/uat-last-successfully-tested-versions.json
        git add state/uat-last-successfully-tested-versions.json
        git rebase --continue
      fi

      git push origin main
      echo "State file updated successfully."
    else
      echo "No changes to commit."
    fi

# ❌ BAD: No rebase, creates merge commits
- name: Commit State File
  run: |
    git commit -m "Update state"
    git push  # Might fail with conflicts if parallel run happened
```

**Why:**
- Scheduled runs can trigger simultaneously
- Parallel runs can try to push state file at same time
- Rebase prevents merge commits in history
- Automatic conflict resolution with `--theirs` works for state files

## State File Schema

### Deployed Versions File (Created by Release Stage)

`state/<environment>-deployed-versions.json`:

```json
{
  "frontend": {
    "version": "<commit-sha>",
    "url": "http://uat.example.com"
  },
  "backend": {
    "version": "<commit-sha>",
    "url": "http://uat.example.com/api"
  },
  "lambda": {
    "image-processor": {
      "version": "<commit-sha>",
      "functionName": "image-processor-uat"
    }
  },
  "deployed_at": "2024-01-15T10:30:00Z",
  "environment": "uat",
  "deployed_by": "github-actions[bot]"
}
```

### Last Tested Versions File (Created by Acceptance Stage)

`state/<environment>-last-successfully-tested-versions.json`:

```json
{
  "frontend": "<commit-sha>",
  "backend": "<commit-sha>",
  "lambda": {
    "image-processor": "<commit-sha>"
  },
  "tested_at": "2024-01-15T10:45:00Z",
  "test_run_url": "https://github.com/owner/repo/actions/runs/123456",
  "test_duration_seconds": 180
}
```

## Common Anti-Patterns

### ❌ Running Tests Without Version Check

```yaml
# BAD: Always running tests
on:
  schedule:
    - cron: "*/15 * * * *"

jobs:
  test:
    steps:
      - run: npm run test:acceptance  # Runs even if nothing changed
```

### ❌ Updating State Before Tests Pass

```yaml
# BAD: State update before tests
steps:
  - name: Update State
    run: echo '{"frontend":"abc"}' > state/tested.json
  - name: Run Tests
    run: npm run test:acceptance  # Might fail but state already updated
```

### ❌ Parallel Test Layers

```yaml
# BAD: All tests in parallel
steps:
  - run: npm run test:smoke &
  - run: npm run test:acceptance &
  - run: npm run test:e2e &
  - run: wait  # No fail-fast, unclear which failed
```

### ❌ Missing Concurrency Control

```yaml
# BAD: No concurrency group
on:
  schedule:
    - cron: "*/15 * * * *"
# Parallel runs can conflict on state file commits
```

### ❌ Hardcoded Environment URLs

```yaml
# BAD: Hardcoded values
env:
  BASE_URL: "http://52.66.123.45:8080"  # Should be secret
  API_URL: "http://52.66.123.45:3002/api"  # Should be secret
```

## External System Stub Integration

When acceptance tests depend on external systems:

### Option 1: Stub Services in Same Environment

```yaml
# Deploy stubs before running tests
jobs:
  deploy_stubs:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy GitHub OAuth Stub
        run: |
          docker pull ghcr.io/owner/github-stub:latest
          docker run -d -p 8081:8080 ghcr.io/owner/github-stub:latest

      - name: Health Check Stubs
        run: |
          for i in {1..12}; do
            if curl -f http://stub-server:8081/health; then
              echo "Stubs ready!"
              break
            fi
            sleep 5
          done

  run_acceptance_tests:
    needs: [deploy_stubs]
    env:
      GITHUB_STUB_URL: http://stub-server:8081
    steps:
      - run: npm run test:acceptance
```

### Option 2: Pre-Deployed Stub Services

```yaml
# Use existing stub services
jobs:
  run_acceptance_tests:
    env:
      GITHUB_STUB_URL: ${{ secrets.UAT_GITHUB_STUB_URL }}
      STRIPE_STUB_URL: ${{ secrets.UAT_STRIPE_STUB_URL }}
    steps:
      - run: npm run test:acceptance
```

### External System Contract Tests

```yaml
# Verify stubs meet provider contracts
- name: Run External System Contract Tests on Stubs
  run: |
    npm run test:contract:external-stubs --prefix ./system-tests-repo
  # Verifies: Does our GitHub stub behave like real GitHub OAuth?

# Verify real external systems (optional, for dev/staging only)
- name: Run External System Contract Tests on Real Instances
  if: env.NODE_ENV != 'production'
  run: |
    npm run test:contract:external-instances --prefix ./system-tests-repo
  # Verifies: Is real GitHub OAuth still compatible with our code?
```

## Pipeline Structure Template

```yaml
name: <Environment> Acceptance Stage

on:
  workflow_dispatch:
  schedule:
    - cron: "*/15 * * * *"

permissions:
  contents: write
  actions: read
  packages: read

concurrency:
  group: <environment>-acceptance-tests
  cancel-in-progress: false

jobs:
  run_acceptance_tests:
    name: Run Acceptance Tests on <Environment>
    runs-on: ubuntu-latest

    container:
      image: ghcr.io/${{ github.repository_owner }}/playwright-test-environment:latest

    steps:
      # Step 1: Checkout repositories
      - name: Checkout Main Repository (for state files)
        uses: actions/checkout@v4
        with:
          path: main-repo

      - name: Checkout System Tests Repository
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository_owner }}/<system-tests-repo>
          path: system-tests-repo
          token: ${{ secrets.PAT_FOR_SYSTEM_TESTS_REPO }}

      # Step 2: Install dependencies
      - name: Install System Test Dependencies
        working-directory: ./system-tests-repo
        run: npm ci

      # Step 3: Run tests with version checking
      - name: Check Versions and Run Acceptance Tests
        env:
          BASE_URL: ${{ secrets.<ENV>_BASE_URL }}
          API_URL: ${{ secrets.<ENV>_API_URL }}
          NODE_ENV: <environment>
          SHOW_NETWORK_LOGS: true
        run: |
          set -e

          DEPLOYED_VERSIONS_FILE="./main-repo/state/<env>-deployed-versions.json"
          LAST_TESTED_VERSIONS_FILE="./main-repo/state/<env>-last-successfully-tested-versions.json"

          # Version checking logic (see Rule 1)
          # ...

          # Backend diagnostics (see Rule 9)
          npm run test:smoke --prefix ./system-tests-repo -- --grep "Backend Connectivity Diagnostics" || true

          # Sequential test execution (see Rule 2)
          npm run test:smoke --prefix ./system-tests-repo
          npm run test:acceptance --prefix ./system-tests-repo

          # Optional: External system contract tests
          npm run test:contract:external-stubs --prefix ./system-tests-repo || true

          # State file update (see Rule 5)
          CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
          cat <<EOF > "$LAST_TESTED_VERSIONS_FILE"
          {
            "frontend": "$DEPLOYED_FRONTEND",
            "backend": "$DEPLOYED_BACKEND",
            "tested_at": "$CURRENT_TIME"
          }
          EOF

          # Git commit with rebase (see Rule 10)
          cd ./main-repo
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add state/<env>-last-successfully-tested-versions.json
          if ! git diff --staged --quiet; then
            git commit -m "CI: Update <env> last successfully tested versions"
            git pull --rebase origin main || (git checkout --theirs state/<env>-last-successfully-tested-versions.json && git rebase --continue)
            git push origin main
          fi
```

## Validation Checklist

Before committing an acceptance stage workflow, verify:

- [ ] Automatic schedule configured (recommended: every 15 minutes)
- [ ] Manual trigger available (workflow_dispatch)
- [ ] Version checking logic present (skip if unchanged)
- [ ] Dual repository checkout (main + system tests)
- [ ] Sequential test layers (smoke → acceptance → contract)
- [ ] Backend diagnostics run first (non-blocking)
- [ ] State file updated ONLY on success
- [ ] Git rebase used before push
- [ ] Concurrency control configured (cancel-in-progress: false)
- [ ] Test container includes required tools (Playwright, jq, git)
- [ ] Environment variables set from secrets
- [ ] Version file validation (JSON structure, null checks)
- [ ] Fail-fast on critical test failures

## Benefits

1. **Efficient Resource Usage**: Skip tests when versions unchanged
2. **Fast Feedback**: Sequential layers with fail-fast
3. **Continuous Validation**: Scheduled runs catch environment drift
4. **Clear Audit Trail**: State files track what was tested when
5. **Actionable Diagnostics**: Health checks before tests help debug failures
6. **Conflict Prevention**: Rebase strategy handles parallel runs
7. **Separation of Concerns**: System tests in separate repository
8. **Reliability**: Intelligent execution prevents flaky failures from unchanged code

## See Also

- [/acceptance-stage](../commands/acceptance-stage.md) - Command to generate acceptance stage workflow
- [acceptance-test.md](acceptance-test.md) - Writing acceptance tests with Four-Layer Model
- [test-flakiness.md](test-flakiness.md) - Preventing flaky tests
- [release-stage-pipeline.md](release-stage-pipeline.md) - Release stage creates deployment state files
- [commit-stage-pipeline.md](commit-stage-pipeline.md) - Commit stage builds artifacts for deployment
