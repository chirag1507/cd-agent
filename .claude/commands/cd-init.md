---
description: Initialize a new project with CD-Agent structure and dependencies
argument-hint: [project-type: backend, frontend, fullstack]
---

# /cd-init - Initialize Project

$ARGUMENTS

(If no project type provided, ask the user)

## Purpose

Set up a new TypeScript project with all the tooling needed for TDD and Continuous Delivery.

## Project Types

1. **backend** - Node.js/Express API with Jest, Pact, Clean Architecture
2. **frontend** - React/Next.js with Jest, Testing Library, Pact Consumer
3. **fullstack** - Monorepo with both backend and frontend
4. **system-tests** - Acceptance test project (Four-Layer Model)

## Initialization Steps

### Step 1: Confirm Project Details and Frontend Context

**1.1 Basic Project Information**

Ask user to confirm:
- Project name
- Project type (backend/frontend/fullstack/system-tests)
- Package manager preference (pnpm recommended)

**1.2 Interactive Frontend Context Discovery (Backend Projects Only)**

If project type is **backend**, ask the following questions to understand the context:

**Question 1: "Does a frontend already exist for this backend?"**

Options:
- **A) No, I'm building both frontend and backend** → Suggest using `/cd-init fullstack` instead
- **B) Yes, frontend exists and I have access to it** → Continue to Question 2
- **C) Yes, but it's a third-party frontend (not under my control)** → Skip to Step 2, note in project README
- **D) Not sure yet / Will decide later** → Skip to Step 2, can add FE reference materials later

---

**If Answer = B (Frontend exists and accessible), ask Question 2:**

**Question 2: "Is the frontend project in your current VSCode workspace?"**

💡 **RECOMMENDATION**: Adding the frontend project to your workspace will significantly improve my ability to:
- Analyze existing API calls and data structures
- Understand UI workflows and user interactions
- Generate accurate API contracts automatically
- Provide better context-aware suggestions
- Reduce errors and misalignment

Options:
- **Yes, frontend is in workspace** → I can analyze it directly
- **No, but I can add it** → Please add frontend project folder to workspace, then I'll analyze it
- **No, I'll provide screenshots/contracts manually** → Continue to Question 3

---

**If frontend not in workspace, ask Question 3:**

**Question 3: "What frontend reference materials do you have?"**

Select all that apply:
- **a) Screenshots or UI designs** → I'll ask you to share them
- **b) Pact consumer contracts** → I'll ask you to share them
- **c) OpenAPI/Swagger specifications** → I'll ask you to share them
- **d) API documentation or examples** → I'll ask you to share them
- **e) Frontend codebase is available but not Pact-enabled** → I'll guide you to retrofit Pact consumer tests first
- **f) None of the above** → I'll help you document API requirements as we go

---

**Based on answers, take appropriate action:**

- **If frontend in workspace**: Analyze frontend codebase for API calls and data structures
- **If screenshots provided**: Store in `docs/frontend-reference/screenshots/`, create README.md index
- **If contracts provided**: Store in `docs/frontend-reference/contracts/`, categorize by type
- **If frontend code available but no Pact**:
  - Explain Scenario B from [contract-test-provider.md](../rules/contract-test-provider.md)
  - Recommend retrofitting Pact consumer tests in frontend first
  - Provide step-by-step guidance
- **If third-party frontend**: Note API requirements in `docs/api-requirements.md`

**Post-Initialization Note**: If you skip this now or answer "Not sure yet", you can always add frontend reference materials later using the guidance in Step 1.3 below.

---

**1.3 Adding Frontend Reference Materials to Existing Backend Project**

If you already initialized the backend project and now want to add frontend reference materials:

**Step 1: Create the directory structure**

```bash
mkdir -p docs/frontend-reference/screenshots
mkdir -p docs/frontend-reference/contracts/pact
```

**Step 2: Add reference materials**

Follow the same interactive questions from Step 1.2 above:

1. **Add frontend to workspace** (recommended):
   - File → Add Folder to Workspace → Select frontend project folder
   - Inform me that frontend is now in workspace
   - I can now analyze API calls, data structures, and UI workflows

2. **Or provide screenshots**:
   - Save screenshots to `docs/frontend-reference/screenshots/`
   - Create `docs/frontend-reference/screenshots/README.md`:
     ```markdown
     # Frontend UI Screenshots

     ## Registration Flow
     - `registration-form.png` - User registration form with email, password, name fields
     - `registration-success.png` - Success message after registration
     - `registration-error.png` - Error states (invalid email, weak password, etc.)

     ## Dashboard
     - `dashboard-overview.png` - Main dashboard view showing user data
     ```

3. **Or provide contracts**:
   - **Pact contracts**: Copy to `docs/frontend-reference/contracts/pact/`
   - **OpenAPI specs**: Save as `docs/frontend-reference/contracts/openapi.yaml`
   - **API docs**: Create `docs/frontend-reference/contracts/README.md`

**Step 3: Inform the agent**

Tell me: "I've added frontend reference materials" and I'll:
- Review the materials
- Update my understanding of API requirements
- Guide implementation to match frontend expectations
- Help retrofit Pact consumer tests if frontend code is available

---

### Step 2: Create Directory Structure

