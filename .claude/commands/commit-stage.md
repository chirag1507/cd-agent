# /commit-stage - Set Up Commit Stage CI/CD Pipeline

> **Trigger**: User runs `/commit-stage` to initialize the commit stage workflow for their project

## Purpose

Automate the setup of a production-ready commit stage CI/CD pipeline following the test pyramid and continuous delivery best practices. This command creates a GitHub Actions workflow that runs tests, static analysis, and builds Docker images on every commit.

## What This Command Does

1. **Gathers project configuration** through interactive prompts
2. **Creates `.github/workflows/commit-stage.yml`** with the complete pipeline
3. **Generates required npm scripts** in `package.json` if missing
4. **Creates `.dockerignore`** for optimized Docker builds
5. **Validates prerequisites** (Dockerfile, test scripts, dependencies)
6. **Provides setup instructions** for secrets and next steps

## Prerequisites Check

Before generating the workflow, verify:

```bash
# 1. Check if project has package.json
[ -f "package.json" ] || echo "❌ Missing package.json"

# 2. Check if Dockerfile exists
[ -f "Dockerfile" ] || echo "⚠️  Missing Dockerfile (required for Docker builds)"

# 3. Check git repository
git rev-parse --git-dir > /dev/null 2>&1 || echo "❌ Not a git repository"

# 4. Check for .github/workflows directory
mkdir -p .github/workflows
```

## Interactive Configuration

Prompt the user for the following information:

### 1. Project Type
```
What type of project is this?
1. Frontend (Next.js/React)
2. Backend (Node.js/Express)
3. Microservice (Backend with Lambda functions)

[User selects option]
```

### 2. Project Name
```
What is the project name? (e.g., code-clinic-backend)
[Default: extracted from package.json name field]
```

### 3. Node.js Version
```
What Node.js version does this project use?
[Default: 22]
```

### 4. Package Manager
```
What package manager does this project use?
1. npm
2. pnpm
3. yarn

[Default: npm]
```

### 5. Test Scripts (Auto-detect or Confirm)
```
Detected test scripts in package.json:
✓ test:unit
✓ test:component
✗ test:integration (missing)
✓ test:contract

Do you want to:
1. Use detected scripts as-is
2. Add missing test scripts
3. Customize test scripts

[User selects option]
```

### 6. Docker Registry
```
Where do you want to publish Docker images?
1. GitHub Container Registry (ghcr.io) - Recommended
2. AWS ECR
3. Docker Hub
4. Skip Docker builds

[Default: 1 - GitHub Container Registry]
```

### 7. Additional Docker Images (For Microservices)
```
[Only if project type = Microservice]

Do you have additional Docker images to build? (e.g., Lambda functions)
[Y/n]

If yes:
Enter Dockerfile paths (comma-separated):
Example: Dockerfile.lambda-process-repo, Dockerfile.lambda-perform-exam

For each Dockerfile, enter:
- Image name: qa-code-clinic-process-repository-processor
- Registry: (same as main, or specify ECR/other)
```

### 8. Database Requirements
```
Does this project require a database for integration tests?
1. PostgreSQL
2. MySQL
3. MongoDB
4. None

[Default: None]

If database selected:
- Database name: [e.g., test_db]
- Database user: [e.g., test_user]
- Database password: [e.g., test_password]
```

### 9. Contract Testing
```
Does this project use Pact for contract testing?
[Y/n]

If yes:
- Is this a Consumer or Provider?
  1. Consumer (Frontend/API Client)
  2. Provider (Backend/API Server)
  3. Both
```

## Workflow Generation

Based on user input, generate the appropriate workflow file. See [commit-stage-pipeline.md](../rules/commit-stage-pipeline.md) for pipeline rules and best practices.

### Frontend Template

```yaml
name: <PROJECT_NAME> Commit Stage

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write

jobs:
  commit-stage:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '<NODE_VERSION>'
          cache: '<PACKAGE_MANAGER>'

      - name: Install Dependencies
        run: <INSTALL_COMMAND>

      - name: Compile Code (TypeScript)
        run: npm run build

      - name: Run Unit Tests
        run: npm test -- --coverage --watchAll=false

      - name: Run Component Tests
        run: npm run test:component

      - name: Run Contract Verification Tests
        run: npm run test:contract

      - name: Publish Pact Contract
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: npm run publish:pacts
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GITHUB_SHA: ${{ github.sha }}

      - name: Run Linting
        run: npm run lint

      - name: Run Static Code Analysis
        run: npm run lint:check

  build-images:
    runs-on: ubuntu-latest
    needs: commit-stage
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    strategy:
      matrix:
        environment: [uat, qa]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Build Docker Image for ${{ matrix.environment }}
        run: |
          docker build --build-arg NEXT_PUBLIC_APP_ENV=${{ matrix.environment }} \
            -t <PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }} .
          docker tag <PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }} \
            <PROJECT_NAME>:latest-${{ matrix.environment }}

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish Docker Image for ${{ matrix.environment }}
        run: |
          docker tag <PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }} \
            ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }}
          docker tag <PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }} \
            ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:latest-${{ matrix.environment }}
          docker push ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:${{ github.sha }}-${{ matrix.environment }}
          docker push ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:latest-${{ matrix.environment }}
```

