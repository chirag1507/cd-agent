# /acceptance-stage - Set Up Acceptance Stage Workflow

> Set up automated acceptance testing pipeline that runs system-level tests against deployed environments.

## Purpose

Create a GitHub Actions workflow that automatically runs acceptance tests, smoke tests, and external system contract tests against a deployed acceptance environment (typically UAT). This workflow validates the entire system from a user's perspective and verifies integration with external system stubs.

## How It Works

This command will:

1. **Gather Configuration**
   - Environment to test (UAT is typical acceptance environment)
   - System test repository location
   - Test execution preferences
   - External system stub requirements
   - Schedule preferences

2. **Create Workflow File**
   - `.github/workflows/acceptance-stage-<environment>.yml`
   - Intelligent version checking (skip tests if versions unchanged)
   - Sequential test execution: Smoke → Acceptance → External System Contract
   - State file updates on success

3. **Generate Supporting Files**
   - State file templates
   - External system stub configuration (if needed)
   - Docker Compose files for local testing
   - Environment variable templates

4. **Provide Setup Instructions**
   - Required GitHub secrets
   - System test repository setup
   - External system stub deployment
   - Manual trigger instructions

## Interactive Configuration

The command will ask:

### 1. Environment Configuration
- **Target Environment**: Which environment to run acceptance tests against (typically UAT)
- **Environment URL**: Base URL of deployed system
- **API URL**: Backend API endpoint

### 2. System Test Repository
- **Repository Name**: Name of system test repository (e.g., `my-project-system-tests`)
- **Test Scripts Available**:
  - Smoke tests (`test:smoke`)
  - Acceptance tests (`test:acceptance`, `test:acceptance:signup`, etc.)
  - External system contract tests (`test:contract:external`)
  - E2E tests (`test:e2e`)

### 3. Trigger Configuration
- **Automatic Schedule**: Run tests periodically (recommended: every 15 minutes)
- **Manual Trigger**: Allow on-demand execution via workflow_dispatch
- **Custom Cron Schedule**: If automatic, specify schedule (default: `*/15 * * * *`)

### 4. External System Dependencies
- **Has External System Stubs**: Does your system depend on external services that need stubs?
- **External System Stub Types**:
  - OAuth providers (GitHub, Google, etc.)
  - Payment gateways (Stripe, PayPal, etc.)
  - Email services (SendGrid, Mailgun, etc.)
  - SMS services (Twilio, etc.)
  - Other third-party APIs
- **Stub Deployment**: Docker Compose, Kubernetes, or manual

### 5. Test Container Configuration
- **Use Custom Test Container**: Do you have a custom Playwright/test environment image?
- **Container Image**: If yes, specify image (e.g., `ghcr.io/owner/playwright-environment:latest`)
- **Default**: Uses Playwright base image with Node.js

### 6. Version Tracking
- **Enable Smart Testing**: Skip tests if deployed versions haven't changed (recommended: yes)
- **State File Location**: Where to track deployment versions (`state/` directory in main repo)

### 7. Notification Preferences
- **Notify on Failure**: Send notifications when tests fail
- **Notification Channel**: Slack, email, or GitHub issue

### 8. Backend Diagnostics
- **Run Backend Connectivity Checks**: Diagnostic tests before main tests (recommended: yes)
- **Diagnostic Test Script**: `test:smoke -- --grep "Backend Connectivity Diagnostics"`

### 9. Concurrency Control
- **Allow Parallel Runs**: Run multiple test executions concurrently (recommended: no)
- **Cancel In Progress**: Cancel previous runs when new one starts (recommended: no)

### 10. Additional Test Suites
- **External System Contract Tests on Stubs**: Verify stubs meet contracts
- **External System Contract Tests on Real Instances**: Verify real external systems (for non-prod)
- **E2E Tests**: Full end-to-end user journeys

## Generated Workflow Structure