**For Backend:**
```
src/
├── <domain>/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── errors/
│   │   └── interfaces/
│   │       ├── repositories/
│   │       └── services/
│   ├── application/
│   │   └── use-cases/
│   ├── infrastructure/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── mappers/
│   ├── presentation/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── dtos/
│   └── __tests__/
│       ├── builders/
│       └── component/
docs/
└── frontend-reference/         # (Only if frontend exists separately)
    ├── screenshots/            # UI screenshots for context
    │   └── README.md          # Index of screenshots with descriptions
    └── contracts/             # API contracts from frontend
        ├── openapi.yaml       # OpenAPI/Swagger specs (if available)
        ├── pact/              # Pact consumer contracts (if available)
        └── README.md          # Contract documentation
```

**For Frontend (Next.js + Clean Architecture + Atomic Design):**
```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── <route>/page.tsx
├── features/                      # Feature modules (Bounded Contexts)
│   └── <feature>/
│       ├── application/
│       │   └── usecases/          # Business logic (no React)
│       ├── components/            # Feature-specific UI
│       ├── constants/
│       ├── hooks/                 # Custom React hooks
│       ├── interfaces/            # Repository ports
│       ├── mappers/               # Domain → Presentation
│       ├── repositories/          # Repository adapters
│       ├── types/                 # Domain types
│       └── utils/
└── shared/
    ├── components/
    │   ├── atoms/                 # Basic building blocks
    │   ├── molecules/             # Composed atoms
    │   ├── organisms/             # Complex sections
    │   ├── templates/             # Page layouts
    │   └── shadcn/                # shadcn/ui components
    ├── config/                    # Environment configs
    ├── hooks/                     # Shared hooks
    ├── interfaces/                # Service interfaces
    ├── lib/                       # Utilities (cn helper)
    ├── providers/                 # React Context (DI)
    ├── services/                  # Service adapters
    └── types/
```

**For System Tests:**
```
acceptance/
├── test-cases/
├── dsl/
│   └── models/
├── drivers/
│   ├── interfaces/
│   ├── web/
│   │   ├── pages/
│   │   └── services/
│   └── api/
├── scenarios/
└── support/
```

### Step 3: Initialize package.json

```json
{
  "name": "<project-name>",
  "version": "0.1.0",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:component": "jest --testPathPattern=component",
    "test:contract": "jest --testPathPattern=contract",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.ts\"",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 4: Install Dependencies

**CRITICAL: Always install latest stable versions using `@latest` tag**

**Backend:**
```bash
pnpm add express@latest
pnpm add -D typescript@latest @types/node@latest @types/express@latest
pnpm add -D jest@latest ts-jest@latest @types/jest@latest
pnpm add -D @pact-foundation/pact@latest
pnpm add -D eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest
pnpm add -D prettier@latest eslint-config-prettier@latest
pnpm add -D supertest@latest @types/supertest@latest
```

**Frontend (Next.js + shadcn/ui + Tailwind):**
```bash
# Create Next.js app with TypeScript (already uses @latest)
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Testing
pnpm add -D jest@latest jest-environment-jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest
pnpm add -D @types/jest@latest ts-jest@latest

# Contract testing
pnpm add -D @pact-foundation/pact@latest

# shadcn/ui setup
pnpm add tailwindcss-animate@latest class-variance-authority@latest clsx@latest tailwind-merge@latest
pnpm add lucide-react@latest
pnpm dlx shadcn@latest init

# Add common shadcn components (shadcn CLI manages versions)
pnpm dlx shadcn@latest add button card input

# Formatting
pnpm add -D prettier@latest eslint-config-prettier@latest
```

**System Tests:**
```bash
pnpm add -D @cucumber/cucumber@latest
pnpm add -D @playwright/test@latest playwright@latest
pnpm add -D typescript@latest ts-node@latest @types/node@latest
```

### Step 5: Create Config Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/*/domain/*"],
      "@application/*": ["src/*/application/*"],
      "@infrastructure/*": ["src/*/infrastructure/*"],
      "@presentation/*": ["src/*/presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**jest.config.js (Backend):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/*/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/*/application/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**jest.config.js (Frontend):**
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.types.ts',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

**jest.setup.ts (Frontend):**
```typescript
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
```

**src/shared/lib/utils.ts (Frontend - cn helper):**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**.eslintrc.js:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Step 6: Create .gitignore

```
node_modules/
dist/
coverage/
.env
.env.local
*.log
.DS_Store
```

### Step 7: Initialize Git

```bash
git init
git add .
git commit -m "chore: initial project setup with CD-Agent"
```

## Output

After initialization, report:

```
PROJECT INITIALIZED
═══════════════════

Project: [project-name]
Type: [backend/frontend/fullstack/system-tests]
Package Manager: [pnpm/npm]

Structure Created:
  ✓ src/ directory with Clean Architecture layers
  ✓ TypeScript configured
  ✓ Jest configured for TDD
  ✓ ESLint + Prettier configured
  ✓ Git initialized

Next Steps:
1. Review and customize CLAUDE.md for your domain
2. Run: pnpm install
3. Start with: /plan <your first feature>
4. Begin TDD: /red <first behavior>

Happy coding with discipline! 🎯
```

## Important Notes

- Always use pnpm unless user specifies otherwise
- **CRITICAL: Always install latest stable versions using `@latest` tag** (e.g., `pnpm add express@latest`)
- Create minimal starter files, not boilerplate
- Don't create example code - let user drive with TDD
- Ensure all paths in tsconfig match the structure