### Backend Template

```yaml
name: <PROJECT_NAME> Commit Stage

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
    contents: write
    packages: write

jobs:
    test_and_checks:
        name: Install, Tests & Static Checks
        runs-on: ubuntu-latest

        steps:
            - name: Checkout Code
              uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '<NODE_VERSION>'
                  cache: '<PACKAGE_MANAGER>'

            - name: Install dependencies
              run: <INSTALL_COMMAND>

            - name: Compile Code (TypeScript)
              run: npm run build

            - name: Run Unit Tests
              run: npm run test:unit -- --coverage --watchAll=false

            - name: Run Provider Contract Verification (conditional)
              if: ${{ (github.event_name == 'push' && github.ref == 'refs/heads/main') || github.event_name == 'workflow_dispatch' }}
              env:
                  PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
                  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
                  GITHUB_SHA: ${{ github.sha }}
                  PACT_URL: ${{ github.event.inputs.pact_url }}
              run: npm run test:contract

            # [DATABASE SETUP - conditional based on user input]

            - name: Run Narrow Integration Tests
              run: npm run test:integration

            # [DATABASE TEARDOWN - conditional]

            - name: Run Component Tests
              run: npm run test:component

            - name: Run Linting
              run: npm run lint

            - name: Run Static Code Analysis
              run: npm run lint:check

    docker_backend:
        name: Docker Build & Publish Backend Image
        runs-on: ubuntu-latest
        needs: [test_and_checks]
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'

        steps:
            - name: Checkout Code
              uses: actions/checkout@v4

            - name: Setup Docker CLI auth for GHCR
              uses: docker/login-action@v3
              with:
                  registry: ghcr.io
                  username: ${{ github.actor }}
                  password: ${{ secrets.GITHUB_TOKEN }}

            - name: Build Backend Image
              run: |
                  docker build -t <PROJECT_NAME>:${{ github.sha }} .
                  docker tag <PROJECT_NAME>:${{ github.sha }} <PROJECT_NAME>:latest

            - name: Publish Backend Image to GHCR
              run: |
                  docker tag <PROJECT_NAME>:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:${{ github.sha }}
                  docker tag <PROJECT_NAME>:${{ github.sha }} ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:latest
                  docker push ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:${{ github.sha }}
                  docker push ghcr.io/${{ github.repository_owner }}/<PROJECT_NAME>:latest
```

## Missing Script Generation

If test scripts are missing from `package.json`, offer to add them:

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern='src/.*\\.test\\.(ts|tsx)$' --testPathIgnorePatterns='integration|component|contract'",
    "test:component": "jest --testPathPattern='component\\.test\\.(ts|tsx)$'",
    "test:integration": "jest --testPathPattern='integration\\.test\\.(ts|tsx)$'",
    "test:contract": "jest --testPathPattern='pact\\.test\\.(ts|tsx)$'",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:check": "eslint . --ext .ts,.tsx --max-warnings 0",
    "build": "tsc"
  }
}
```

For **Frontend (Next.js)**:
```json
{
  "scripts": {
    "test": "jest",
    "test:component": "jest --testPathPattern='component\\.test\\.(ts|tsx)$'",
    "test:contract": "jest --testPathPattern='pact\\.test\\.(ts|tsx)$'",
    "publish:pacts": "pact-broker publish ./pacts --consumer-app-version=$GITHUB_SHA --tag=main",
    "lint": "next lint",
    "lint:check": "next lint --max-warnings 0",
    "build": "next build"
  }
}
```

## Docker Configuration

### Create/Update `.dockerignore`

```
node_modules
npm-debug.log
.next
.env
.env.local
.git
.gitignore
README.md
.vscode
.idea
coverage
.github
*.md
```

### Validate Dockerfile

Check for required Dockerfile patterns:

```bash
# For Frontend (Next.js)
grep -q "FROM node:" Dockerfile || echo "⚠️  Dockerfile should use official Node.js image"
grep -q "COPY package*.json" Dockerfile || echo "⚠️  Dockerfile should copy package files first"
grep -q "RUN npm ci" Dockerfile || echo "⚠️  Dockerfile should use 'npm ci' for production"