```yaml
name: <Environment> Acceptance Stage

on:
  workflow_dispatch:
  schedule:
    - cron: "*/15 * * * *"  # Every 15 minutes

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

      - name: Install System Test Dependencies
        working-directory: ./system-tests-repo
        run: npm ci

      - name: Check Versions and Run Acceptance Tests
        env:
          BASE_URL: ${{ secrets.<ENV>_BASE_URL }}
          API_URL: ${{ secrets.<ENV>_API_URL }}
          NODE_ENV: <environment>
        run: |
          # Version checking logic
          DEPLOYED_VERSIONS_FILE="./main-repo/state/<env>-deployed-versions.json"
          LAST_TESTED_VERSIONS_FILE="./main-repo/state/<env>-last-successfully-tested-versions.json"

          # Skip if no deployment info
          if [ ! -f "$DEPLOYED_VERSIONS_FILE" ]; then
            echo "No deployment info found. Skipping tests."
            exit 0
          fi

          # Read deployed versions
          DEPLOYED_FRONTEND=$(jq -r '.frontend.version' "$DEPLOYED_VERSIONS_FILE")
          DEPLOYED_BACKEND=$(jq -r '.backend.version' "$DEPLOYED_VERSIONS_FILE")

          # Read last tested versions
          if [ -f "$LAST_TESTED_VERSIONS_FILE" ]; then
            LAST_TESTED_FRONTEND=$(jq -r '.frontend' "$LAST_TESTED_VERSIONS_FILE")
            LAST_TESTED_BACKEND=$(jq -r '.backend' "$LAST_TESTED_VERSIONS_FILE")

            # Skip if versions match
            if [ "$DEPLOYED_FRONTEND" == "$LAST_TESTED_FRONTEND" ] && \
               [ "$DEPLOYED_BACKEND" == "$LAST_TESTED_BACKEND" ]; then
              echo "Versions unchanged. Skipping tests."
              exit 0
            fi
          fi

          echo "New versions detected. Running tests."

          # 1. Backend Connectivity Diagnostics
          npm run test:smoke --prefix ./system-tests-repo -- --grep "Backend Connectivity Diagnostics" || true

          # 2. Smoke Tests (MUST PASS)
          npm run test:smoke --prefix ./system-tests-repo

          # 3. Acceptance Tests (MUST PASS)
          npm run test:acceptance --prefix ./system-tests-repo

          # 4. External System Contract Tests on Stubs (if configured)
          npm run test:contract:external-stubs --prefix ./system-tests-repo || true

          # 5. External System Contract Tests on Real Instances (if configured)
          npm run test:contract:external-instances --prefix ./system-tests-repo || true

          # Update last tested versions on success
          CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
          cat <<EOF > "$LAST_TESTED_VERSIONS_FILE"
          {
            "frontend": "$DEPLOYED_FRONTEND",
            "backend": "$DEPLOYED_BACKEND",
            "tested_at": "$CURRENT_TIME"
          }
          EOF

          # Commit and push state file
          cd ./main-repo
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add state/<env>-last-successfully-tested-versions.json
          if ! git diff --staged --quiet; then
            git commit -m "CI: Update <env> last successfully tested versions"
            git pull --rebase origin main
            git push origin main
          fi
```

## External System Stub Workflow

If external system stubs are required, an additional workflow is generated:

```yaml
name: Release External System Stubs for <Environment>

on:
  workflow_dispatch:
    inputs:
      stub_version:
        description: 'Stub service version (commit SHA or tag)'
        required: true

jobs:
  deploy_external_stubs:
    name: Deploy External System Stubs
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Stubs via Docker Compose
        run: |
          # Pull stub images
          docker pull ghcr.io/${{ github.repository_owner }}/github-oauth-stub:${{ github.event.inputs.stub_version }}
          docker pull ghcr.io/${{ github.repository_owner }}/stripe-stub:${{ github.event.inputs.stub_version }}

          # Deploy stubs
          docker compose -f docker-compose.stubs.yml up -d

          # Health checks
          for i in {1..12}; do
            if curl -f http://localhost:8081/health && curl -f http://localhost:8082/health; then
              echo "Stubs are healthy!"
              break
            fi
            echo "Waiting for stubs... ($i/12)"
            sleep 5
          done
```

## Docker Compose for Local Testing

Generates `docker-compose.acceptance-local.yml`:

```yaml
version: '3.8'

services:
  frontend:
    image: ghcr.io/${OWNER}/frontend:${FRONTEND_SHA:-latest-uat}
    ports:
      - "8080:80"
    environment:
      - NEXT_PUBLIC_APP_ENV=uat
      - NEXT_PUBLIC_API_URL=http://localhost:3002/api
    depends_on:
      - backend

  backend:
    image: ghcr.io/${OWNER}/backend:${BACKEND_SHA:-latest-uat}
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - database

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    volumes:
      - db_data:/var/lib/postgresql/data

  # External System Stubs
  github-stub:
    image: ghcr.io/${OWNER}/github-oauth-stub:latest
    ports:
      - "8081:8080"

  stripe-stub:
    image: ghcr.io/${OWNER}/stripe-stub:latest
    ports:
      - "8082:8080"

volumes:
  db_data:
```

