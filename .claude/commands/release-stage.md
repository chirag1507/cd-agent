# /release-stage - Set Up Release Stage CI/CD Pipeline

> **Trigger**: User runs `/release-stage` to initialize the release stage workflow for deploying to environments

## Purpose

Automate the setup of a production-ready release stage pipeline that handles deployment to QA/UAT/Production environments with contract verification, smoke tests, and deployment tracking. This command creates a GitHub Actions workflow for manual release triggers with environment-specific configurations.

## What This Command Does

1. **Gathers deployment configuration** through interactive prompts
2. **Creates `.github/workflows/release-<env>.yml`** for each environment
3. **Sets up deployment state tracking** in `state/` directory
4. **Configures environment-specific settings** (ports, URLs, secrets)
5. **Generates deployment scripts** for SSH, Docker Compose, or cloud platforms
6. **Provides setup instructions** for secrets and manual trigger process

## Prerequisites Check

```bash
# 1. Check if commit stage exists
[ -f ".github/workflows/commit-stage.yml" ] || echo "⚠️  Run /commit-stage first"

# 2. Check git repository
git rev-parse --git-dir > /dev/null 2>&1 || echo "❌ Not a git repository"

# 3. Check for Docker images
[ -f "Dockerfile" ] || echo "⚠️  No Dockerfile found"

# 4. Check for state directory
mkdir -p state
```

## Interactive Configuration

### 1. Deployment Target

```
What deployment platform will you use?
1. EC2/VPS with Docker Compose (Recommended)
2. AWS ECS/Fargate
3. Kubernetes (EKS/GKE)
4. Cloud Run / App Engine
5. Azure Container Apps

[User selects option]
```

### 2. Environments to Configure

```
Which environments do you want to set up?
☐ QA (Quality Assurance testing)
☐ UAT (User Acceptance Testing)
☐ Production

Select environments (space to toggle, enter to confirm):
```

### 3. Component Selection

```
Which components need to be deployed?
☐ Frontend
☐ Backend
☐ Additional microservices/Lambda functions

[User selects components]
```

### 4. Frontend Configuration (if selected)

```
Frontend Configuration:
─────────────────────────────────────
Framework detected: Next.js

Environment-specific builds required? [Y/n]
If yes, environments will have separate Docker images tagged with:
  - frontend:${SHA}-qa
  - frontend:${SHA}-uat
  - frontend:${SHA}-prod

Port configuration:
  QA:  [default: 80]
  UAT: [default: 8080]
  Prod: [default: 443]
```

### 5. Backend Configuration (if selected)

```
Backend Configuration:
─────────────────────────────────────
Port configuration:
  QA:  [default: 3001]
  UAT: [default: 3002]
  Prod: [default: 3000]

Does backend require database migrations? [Y/n]
Migration command: [default: npx prisma migrate deploy]

Health check endpoint: [default: /api/health]
```

### 6. Additional Services (if selected)

```
Additional Services:
─────────────────────────────────────
How many additional services/Lambda functions?
[Enter number]

For each service, provide:
Service 1:
  - Name: [e.g., lambda-process-repo]
  - Dockerfile: [e.g., Dockerfile.process-repo.lambda]
  - Deployment type: [Lambda / Container / Cloud Function]
  - Target environment: [QA / UAT / Production]
```

### 7. Contract Testing Integration

```
Do you use Pact for contract testing? [Y/n]

If yes:
- Consumer applications: [comma-separated, e.g., frontend]
- Provider applications: [comma-separated, e.g., backend]

Pact Broker URL: [will be added to secrets]
```

### 8. Deployment Method Configuration

#### For EC2/VPS with Docker Compose:

```
EC2/VPS Deployment Configuration:
─────────────────────────────────────
SSH Host: [e.g., 52.66.123.45]
SSH User: [default: ubuntu]
SSH Port: [default: 22]

Deployment directory: [default: /opt/<project-name>]

Docker registry for pulling images:
  ☑ GitHub Container Registry (ghcr.io)
  ☐ AWS ECR
  ☐ Docker Hub
```

#### For AWS ECS/Fargate:

