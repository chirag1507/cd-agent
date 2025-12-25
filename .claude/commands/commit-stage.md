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

# 5. Check if project uses Prisma ORM
USES_PRISMA=false
if [ -f "package.json" ]; then
  if grep -q "@prisma/client" package.json; then
    USES_PRISMA=true
    echo "✓ Detected Prisma ORM"

    # Check for schema
    if [ ! -f "prisma/schema.prisma" ]; then
      echo "⚠️  @prisma/client found but no prisma/schema.prisma"
      echo "   Prisma Client generation will be skipped"
    else
      echo "   Found prisma/schema.prisma"
    fi
  fi
fi
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

**If pnpm is selected, detect version:**

```bash
# Step 1: Check lockfile version (most reliable)
if [ -f "pnpm-lock.yaml" ]; then
  LOCKFILE_VERSION=$(head -1 pnpm-lock.yaml | grep -oP 'lockfileVersion.*["\x27:]?\s*\K\d+(\.\d+)?' | head -1)

  if [ -n "$LOCKFILE_VERSION" ]; then
    LOCKFILE_MAJOR=$(echo "$LOCKFILE_VERSION" | cut -d. -f1)

    # Map lockfile version to pnpm version
    case "$LOCKFILE_MAJOR" in
      9) PNPM_VERSION=10 ;;  # Lockfile 9.x requires pnpm 9+
      6) PNPM_VERSION=8 ;;   # Lockfile 6.x requires pnpm 8
      *) PNPM_VERSION=10 ;;  # Default to latest
    esac
  fi
fi

# Step 2: Fallback to package.json engines
if [ -z "$PNPM_VERSION" ] && [ -f "package.json" ]; then
  PNPM_ENGINE=$(jq -r '.engines.pnpm // ""' package.json 2>/dev/null)
  if [ -n "$PNPM_ENGINE" ]; then
    PNPM_VERSION=$(echo "$PNPM_ENGINE" | grep -oP '\d+' | head -1)
  fi
fi

# Step 3: Default to latest stable
if [ -z "$PNPM_VERSION" ]; then
  PNPM_VERSION=10
fi

echo "📦 Detected pnpm version: $PNPM_VERSION"
echo "   (Lockfile version: ${LOCKFILE_VERSION:-not found})"
echo ""
echo "Use pnpm version $PNPM_VERSION? [Y/n]"
read -r response
if [[ "$response" =~ ^[Nn]$ ]]; then
  echo "Enter pnpm version (8, 9, or 10):"
  read -r PNPM_VERSION
fi
```

**Version Mapping Guide:**
- Lockfile version 6.x → pnpm 8
- Lockfile version 9.x → pnpm 10 (or 9)
- No lockfile → pnpm 10 (latest stable)

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

### 10. Prisma ORM (Backend Only)

**If Prisma is detected** (found `@prisma/client` in package.json):

```
✓ Detected Prisma ORM in backend project

Prisma Client must be generated before TypeScript compilation.
The workflow will include a "Generate Prisma Client" step before build.

Ensure:
  - prisma/schema.prisma exists
  - Package manager scripts support prisma generate

Continue? [Y/n]
```

**Generate command mapping:**
- pnpm → `pnpm exec prisma generate`
- npm → `npx prisma generate`
- yarn → `yarn prisma generate`

**Note**: If database migrations are enabled for integration tests, `prisma migrate deploy` already generates the client, so the separate generate step may be skipped in that case.

## Workflow Generation

Based on user input, generate the appropriate workflow file. See [commit-stage-pipeline.md](../rules/commit-stage-pipeline.md) for pipeline rules and best practices.

### Template Variable Substitution

When generating the workflow, replace these placeholders with actual values:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `<PROJECT_NAME>` | Project name from package.json | `code-clinic-backend` |
| `<NODE_VERSION>` | Node.js version | `22` |
| `<PACKAGE_MANAGER>` | Package manager | `pnpm`, `npm`, or `yarn` |
| `<PNPM_VERSION>` | pnpm version (only if using pnpm) | `10`, `9`, or `8` |
| `<INSTALL_COMMAND>` | Install command | `pnpm install --frozen-lockfile`, `npm ci`, `yarn install --frozen-lockfile` |
| `<PRISMA_GENERATE_COMMAND>` | Prisma generate command (if Prisma detected) | `pnpm exec prisma generate`, `npx prisma generate`, `yarn prisma generate` |
| `<PRISMA_MIGRATE_COMMAND>` | Prisma migrate command (if Prisma + database) | `pnpm exec prisma migrate deploy`, `npx prisma migrate deploy`, `yarn prisma migrate deploy` |
| `<DB_USER>` | Database user (if applicable) | `test_user` |
| `<DB_PASSWORD>` | Database password (if applicable) | `test_password` |
| `<DB_NAME>` | Database name (if applicable) | `test_db` |
| `<DATABASE_URL>` | Complete database connection string | `postgresql://test_user:test_password@localhost:5432/test_db` |

