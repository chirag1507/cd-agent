# Release Stage Pipeline Rules

> **Trigger**: Creating or modifying release stage CI/CD workflows (`.github/workflows/release-*.yml`)

## Purpose

Establish non-negotiable rules for release stage pipelines that safely deploy verified artifacts to environments (QA, UAT, Production) with contract verification, smoke tests, and deployment tracking.

## Core Principle

**The release stage is a deployment gate.** Only artifacts that pass contract verification (`can-i-deploy`) and smoke tests should reach target environments. Deployments must be traceable, reversible, and validated.

## Non-Negotiable Rules

### 1. Manual Trigger Only

Release workflows MUST be triggered manually, not automatically.

```yaml
# ✅ GOOD: Manual workflow_dispatch trigger
on:
  workflow_dispatch:
    inputs:
      deploy_to_qa:
        description: "Deploy to QA environment"
        required: false
        default: true
        type: boolean
      frontend_commit_sha:
        description: "Frontend commit SHA"
        required: true
      backend_commit_sha:
        description: "Backend commit SHA"
        required: true

# ❌ BAD: Automatic trigger on push
on:
  push:
    branches: [main]  # NO! Deployments should be deliberate
```

**Why:**
- Deployments should be deliberate, not automatic
- Allows manual review and coordination
- Enables deployment windows (e.g., during business hours)
- QA/UAT may require manual testing before promotion

### 2. Contract Verification Before Deployment (can-i-deploy)

MUST check contract compatibility before deploying any service.

```yaml
check_can_deploy:
  name: Check if services can be deployed to ${{ matrix.environment }}
  runs-on: ubuntu-latest
  container:
    image: ghcr.io/${{ github.repository_owner }}/pact-cli-environment:latest
  strategy:
    matrix:
      environment: [qa, uat]
  steps:
    - name: Can I deploy frontend?
      env:
        PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
        PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      run: |
        pact-broker can-i-deploy \
          --pacticipant project-frontend \
          --version ${{ github.event.inputs.frontend_commit_sha }} \
          --to-environment ${{ matrix.environment }} \
          --retry-while-unknown 0 \
          --retry-interval 10

    - name: Can I deploy backend?
      env:
        PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
        PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      run: |
        pact-broker can-i-deploy \
          --pacticipant project-backend \
          --version ${{ github.event.inputs.backend_commit_sha }} \
          --to-environment ${{ matrix.environment }} \
          --retry-while-unknown 0 \
          --retry-interval 10

# Deployment job MUST depend on this
deploy_to_environment:
  needs: [check_can_deploy]  # ← Critical dependency
  runs-on: ubuntu-latest
  steps:
    # ... deployment steps
```

**Why:**
- Prevents breaking consumer contracts
- Ensures provider changes are backward-compatible
- Safe to deploy when both consumer and provider verified

### 3. Record Deployment in Pact Broker

After successful deployment, MUST record the deployment.

```yaml
record_deployment_and_state:
  name: Record Deployment and State
  runs-on: ubuntu-latest
  needs: [deploy_to_environment]  # After deployment succeeds
  steps:
    - name: Record deployment to Pact Broker
      env:
        PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
        PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
      run: |
        pact-broker record-deployment \
          --pacticipant project-frontend \
          --version ${{ github.event.inputs.frontend_commit_sha }} \
          --environment ${{ matrix.environment }}

        pact-broker record-deployment \
          --pacticipant project-backend \
          --version ${{ github.event.inputs.backend_commit_sha }} \
          --environment ${{ matrix.environment }}
```

**Why:**
- Tracks what versions are in each environment
- Enables `can-i-deploy` checks for subsequent deployments
- Provides deployment history

### 4. Track Deployed Versions in State Files

MUST create/update state files for acceptance test coordination.

```yaml
- name: Record Deployed Versions for Acceptance Tests
  run: |
    mkdir -p state
    DEPLOY_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    ENVIRONMENT="${{ matrix.environment }}"

    cat <<EOF > state/${ENVIRONMENT}-deployed-versions.json
    {
      "frontend": {
        "version": "${{ github.event.inputs.frontend_commit_sha }}",
        "url": "$FRONTEND_URL"
      },
      "backend": {
        "version": "${{ github.event.inputs.backend_commit_sha }}",
        "url": "$BACKEND_URL"
      },
      "deployed_at": "$DEPLOY_TIMESTAMP",
      "environment": "$ENVIRONMENT"
    }
    EOF

    git add state/${ENVIRONMENT}-deployed-versions.json
    git commit -m "CI: Record $ENVIRONMENT deployment"
    git push origin main
```

**Why:**
- Acceptance tests read this to know what's deployed
- Avoids running tests on unchanged versions
- Provides audit trail of deployments

### 5. Run Smoke Tests After Deployment

MUST verify basic functionality immediately after deployment.