```
AWS ECS Configuration:
─────────────────────────────────────
AWS Region: [e.g., us-east-1]
ECS Cluster name: [e.g., my-app-cluster]
Task Definition prefix: [e.g., my-app]

Service names:
  Frontend: [e.g., my-app-frontend-service]
  Backend: [e.g., my-app-backend-service]
```

#### For Kubernetes:

```
Kubernetes Configuration:
─────────────────────────────────────
Cluster provider:
  1. AWS EKS
  2. Google GKE
  3. Azure AKS
  4. Self-hosted

Namespace per environment? [Y/n]
Namespaces:
  QA: [default: qa]
  UAT: [default: uat]
  Prod: [default: production]

Helm charts or raw manifests? [Helm/Manifests]
```

### 9. Environment Variables

```
Environment Variables Configuration:
─────────────────────────────────────
Common across all environments:
  - NODE_ENV (auto-configured per environment)
  - DATABASE_URL (different per environment)
  - JWT_SECRET (same for all)

Environment-specific secrets:
  For each environment (QA/UAT/Prod):
    - DATABASE_URL
    - FRONTEND_URL
    - BACKEND_URL
    - API keys (GitHub OAuth, SendGrid, etc.)

Do you want to generate a secrets template? [Y/n]
```

### 10. Smoke Tests

```
Smoke Tests Configuration:
─────────────────────────────────────
Do you have a separate system tests repository? [Y/n]

If yes:
  Repository: [e.g., my-app-system-tests]
  Smoke test command: [default: npm run test:smoke]

If no:
  Create basic smoke tests? [Y/n]
  - Health endpoint check
  - Basic connectivity test
```

### 11. Deployment State Tracking

```
Deployment State Tracking:
─────────────────────────────────────
Enable deployment version tracking for acceptance tests? [Y/n]

If yes:
  - Creates state/<env>-deployed-versions.json
  - Tracks frontend/backend commit SHAs
  - Records deployment timestamp
  - Used by acceptance stage to avoid redundant tests
```

## Workflow Generation

Based on user input, generate the appropriate workflow file(s). See [release-stage-pipeline.md](../rules/release-stage-pipeline.md) for pipeline rules and best practices.

### Template Structure

