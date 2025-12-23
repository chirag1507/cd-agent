# Dependency Management

> **Trigger**: Installing, updating, or managing npm packages in any project

## Purpose

Ensure consistent, secure, and maintainable dependency management across all projects by always using latest stable versions and following best practices.

## Non-Negotiable Rules

### 1. Always Use Latest Stable Versions

When installing any package, ALWAYS use the `@latest` tag.

```bash
# ✅ GOOD: Explicitly request latest stable version
pnpm add express@latest
pnpm add -D typescript@latest @types/node@latest
pnpm add react@latest next@latest

# ❌ BAD: Version range, might install old version
pnpm add express
pnpm add -D typescript @types/node

# ❌ BAD: Pinned old version
pnpm add express@4.17.1
```

**Why:**
- Ensures you get latest bug fixes and security patches
- Avoids inheriting old vulnerabilities
- Consistent behavior across environments
- Better TypeScript support in newer versions
- Clearer intent - explicitly choosing "latest"

### 2. Package Manager Hierarchy

**Preferred Order:**
1. **pnpm** (default choice)
2. **npm** (if project already uses it)
3. **yarn** (if project already uses it)

```bash
# ✅ GOOD: Use pnpm by default
pnpm add express@latest

# ✅ ACCEPTABLE: If package-lock.json exists
npm install express@latest

# ✅ ACCEPTABLE: If yarn.lock exists
yarn add express@latest
```

**Why pnpm:**
- Faster installation
- Disk space efficient (content-addressable storage)
- Strict dependency resolution (catches phantom dependencies)
- Better monorepo support

### 3. Separate Production and Dev Dependencies

```bash
# ✅ GOOD: Clear separation
pnpm add express@latest                    # Production dependency
pnpm add -D typescript@latest              # Dev dependency
pnpm add -D @types/node@latest             # Dev dependency

# ❌ BAD: Installing dev tools as production dependencies
pnpm add typescript@latest                 # NO! TypeScript is dev-only
pnpm add jest@latest                       # NO! Jest is dev-only
```

**Production Dependencies (`dependencies`):**
- Runtime frameworks (Express, Next.js, React)
- Libraries used in production code
- Database clients (Prisma Client, MongoDB driver)