```yaml
run_smoke_tests:
  name: Run Smoke Tests on ${{ matrix.environment }}
  runs-on: ubuntu-latest
  needs: [deploy_to_environment]
  if: success()  # Only if deployment succeeded
  steps:
    - name: Checkout System Tests Repository
      uses: actions/checkout@v4
      with:
        repository: ${{ github.repository_owner }}/project-system-test
        token: ${{ secrets.PAT_FOR_SYSTEM_TESTS_REPO }}

    - name: Run Smoke Tests
      env:
        NODE_ENV: ${{ matrix.environment }}
        BASE_URL: ${{ matrix.frontend_url }}
        API_URL: ${{ matrix.backend_url }}
      run: npm run test:smoke
```

**Smoke Tests Must Verify:**
- Health endpoints return 200 OK
- Database connectivity
- Basic CRUD operations
- Authentication flow (if applicable)
- Critical dependencies available

**Why:**
- Immediate feedback on deployment success
- Catches configuration errors early
- Validates environment-specific settings

### 6. Health Checks and Rollback Strategy

Deployment scripts MUST verify health before completing.

```yaml
# For Docker Compose deployments
script: |
  docker compose up -d

  # Wait for services to be healthy
  for i in {1..12}; do
    if docker compose ps --format json | grep -q '"State":"running (healthy)"'; then
      echo "✅ Services are healthy!"
      break
    fi
    echo "Waiting for services... ($i/12)"
    sleep 5
  done

  # Verify health endpoints
  curl -f http://localhost:${BACKEND_PORT}/api/health || {
    echo "❌ Backend health check failed"
    docker compose logs backend
    docker compose down
    exit 1
  }
```

**Why:**
- Ensures services are actually running
- Prevents successful deployment of broken services
- Provides diagnostic information on failure

### 7. Environment-Specific Configuration

Different environments MUST have isolated configurations.

```yaml
strategy:
  matrix:
    environment: [qa, uat]
    include:
      - environment: qa
        frontend_port: 80
        backend_port: 3001
        database_url_secret: QA_DATABASE_URL
      - environment: uat
        frontend_port: 8080
        backend_port: 3002
        database_url_secret: UAT_DATABASE_URL
```

**Required Environment Isolation:**
- Separate databases
- Separate ports (for shared hosts)
- Separate OAuth credentials
- Separate API keys
- Separate secrets

**Why:**
- QA testing doesn't affect UAT
- Prevents accidental production data access
- Enables parallel testing

### 8. Idempotent Deployments

Deployments MUST be idempotent (safe to re-run).

```yaml
# ✅ GOOD: Idempotent Docker Compose deployment
docker compose up -d  # Updates existing containers

# ✅ GOOD: Idempotent ECS deployment
aws ecs update-service --force-new-deployment

# ❌ BAD: Non-idempotent operations
docker run -d ...  # Creates duplicate containers
```

**Why:**
- Safe to retry on transient failures
- Simplifies rollback (re-deploy previous version)
- Reduces deployment complexity

### 9. Permissions and Security

```yaml
permissions:
  contents: write    # For updating state files
  actions: read      # For workflow triggers
  packages: read     # For pulling Docker images
```

**Secrets Management:**
- NEVER commit secrets to repository
- Use GitHub Secrets for all sensitive data
- Use environment-specific secrets (`QA_*`, `UAT_*`, `PROD_*`)
- Rotate secrets regularly

### 10. Deployment Order (if multiple services)

When deploying multiple services, order matters:

```yaml
# ✅ GOOD: Deploy in dependency order
jobs:
  deploy_backend:
    # ... deploy backend first

  deploy_frontend:
    needs: [deploy_backend]  # Frontend depends on backend
    # ... deploy frontend after backend is healthy
```

**Deployment Order Rules:**
- Backend/API before frontend
- Database migrations before application
- Infrastructure before application
- Backwards-compatible changes before breaking changes

## Common Anti-Patterns

### ❌ Deploying Without Contract Verification

```yaml
# BAD: Skipping can-i-deploy check
deploy_to_environment:
  runs-on: ubuntu-latest
  steps:
    - run: docker compose up -d  # No contract check!
```

### ❌ Not Recording Deployment

```yaml
# BAD: Deployment succeeds but not recorded
deploy_to_environment:
  steps:
    - run: deploy.sh
  # Missing: pact-broker record-deployment
```

### ❌ No Smoke Tests

```yaml
# BAD: Deploying without verification
deploy_to_environment:
  steps:
    - run: docker compose up -d
  # Missing: smoke tests to verify deployment
```

### ❌ Hardcoded Environment Values

```yaml
# BAD: Hardcoded URLs and ports
env:
  DATABASE_URL: "postgresql://localhost:5432/mydb"  # NO!
  FRONTEND_URL: "http://52.66.123.45"  # NO!

# GOOD: Use secrets and matrix variables
env:
  DATABASE_URL: ${{ secrets[matrix.database_url_secret] }}
  FRONTEND_URL: ${{ matrix.frontend_url }}
```