## State File Templates

### Deployed Versions File

`state/<environment>-deployed-versions.json`:

```json
{
  "frontend": {
    "version": "<commit-sha>",
    "url": "http://example.com"
  },
  "backend": {
    "version": "<commit-sha>",
    "url": "http://api.example.com"
  },
  "deployed_at": "2024-01-15T10:30:00Z",
  "environment": "uat"
}
```

This file is created by the release stage workflow after successful deployment.

### Last Tested Versions File

`state/<environment>-last-successfully-tested-versions.json`:

```json
{
  "frontend": "<commit-sha>",
  "backend": "<commit-sha>",
  "tested_at": "2024-01-15T10:45:00Z"
}
```

This file is created by the acceptance stage workflow after tests pass.

## Required GitHub Secrets

The command will list required secrets:

```bash
# Environment URLs
<ENV>_BASE_URL         # Frontend URL (e.g., http://52.66.123.45:8080)
<ENV>_API_URL          # Backend API URL (e.g., http://52.66.123.45:3002/api)

# System Test Repository Access
PAT_FOR_SYSTEM_TESTS_REPO  # Personal Access Token with repo access

# External System Stub URLs (if applicable)
<ENV>_GITHUB_STUB_URL      # GitHub OAuth stub URL
<ENV>_STRIPE_STUB_URL      # Stripe payment stub URL
<ENV>_SENDGRID_STUB_URL    # Email service stub URL

# Optional: Notification Webhooks
SLACK_WEBHOOK_URL          # For test failure notifications
```

## Post-Generation Instructions

After creating the workflow, the command will provide:

1. **Set up GitHub secrets**:
   ```bash
   gh secret set UAT_BASE_URL --body "http://your-uat-server:8080"
   gh secret set UAT_API_URL --body "http://your-uat-server:3002/api"
   gh secret set PAT_FOR_SYSTEM_TESTS_REPO --body "ghp_your_token_here"
   ```

2. **Create state directory**:
   ```bash
   mkdir -p state
   git add state/.gitkeep
   git commit -m "chore: add state directory for deployment tracking"
   ```

3. **Set up system test repository** (if not exists):
   ```bash
   # Create system tests repository
   mkdir my-project-system-tests
   cd my-project-system-tests
   npm init -y

   # Install dependencies
   npm install --save-dev @playwright/test @cucumber/cucumber

   # Create test structure
   mkdir -p features step_definitions drivers
   ```

4. **Deploy external system stubs** (if required):
   ```bash
   # Option 1: Manual trigger of stub deployment workflow
   gh workflow run release-external-stubs-uat.yml -f stub_version=main

   # Option 2: Local deployment with Docker Compose
   docker compose -f docker-compose.stubs.yml up -d
   ```

5. **Manual trigger for first run**:
   ```bash
   gh workflow run acceptance-stage-uat.yml
   ```

6. **Monitor workflow**:
   ```bash
   gh run watch
   ```

## Local Testing Support

The command generates scripts for running acceptance tests locally:

**`scripts/run-acceptance-local.sh`**:

```bash
#!/bin/bash
set -e

echo "Starting local acceptance test environment..."

# 1. Start services with Docker Compose
export FRONTEND_SHA=${FRONTEND_SHA:-latest-uat}
export BACKEND_SHA=${BACKEND_SHA:-latest-uat}
export OWNER=$(git config user.name)

docker compose -f docker-compose.acceptance-local.yml up -d

# 2. Wait for services to be ready
echo "Waiting for services to be ready..."
for i in {1..30}; do
  if curl -f http://localhost:8080 > /dev/null 2>&1 && \
     curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "Services are ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# 3. Run acceptance tests
echo "Running acceptance tests..."
cd ../my-project-system-tests
export BASE_URL=http://localhost:8080
export API_URL=http://localhost:3002/api
export NODE_ENV=local

npm run test:smoke
npm run test:acceptance

# 4. Cleanup
echo "Cleaning up..."
cd ../my-project
docker compose -f docker-compose.acceptance-local.yml down

echo "Local acceptance tests complete!"
```