**Dev Dependencies (`devDependencies`):**
- Build tools (TypeScript, Webpack, Vite)
- Testing frameworks (Jest, Playwright, Cucumber)
- Linters and formatters (ESLint, Prettier)
- Type definitions (@types/*)
- Development tools (ts-node, nodemon)

### 4. Version Pinning in package.json

Let the package manager handle version ranges based on semver.

```json
{
  "dependencies": {
    "express": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Lock files handle exact versions:**
- `pnpm-lock.yaml` for pnpm
- `package-lock.json` for npm
- `yarn.lock` for yarn

**NEVER commit exact versions in package.json unless necessary:**
```json
{
  "dependencies": {
    "express": "5.0.0"  // ❌ BAD: Too restrictive
  }
}
```

### 5. Dependency Review Process

Dependencies are reviewed and updated through a **manual dependency review command** that provides a gradual update plan.

**Process:**
1. Run dependency review command manually
2. Command analyzes current dependencies and available updates
3. Generates gradual update plan prioritizing:
   - Security patches (immediate)
   - Minor updates (low risk)
   - Major updates (requires review and testing)
4. Follow the generated plan to update packages incrementally

**DO NOT use automatic update tools** - updates must be deliberate and tested.

```bash
# ❌ BAD: Automatic bulk updates
pnpm update --latest  # Too risky, breaks things

# ✅ GOOD: Manual review with gradual plan
# Run dependency review command (when implemented)
# Follow generated update plan
# Update one package at a time
# Run tests after each update
```

**Why gradual updates:**
- Reduces risk of breaking changes
- Easier to identify which update caused an issue
- Tests validate each change
- Clear rollback path if problems arise

### 6. Security Audits

Always run security audits after installing dependencies:

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities automatically (if possible)
pnpm audit --fix

# For critical vulnerabilities, update immediately
pnpm update <package>@latest
```

### 7. Clean Installation in CI

CI pipelines should use clean installation commands:

```bash
# ✅ GOOD: Clean install (removes node_modules first)
pnpm install --frozen-lockfile  # Uses exact versions from lockfile

# ✅ GOOD: For npm
npm ci  # Clean install using package-lock.json

# ❌ BAD: Regular install (might modify lockfile)
pnpm install
npm install
```

### 8. Avoid Deprecated Packages

Before installing a package, check if it's deprecated:

```bash
# Check package info
npm info <package-name>

# Look for deprecation warnings in output
```

**If deprecated:**
- Find maintained alternative
- Check migration guides
- Update to recommended replacement

**Example deprecated packages to avoid:**
- `request` → Use `axios@latest` or `node-fetch@latest`
- `moment` → Use `date-fns@latest` or `dayjs@latest`
- `tslint` → Use `eslint@latest`

### 9. Peer Dependencies

Pay attention to peer dependency warnings:

```bash
# If you see peer dependency warnings
pnpm add <package>@latest

# Example output:
# WARN  react-dom@18.2.0 requires a peer of react@^18.2.0
# but none is installed. You must install peer dependencies yourself.

# Install the required peer dependency
pnpm add react@latest
```

### 10. Global Packages

Minimize global package installations. Use local project dependencies or npx/pnpm dlx:

```bash
# ❌ BAD: Global installation
npm install -g typescript

# ✅ GOOD: Local installation
pnpm add -D typescript@latest

# ✅ GOOD: One-time execution
pnpm dlx create-next-app@latest
npx create-react-app@latest my-app
```

**Only install globally if:**
- Used across multiple projects
- Required for system-level tools (e.g., pnpm itself)

## Common Dependency Patterns

### Backend (Node.js/Express)

```bash
# Core
pnpm add express@latest

# TypeScript
pnpm add -D typescript@latest @types/node@latest @types/express@latest

# Testing
pnpm add -D jest@latest ts-jest@latest @types/jest@latest
pnpm add -D supertest@latest @types/supertest@latest

# Contract Testing
pnpm add -D @pact-foundation/pact@latest

# Validation
pnpm add zod@latest  # or joi@latest

# Database
pnpm add prisma@latest @prisma/client@latest

# Environment
pnpm add dotenv@latest

# Linting
pnpm add -D eslint@latest @typescript-eslint/parser@latest @typescript-eslint/eslint-plugin@latest
pnpm add -D prettier@latest eslint-config-prettier@latest
```

### Frontend (React/Next.js)

```bash
# Framework (Next.js creates project with latest versions)
pnpm create next-app@latest

# Testing
pnpm add -D jest@latest jest-environment-jsdom@latest
pnpm add -D @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest
pnpm add -D @types/jest@latest ts-jest@latest

# Contract Testing
pnpm add -D @pact-foundation/pact@latest

# UI Components (shadcn/ui)
pnpm add tailwindcss-animate@latest class-variance-authority@latest clsx@latest tailwind-merge@latest
pnpm add lucide-react@latest
pnpm dlx shadcn@latest init

# State Management
pnpm add zustand@latest  # or @tanstack/react-query@latest

# Forms
pnpm add react-hook-form@latest @hookform/resolvers@latest
pnpm add zod@latest

# Linting
pnpm add -D prettier@latest eslint-config-prettier@latest
```

### System Tests (Cucumber + Playwright)

```bash
# Testing Frameworks
pnpm add -D @cucumber/cucumber@latest
pnpm add -D @playwright/test@latest playwright@latest

# TypeScript
pnpm add -D typescript@latest ts-node@latest @types/node@latest

# Utilities
pnpm add -D dotenv@latest
```

## Troubleshooting

### Issue: ENOENT error during install

```bash
# Solution: Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Peer dependency conflicts

```bash
# Solution: Install missing peer dependencies
pnpm add <peer-dependency>@latest

# Or use --legacy-peer-deps (last resort)
pnpm install --no-strict-peer-dependencies
```

### Issue: Version conflicts in monorepo

```bash
# Solution: Use workspace protocol
# package.json
{
  "dependencies": {
    "@myorg/shared": "workspace:*"
  }
}
```

### Issue: Package not found

```bash
# Solution: Check package name spelling
pnpm info <package-name>

# If it's a scoped package, include scope
pnpm add @types/node@latest  # Not types-node
```

## Best Practices Summary

1. **Always use `@latest`** - Get latest stable versions
2. **Use pnpm** - Unless project already uses npm/yarn
3. **Separate prod/dev dependencies** - Keep production bundle small
4. **Commit lock files** - Ensure reproducible builds
5. **Run security audits** - Fix vulnerabilities proactively
6. **Use dependency review command** - Manual review with gradual update plan
7. **Check deprecation** - Migrate away from deprecated packages
8. **Use clean install in CI** - `pnpm install --frozen-lockfile`
9. **Install peer dependencies** - Don't ignore warnings
10. **Prefer local over global** - Use pnpm dlx/npx for one-offs

## Integration with Commands

Commands that install dependencies should follow these rules:
- `/cd-init` - Initial project setup with @latest
- `/spike` - When adding experimental packages with @latest
- `/cycle` - When TDD cycle requires new packages with @latest
- Dependency review command - Manual update planning
- CI/CD pipelines - Use frozen lockfile

## See Also

- [/cd-init](../commands/cd-init.md) - Project initialization
- [CLAUDE.md](../../CLAUDE.md) - Project tech stack
- [commit-stage-pipeline.md](commit-stage-pipeline.md) - CI dependency installation