### ❌ Automatic Deployment to Production

```yaml
# BAD: Auto-deploy to production
on:
  push:
    branches: [main]  # NO! Production should be manual
```

## Deployment Strategies

### Blue-Green Deployment

```yaml
steps:
  - name: Deploy to green environment
    run: |
      docker compose -p green up -d

  - name: Run smoke tests on green
    run: npm run test:smoke -- --url=http://green.example.com

  - name: Switch traffic to green
    run: |
      # Update load balancer to point to green
      # OR update DNS

  - name: Keep blue for rollback
    run: echo "Blue environment kept for 24h rollback window"
```

### Rolling Deployment (Kubernetes)

```yaml
steps:
  - name: Rolling update
    run: |
      kubectl set image deployment/backend \
        backend=ghcr.io/owner/backend:${{ github.sha }} \
        -n ${{ matrix.environment }}

      kubectl rollout status deployment/backend \
        -n ${{ matrix.environment }}
```

### Canary Deployment

```yaml
steps:
  - name: Deploy canary (10% traffic)
    run: |
      kubectl apply -f canary-deployment.yaml

  - name: Monitor canary metrics
    run: |
      # Check error rates, latency
      # If good, promote to 50%, then 100%
```

## Rollback Pattern

```yaml
on:
  workflow_dispatch:
    inputs:
      rollback_to_sha:
        description: "Commit SHA to roll back to"
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy previous version
        run: |
          # Re-deploy using previous commit SHA
          docker compose pull
          docker compose up -d

      - name: Verify rollback
        run: npm run test:smoke
```

## Pipeline Structure Template

```yaml
name: Release to Environment

on:
  workflow_dispatch:
    inputs:
      deploy_to_qa:
        type: boolean
        default: true
      deploy_to_uat:
        type: boolean
        default: false
      frontend_commit_sha:
        required: true
      backend_commit_sha:
        required: true

permissions:
  contents: write
  actions: read
  packages: read

jobs:
  # Job 1: Parse environment selection
  parse_environments:
    runs-on: ubuntu-latest
    outputs:
      environments: ${{ steps.parse.outputs.environments }}
    steps:
      - name: Parse selected environments
        id: parse
        run: |
          # Convert boolean inputs to JSON array

  # Job 2: Contract verification (GATE)
  check_can_deploy:
    runs-on: ubuntu-latest
    needs: [parse_environments]
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    steps:
      - name: Can I deploy to ${{ matrix.environment }}?
        run: pact-broker can-i-deploy ...

  # Job 3: Deploy to environment
  deploy_to_environment:
    runs-on: ubuntu-latest
    needs: [parse_environments, check_can_deploy]
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    steps:
      - name: Deploy via SSH / ECS / K8s
        run: |
          # Platform-specific deployment

  # Job 4: Record deployment
  record_deployment_and_state:
    runs-on: ubuntu-latest
    needs: [parse_environments, deploy_to_environment]
    steps:
      - name: Record to Pact Broker
        run: pact-broker record-deployment ...

      - name: Update state files
        run: |
          # Create state/<env>-deployed-versions.json

  # Job 5: Smoke tests
  run_smoke_tests:
    runs-on: ubuntu-latest
    needs: [parse_environments, deploy_to_environment]
    steps:
      - name: Run smoke tests
        run: npm run test:smoke
```

## Validation Checklist

Before committing a release workflow file, verify:

- [ ] Manual trigger only (workflow_dispatch)
- [ ] `can-i-deploy` runs before deployment
- [ ] Deployment recorded in Pact Broker
- [ ] State files updated after deployment
- [ ] Smoke tests run after deployment
- [ ] Health checks verify service readiness
- [ ] Secrets referenced, not hardcoded
- [ ] Environment-specific configurations isolated
- [ ] Rollback strategy documented
- [ ] Deployment is idempotent

## Benefits

1. **Safe Deployments**: Contract verification prevents breaking changes
2. **Traceability**: State files and Pact Broker track what's where
3. **Fast Feedback**: Smoke tests catch deployment issues immediately
4. **Confidence**: Health checks ensure services are actually working
5. **Reversibility**: Idempotent deployments enable easy rollback
6. **Isolation**: Environment-specific configs prevent cross-contamination

## See Also

- [/release-stage](../commands/release-stage.md) - Command to generate release stage workflow
- [commit-stage-pipeline.md](commit-stage-pipeline.md) - Commit stage rules
- [acceptance-stage-pipeline.md](acceptance-stage-pipeline.md) - Acceptance stage rules (coming next)
- [cd-pipeline-reference](../../reference/cd-pipeline-reference/) - Complete CD pipeline architecture
- [contract-test-provider.md](contract-test-provider.md) - Provider contract verification
