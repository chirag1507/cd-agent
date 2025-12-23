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

### Step 1: Confirm Project Details

Ask user to confirm:
- Project name
- Project type (backend/frontend/fullstack/system-tests)
- Package manager preference (pnpm recommended)

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

**Backend:**
```bash
pnpm add express
pnpm add -D typescript @types/node @types/express
pnpm add -D jest ts-jest @types/jest
pnpm add -D @pact-foundation/pact
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier eslint-config-prettier
pnpm add -D supertest @types/supertest
```

**Frontend (Next.js + shadcn/ui + Tailwind):**
```bash
# Create Next.js app with TypeScript
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Testing
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D @types/jest ts-jest

# Contract testing
pnpm add -D @pact-foundation/pact

# shadcn/ui setup
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm dlx shadcn@latest init

# Add common shadcn components
pnpm dlx shadcn@latest add button card input

# Formatting
pnpm add -D prettier eslint-config-prettier
```

**System Tests:**
```bash
pnpm add -D @cucumber/cucumber
pnpm add -D @playwright/test playwright
pnpm add -D typescript ts-node @types/node
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
- Create minimal starter files, not boilerplate
- Don't create example code - let user drive with TDD
- Ensure all paths in tsconfig match the structure