```yaml
name: Release to <ENVIRONMENT>

on:
  workflow_dispatch:
    inputs:
      deploy_to_qa:
        description: "Deploy to QA environment"
        required: false
        default: true
        type: boolean
      deploy_to_uat:
        description: "Deploy to UAT environment"
        required: false
        default: true
        type: boolean
      frontend_commit_sha:
        description: "Frontend commit SHA"
        required: true
        default: "latest"
      backend_commit_sha:
        description: "Backend commit SHA"
        required: true
        default: "latest"

permissions:
  contents: write
  actions: read
  packages: read

jobs:
  parse_environments:
    name: Parse Environment Selection
    runs-on: ubuntu-latest
    outputs:
      environments: ${{ steps.parse.outputs.environments }}
    steps:
      - name: Parse Environment Selection
        id: parse
        run: |
          # Parse selected environments into JSON array
          ENVS=""
          if [ "${{ github.event.inputs.deploy_to_qa }}" = "true" ]; then
            ENVS="qa"
          fi
          if [ "${{ github.event.inputs.deploy_to_uat }}" = "true" ]; then
            if [ -n "$ENVS" ]; then ENVS="$ENVS,uat"; else ENVS="uat"; fi
          fi
          JSON_ARRAY=$(echo "\"$ENVS\"" | sed 's/,/","/g' | sed 's/^/[/' | sed 's/$/]/')
          echo "environments=$JSON_ARRAY" >> $GITHUB_OUTPUT

  check_can_deploy:
    name: Check if services can be deployed to ${{ matrix.environment }}
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/${{ github.repository_owner }}/pact-cli-environment:latest
    needs: parse_environments
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    environment:
      name: ${{ matrix.environment }}
    steps:
      - name: Can I deploy frontend?
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          if [ -z "$PACT_BROKER_BASE_URL" ]; then
            echo "⚠️  No Pact Broker configured, skipping contract check"
            exit 0
          fi
          pact-broker can-i-deploy \
            --pacticipant <PROJECT_NAME>-frontend \
            --version ${{ github.event.inputs.frontend_commit_sha }} \
            --to-environment ${{ matrix.environment }} \
            --retry-while-unknown 0 \
            --retry-interval 10

      - name: Can I deploy backend?
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          if [ -z "$PACT_BROKER_BASE_URL" ]; then
            echo "⚠️  No Pact Broker configured, skipping contract check"
            exit 0
          fi
          pact-broker can-i-deploy \
            --pacticipant <PROJECT_NAME>-backend \
            --version ${{ github.event.inputs.backend_commit_sha }} \
            --to-environment ${{ matrix.environment }} \
            --retry-while-unknown 0 \
            --retry-interval 10

  deploy_to_environment:
    name: Deploy to ${{ matrix.environment }} Environment
    runs-on: ubuntu-latest
    needs: [parse_environments, check_can_deploy]
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    environment:
      name: ${{ matrix.environment }}
    steps:
      # [DEPLOYMENT STEPS BASED ON PLATFORM]
      # See platform-specific templates below

  record_deployment_and_state:
    name: Record Deployment and State for ${{ matrix.environment }}
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/${{ github.repository_owner }}/pact-cli-environment:latest
    needs: [parse_environments, deploy_to_environment]
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    environment:
      name: ${{ matrix.environment }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Record deployment to Pact Broker
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          if [ -z "$PACT_BROKER_BASE_URL" ]; then
            echo "⚠️  No Pact Broker configured"
            exit 0
          fi
          pact-broker record-deployment \
            --pacticipant <PROJECT_NAME>-frontend \
            --version ${{ github.event.inputs.frontend_commit_sha }} \
            --environment ${{ matrix.environment }}
          pact-broker record-deployment \
            --pacticipant <PROJECT_NAME>-backend \
            --version ${{ github.event.inputs.backend_commit_sha }} \
            --environment ${{ matrix.environment }}

      - name: Record Deployed Versions for Acceptance Tests
        run: |
          git config --global --add safe.directory /__w/<PROJECT>/<PROJECT>
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
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add state/${ENVIRONMENT}-deployed-versions.json
          git commit -m "CI: Record deployment to $ENVIRONMENT"
          git push origin main

  run_smoke_tests:
    name: Run Smoke Tests on ${{ matrix.environment }}
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/${{ github.repository_owner }}/playwright-test-environment:latest
    needs: [parse_environments, deploy_to_environment]
    if: success()
    strategy:
      matrix:
        environment: ${{ fromJSON(needs.parse_environments.outputs.environments) }}
    steps:
      - name: Checkout System Tests Repository
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository_owner }}/<PROJECT>-system-test
          path: <PROJECT>-system-test
          token: ${{ secrets.PAT_FOR_SYSTEM_TESTS_REPO }}

      - name: Install System Test Dependencies
        working-directory: ./<PROJECT>-system-test
        run: npm ci

      - name: Run Smoke Tests
        working-directory: ./<PROJECT>-system-test
        env:
          NODE_ENV: ${{ matrix.environment }}
          BASE_URL: <FRONTEND_URL>
          API_URL: <BACKEND_URL>
          CI: true
        run: npm run test:smoke
```

## Platform-Specific Deployment Templates

### EC2/VPS with Docker Compose