**Install Command Mapping:**
- npm → `npm ci`
- pnpm → `pnpm install --frozen-lockfile`
- yarn → `yarn install --frozen-lockfile`

**Prisma Generate Command Mapping:**
- npm → `npx prisma generate`
- pnpm → `pnpm exec prisma generate`
- yarn → `yarn prisma generate`

**CRITICAL: pnpm Installation Order**

When using pnpm as the package manager, pnpm MUST be installed BEFORE setting up Node.js with cache. This is because `cache: 'pnpm'` in `setup-node` requires pnpm to already be available.

✅ **Correct Order:**
```yaml
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: <PNPM_VERSION>  # Use detected version (8, 9, or 10)

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'  # Now pnpm is available
```

❌ **Wrong Order (causes error):**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'  # ❌ Error: pnpm not found

- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: <PNPM_VERSION>
```

**Important Notes:**
- This only applies to pnpm. npm and yarn are pre-installed in GitHub Actions runners.
- The pnpm version MUST match your lockfile version:
  - Lockfile version 6.x → pnpm 8
  - Lockfile version 9.x → pnpm 10 (or 9)
- The command auto-detects the correct version from your `pnpm-lock.yaml`

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

      # [PNPM SETUP - conditional based on package manager]
      - name: Install pnpm
        if: '<PACKAGE_MANAGER>' == 'pnpm'
        uses: pnpm/action-setup@v2
        with:
          version: <PNPM_VERSION>

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

            # [PNPM SETUP - conditional based on package manager]
            - name: Install pnpm
              if: '<PACKAGE_MANAGER>' == 'pnpm'
              uses: pnpm/action-setup@v2
              with:
                  version: <PNPM_VERSION>

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '<NODE_VERSION>'
                  cache: '<PACKAGE_MANAGER>'

            - name: Install dependencies
              run: <INSTALL_COMMAND>

            # [PRISMA SETUP - conditional if Prisma detected]
            - name: Generate Prisma Client
              if: '<USES_PRISMA>' == 'true'
              run: <PRISMA_GENERATE_COMMAND>

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
            # Add steps from "Database Setup Template" section below:
            # - Start Test Database
            # - Wait for Test Database
            # - Run Database Migrations (with env: DATABASE_URL)

            - name: Run Narrow Integration Tests
              env:
                  DATABASE_URL: postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>
              run: npm run test:integration

            # [DATABASE TEARDOWN - conditional]
            # - Stop Test Database (if: always())

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

- name: Run Database Migrations
  env:
    DATABASE_URL: postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>
  run: <PRISMA_MIGRATE_COMMAND>

# [Integration tests run here - see below]

- name: Stop Test Database
  if: always()
  run: docker compose down
```

**Integration Tests Step** (add after migrations):

```yaml
- name: Run Narrow Integration Tests
  env:
    DATABASE_URL: postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>
  run: <PACKAGE_MANAGER> run test:integration
```

**Database URL Format:**

Set `DATABASE_URL` as an environment variable in each step that needs database access (migrations, integration tests). **Do NOT create .env files** - use the `env:` block directly.

| Database | URL Format | Example |
|----------|------------|---------|
| PostgreSQL | `postgresql://<user>:<password>@<host>:<port>/<database>` | `postgresql://test_user:test_pass@localhost:5432/test_db` |
| MySQL | `mysql://<user>:<password>@<host>:<port>/<database>` | `mysql://test_user:test_pass@localhost:3306/test_db` |
| MongoDB | `mongodb://<user>:<password>@<host>:<port>/<database>` | `mongodb://test_user:test_pass@localhost:27017/test_db` |

**Why env: instead of .env files?**
- ✅ CI/CD workflows don't automatically load .env files
- ✅ Explicit env vars are more reliable and visible
- ✅ No need for dotenv library in test configuration
- ✅ Works consistently across all test frameworks

**Migration Command Mapping:**

**If using Prisma:**
- npm → `npx prisma migrate deploy`
- pnpm → `pnpm exec prisma migrate deploy`
- yarn → `yarn prisma migrate deploy`

**If using other migration tool:**
- Custom: `npm run migrate` (or equivalent)

**Important Note**: When using Prisma migrations, `prisma migrate deploy` automatically generates the Prisma Client, so you can optimize the workflow by conditionally skipping the separate "Generate Prisma Client" step:

```yaml
# Option 1: Always generate (simpler, works in all cases)
- name: Generate Prisma Client
  if: '<USES_PRISMA>' == 'true'
  run: <PRISMA_GENERATE_COMMAND>

# Option 2: Skip if migrations will run (optimization)
- name: Generate Prisma Client
  if: '<USES_PRISMA>' == 'true' && '<RUNS_MIGRATIONS>' == 'false'
  run: <PRISMA_GENERATE_COMMAND>
```

Recommendation: Use Option 1 (always generate) for simplicity unless workflow runs very frequently and performance is critical.

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