## Integration with Release Stage

The acceptance stage automatically coordinates with the release stage:

1. **Release stage** creates `state/<env>-deployed-versions.json` after successful deployment
2. **Acceptance stage** reads this file to determine what versions are deployed
3. **Acceptance stage** compares with `state/<env>-last-successfully-tested-versions.json`
4. **If versions match**, tests are skipped (already tested)
5. **If versions differ**, tests run against new deployment
6. **On success**, `state/<env>-last-successfully-tested-versions.json` is updated

This prevents redundant test runs and provides clear audit trail.

## Workflow Visualization

```
Release Stage                 Acceptance Stage
─────────────                 ────────────────

Deploy Frontend  ┐
Deploy Backend   ├──→ Update deployed-versions.json
Deploy Lambda    ┘                │
                                  │
                    ┌─────────────▼──────────────┐
                    │ Check deployed vs tested   │
                    │ versions                   │
                    └─────────────┬──────────────┘
                                  │
                         Versions different?
                                  │
                    ┌─────────────▼──────────────┐
                    │ Run Backend Diagnostics    │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Run Smoke Tests            │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Run Acceptance Tests       │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Run External System        │
                    │ Contract Tests (Stubs)     │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Run External System        │
                    │ Contract Tests (Instances) │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Update tested-versions.json│
                    └────────────────────────────┘
```

## Best Practices Applied

1. **Intelligent Test Execution**: Only run tests when versions change
2. **Sequential Test Layers**: Smoke → Acceptance → Contract → E2E
3. **Fail Fast**: Stop on first critical failure
4. **State Tracking**: Clear audit trail of what was tested when
5. **Health Checks First**: Diagnose connectivity before running tests
6. **Automatic Scheduling**: Run periodically to catch environment drift
7. **Manual Override**: Allow on-demand test execution
8. **Clean Separation**: External system stubs deployed independently
9. **Local Testing**: Docker Compose setup for developer machines
10. **Notifications**: Alert on failures for quick response

## External System Stub Types

The command recognizes these common stub types:

- **OAuth Providers**: GitHub, Google, Microsoft, Facebook
- **Payment Gateways**: Stripe, PayPal, Braintree
- **Email Services**: SendGrid, Mailgun, AWS SES
- **SMS Services**: Twilio, Nexmo
- **Cloud Storage**: AWS S3, Azure Blob, GCS
- **Analytics**: Google Analytics, Mixpanel
- **Search**: Elasticsearch, Algolia
- **Custom APIs**: Any third-party REST/GraphQL API

Each stub type gets appropriate Docker Compose configuration and health checks.

## Troubleshooting Guide

The command generates a troubleshooting guide:

**Common Issues**:

1. **Tests always skipped**:
   - Check `state/<env>-deployed-versions.json` exists
   - Verify versions are different from last tested
   - Run with `workflow_dispatch` to force execution

2. **Backend connectivity failures**:
   - Verify `<ENV>_API_URL` secret is correct
   - Check firewall rules allow GitHub Actions IPs
   - Review backend logs for errors

3. **External stub connection failures**:
   - Verify stub services are deployed and healthy
   - Check stub URLs in environment configuration
   - Review stub service logs

4. **State file conflicts**:
   - Multiple parallel runs can cause git conflicts
   - Use `cancel-in-progress: false` to prevent this
   - Manual resolution: `git fetch && git reset --hard origin/main`

5. **Container permission errors**:
   - Ensure test container has write permissions
   - Check volume mounts are configured correctly
   - Use `chmod -R 777 ./playwright-report` if needed

## See Also

- [.claude/rules/acceptance-stage-pipeline.md](../../.claude/rules/acceptance-stage-pipeline.md) - Pipeline rules
- [.claude/rules/acceptance-test.md](../../.claude/rules/acceptance-test.md) - Writing acceptance tests
- [.claude/rules/test-flakiness.md](../../.claude/rules/test-flakiness.md) - Preventing flaky tests
- `/release-stage` - Deploy to environments before acceptance tests
- `/commit-stage` - Build and test before deployment

---

**Next Steps**: After running this command, trigger the release stage to deploy to UAT, then run the acceptance stage to validate the deployment.