# For Backend
grep -q "FROM node:" Dockerfile || echo "⚠️  Dockerfile should use official Node.js image"
grep -q "EXPOSE" Dockerfile || echo "⚠️  Dockerfile should expose a port"
```

## Database Setup Template (PostgreSQL)

When database is required, add these steps to the workflow:

```yaml
- name: Start Test Database
  run: docker compose up postgres -d

- name: Wait for Test Database
  run: |
    until docker compose exec postgres pg_isready -U <DB_USER> -d <DB_NAME>; do
      echo "Waiting for test database..."
      sleep 2
    done

- name: Setup Test Environment
  run: echo "DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>" > .env

- name: Run Database Migrations
  run: npm run migrate

# [Integration tests run here]

- name: Stop Test Database
  if: always()
  run: docker compose down
```

Also create `docker-compose.yml` if missing:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: <DB_USER>
      POSTGRES_PASSWORD: <DB_PASSWORD>
      POSTGRES_DB: <DB_NAME>
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <DB_USER> -d <DB_NAME>"]
      interval: 5s
      timeout: 5s
      retries: 5
```

## Post-Generation Instructions

After creating the workflow, display:

```
✅ Commit stage workflow created successfully!

📁 Created files:
  - .github/workflows/commit-stage.yml
  - .dockerignore (if missing)
  - docker-compose.yml (if database required)

🔐 Required GitHub Secrets (if using Pact):
  Add these secrets in GitHub repository settings:
  - PACT_BROKER_BASE_URL: https://your-pact-broker.com
  - PACT_BROKER_TOKEN: your-token-here

🔐 Required GitHub Secrets (if using AWS ECR):
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY

📋 Next Steps:
  1. Review the generated workflow file
  2. Add required secrets to GitHub repository
  3. Commit and push to trigger the pipeline:
     git add .github/workflows/commit-stage.yml
     git commit -m "chore: add commit stage CI/CD pipeline"
     git push

  4. Verify the workflow runs successfully on GitHub Actions

📚 Learn more:
  - Commit Stage Pipeline Rules: .claude/rules/commit-stage-pipeline.md
  - CI/CD Pipeline Reference: reference/cd-pipeline-reference/

🎯 What this pipeline does:
  ✓ Runs all tests (unit, component, integration, contract)
  ✓ Static code analysis (linting, TypeScript checks)
  ✓ Builds Docker images (only on main branch)
  ✓ Publishes to registry (GHCR or ECR)
  ✓ Fast feedback (~5-10 minutes)
```

## Validation and Safety

Before writing files:

1. **Check for existing workflow**:
   ```bash
   if [ -f ".github/workflows/commit-stage.yml" ]; then
     echo "⚠️  commit-stage.yml already exists. Overwrite? [y/N]"
     read -r response
     if [[ ! "$response" =~ ^[Yy]$ ]]; then
       exit 0
     fi
   fi
   ```

2. **Validate package.json**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('package.json'))" || {
     echo "❌ Invalid package.json format"
     exit 1
   }
   ```

3. **Check Node.js version compatibility**:
   ```bash
   if [ -f ".nvmrc" ]; then
     NVMRC_VERSION=$(cat .nvmrc)
     echo "📌 Detected Node.js version from .nvmrc: $NVMRC_VERSION"
     echo "Use this version? [Y/n]"
   fi
   ```

## Error Handling

Handle common issues:

- **No Dockerfile**: Warn user and skip Docker build jobs
- **No test scripts**: Offer to generate them or skip test steps
- **Invalid package.json**: Abort with helpful error message
- **Not a git repository**: Abort with instructions
- **Missing dependencies**: List required npm packages

## Review Gate

After generating the workflow, offer code review:

```
🔍 Would you like me to review the generated workflow for best practices?
[Y/n]

If yes, run pattern checks:
- Verify test jobs run before Docker builds
- Check conditional logic for main branch
- Validate environment variable usage
- Ensure secrets are properly referenced
- Check for hard-coded values
```

## See Also

- [commit-stage-pipeline.md](../rules/commit-stage-pipeline.md) - Pipeline rules and best practices
- [test-strategy-reference](../../reference/test-strategy-reference/) - Test pyramid implementation
- [cd-pipeline-reference](../../reference/cd-pipeline-reference/) - Complete CD pipeline architecture