```yaml
steps:
  - name: Deploy to EC2 via SSH
    uses: appleboy/ssh-action@master
    env:
      FRONTEND_IMG: ghcr.io/${{ github.repository_owner }}/<PROJECT>-frontend:${{ github.event.inputs.frontend_commit_sha }}-${{ matrix.environment }}
      BACKEND_IMG: ghcr.io/${{ github.repository_owner }}/<PROJECT>-backend:${{ github.event.inputs.backend_commit_sha }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      # ... other secrets
    with:
      host: ${{ secrets.SSH_HOST }}
      username: ${{ secrets.SSH_USER }}
      key: ${{ secrets.SSH_PRIVATE_KEY }}
      port: 22
      envs: FRONTEND_IMG,BACKEND_IMG,DATABASE_URL,...
      script: |
        set -e
        cd /opt/<PROJECT>/${{ matrix.environment }}

        # Create docker-compose.yml
        cat <<EOF > docker-compose.yml
        services:
          frontend:
            image: ${FRONTEND_IMG}
            ports:
              - "${{ matrix.frontend_port }}:3000"
            environment:
              - NODE_ENV=production
            restart: unless-stopped
            healthcheck:
              test: ["CMD", "curl", "-f", "http://localhost:3000/"]
              interval: 10s
              timeout: 5s
              retries: 3

          backend:
            image: ${BACKEND_IMG}
            ports:
              - "${{ matrix.backend_port }}:3001"
            environment:
              - NODE_ENV=${{ matrix.environment }}
              - DATABASE_URL=${DATABASE_URL}
            restart: unless-stopped
            healthcheck:
              test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
              interval: 10s
              timeout: 5s
              retries: 3
            command: >
              sh -c "npx prisma migrate deploy && node dist/server.js"
        EOF

        # Pull images
        docker compose pull

        # Deploy with rolling update
        docker compose up -d

        # Wait for health checks
        sleep 10

        # Verify health endpoints
        curl -f http://localhost:${{ matrix.backend_port }}/api/health || exit 1
```

### AWS ECS/Fargate

```yaml
steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ${{ secrets.AWS_REGION }}

  - name: Update ECS Service
    run: |
      # Update task definition with new image
      aws ecs describe-task-definition \
        --task-definition <PROJECT>-backend-${{ matrix.environment }} \
        --query taskDefinition > task-def.json

      # Update image URI in task definition
      jq '.containerDefinitions[0].image = "ghcr.io/${{ github.repository_owner }}/<PROJECT>-backend:${{ github.event.inputs.backend_commit_sha }}"' \
        task-def.json > new-task-def.json

      # Register new task definition
      aws ecs register-task-definition \
        --cli-input-json file://new-task-def.json

      # Update service
      aws ecs update-service \
        --cluster <CLUSTER_NAME> \
        --service <PROJECT>-backend-${{ matrix.environment }} \
        --force-new-deployment
```

### Kubernetes

```yaml
steps:
  - name: Set up kubectl
    uses: azure/k8s-set-context@v3
    with:
      method: kubeconfig
      kubeconfig: ${{ secrets.KUBE_CONFIG }}

  - name: Deploy to Kubernetes
    run: |
      kubectl set image deployment/<PROJECT>-backend \
        backend=ghcr.io/${{ github.repository_owner }}/<PROJECT>-backend:${{ github.event.inputs.backend_commit_sha }} \
        -n ${{ matrix.environment }}

      kubectl rollout status deployment/<PROJECT>-backend \
        -n ${{ matrix.environment }}
```

## State Directory Structure

```
state/
├── qa-deployed-versions.json
├── qa-last-successfully-tested-versions.json
├── uat-deployed-versions.json
├── uat-last-successfully-tested-versions.json
├── production-deployed-versions.json
└── production-last-successfully-tested-versions.json
```

## Secrets Template Generation

Create `docs/SECRETS.md`:

```markdown
# Required GitHub Secrets for Release Stage

## Common Secrets

- `PACT_BROKER_BASE_URL`: https://your-pact-broker.com
- `PACT_BROKER_TOKEN`: your-pact-broker-token
- `GHCR_PAT`: GitHub Personal Access Token for pulling images

## EC2/VPS Deployment (if using)

- `SSH_HOST`: 52.66.123.45
- `SSH_USER`: ubuntu
- `SSH_PRIVATE_KEY`: (paste private key)

## AWS Deployment (if using)

- `AWS_ACCESS_KEY_ID`: your-aws-access-key-id
- `AWS_SECRET_ACCESS_KEY`: your-aws-secret-access-key
- `AWS_REGION`: us-east-1

## Application Secrets

### QA Environment

- `QA_DATABASE_URL`: postgresql://user:pass@host:5432/qa_db
- `QA_JWT_SECRET`: random-secret-for-qa
- `QA_GITHUB_CLIENT_ID`: oauth-client-id-qa
- `QA_GITHUB_CLIENT_SECRET`: oauth-client-secret-qa

### UAT Environment

- `UAT_DATABASE_URL`: postgresql://user:pass@host:5432/uat_db
- `UAT_JWT_SECRET`: random-secret-for-uat
- `UAT_GITHUB_CLIENT_ID`: oauth-client-id-uat
- `UAT_GITHUB_CLIENT_SECRET`: oauth-client-secret-uat

### Production Environment

- `PROD_DATABASE_URL`: postgresql://user:pass@host:5432/prod_db
- `PROD_JWT_SECRET`: random-secret-for-prod
- `PROD_GITHUB_CLIENT_ID`: oauth-client-id-prod
- `PROD_GITHUB_CLIENT_SECRET`: oauth-client-secret-prod

## System Tests Repository

- `PAT_FOR_SYSTEM_TESTS_REPO`: GitHub PAT for accessing system tests repo
```

## Post-Generation Instructions

```
✅ Release stage workflow created successfully!

📁 Created files:
  - .github/workflows/release-<env>.yml
  - state/qa-deployed-versions.json (template)
  - state/uat-deployed-versions.json (template)
  - docs/SECRETS.md (secrets reference)

🔐 Required GitHub Secrets:
  Add these secrets in GitHub repository settings:
  → Settings → Secrets and variables → Actions → New repository secret

  See docs/SECRETS.md for the complete list.

🎯 How to Use:

  1. Ensure commit stage has run and published Docker images
  2. Go to Actions → Release to Environment
  3. Click "Run workflow"
  4. Select environments (QA/UAT)
  5. Enter commit SHAs (from commit stage)
  6. Click "Run workflow"

  The workflow will:
  ✓ Check contract compatibility (can-i-deploy)
  ✓ Deploy to selected environments
  ✓ Record deployment in Pact Broker
  ✓ Update state files for acceptance tests
  ✓ Run smoke tests

📋 Next Steps:

  1. Review the generated workflow file
  2. Add required secrets to GitHub repository
  3. Set up deployment infrastructure (EC2/ECS/K8s)
  4. Test deployment:
     - Run commit stage to get commit SHAs
     - Trigger release workflow with those SHAs
     - Verify deployment health

  5. Set up acceptance stage with /acceptance-stage

📚 Learn more:
  - Release Stage Pipeline Rules: .claude/rules/release-stage-pipeline.md
  - CI/CD Pipeline Reference: reference/cd-pipeline-reference/
```

## Validation and Safety

1. **Check commit stage exists**:
   ```bash
   if [ ! -f ".github/workflows/commit-stage.yml" ]; then
     echo "❌ Commit stage workflow not found. Run /commit-stage first."
     exit 1
   fi
   ```

2. **Validate environment names**:
   ```bash
   VALID_ENVS="qa uat production"
   for env in $SELECTED_ENVS; do
     if [[ ! " $VALID_ENVS " =~ " $env " ]]; then
       echo "❌ Invalid environment: $env"
       exit 1
     fi
   done
   ```

3. **Check Docker registry access**:
   ```bash
   echo "Testing Docker registry access..."
   docker pull ghcr.io/${{ github.repository_owner }}/test:latest 2>/dev/null || {
     echo "⚠️  Ensure GHCR_PAT secret is configured"
   }
   ```

## Review Gate

After generating the workflow, offer code review:

```
🔍 Would you like me to review the generated workflow for best practices?
[Y/n]

If yes, run pattern checks:
- Verify can-i-deploy runs before deployment
- Check health checks are enabled
- Validate state file updates
- Ensure smoke tests run after deployment
- Check secret references are correct
```

## See Also

- [release-stage-pipeline.md](../rules/release-stage-pipeline.md) - Pipeline rules and best practices
- [commit-stage.md](./commit-stage.md) - Commit stage setup
- [acceptance-stage.md](./acceptance-stage.md) - Acceptance stage setup
- [cd-pipeline-reference](../../reference/cd-pipeline-reference/) - Complete CD pipeline architecture
