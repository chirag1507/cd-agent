---
description: Review dependencies and generate gradual update plan
---

# /dependency-review - Review Dependencies and Plan Updates

## CRITICAL: Mandatory Rule Loading

⚠️ **BEFORE PROCEEDING, YOU MUST:**

1. **Read ALL required rule files** (use multiple Read tool calls in parallel)
2. **Confirm rules are loaded** (brief acknowledgment)
3. **Follow rules strictly** (non-negotiable)

**Required Rules:**
- `.claude/rules/dependency-management.md` - Dependency installation and update patterns

**ACTION REQUIRED**: Use Read tool to load these files NOW.

**If you cannot read the rule files, STOP and notify the user.**

---

### Mandatory Checkpoint: Confirm Rules Loaded

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Rules Read:
- dependency-management.md

Proceeding with strict rule compliance for dependency review.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

## Purpose

Analyze current project dependencies, identify available updates, categorize by risk level, and generate a safe, gradual update plan that can be executed incrementally with testing between each step.

## How It Works

This command will:

1. **Analyze Current State**
   - Read `package.json` and lock file
   - Identify current versions of all dependencies
   - Check for deprecated packages

2. **Check Available Updates**
   - Query npm registry for latest versions
   - Identify security vulnerabilities
   - Categorize updates by semver (patch, minor, major)

3. **Risk Assessment**
   - **Critical (Security)**: CVE fixes, immediate action required
   - **Low Risk (Patch)**: Bug fixes, backward compatible
   - **Medium Risk (Minor)**: New features, backward compatible
   - **High Risk (Major)**: Breaking changes, requires review

4. **Generate Update Plan**
   - Prioritized list of updates
   - Grouped by risk level
   - Step-by-step execution order
   - Test checkpoints between steps

5. **Output Actionable Plan**
   - Markdown document with update commands
   - Testing steps after each update
   - Rollback instructions
   - Estimated effort and risk

## Execution Steps

### Step 1: Detect Package Manager

```typescript
// Check which lock file exists
const lockFiles = {
  'pnpm-lock.yaml': 'pnpm',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn'
};

// Use detected package manager for all commands
```

### Step 2: Gather Current Dependency Info

```bash
# Run outdated check
pnpm outdated --format json > outdated.json

# Run security audit
pnpm audit --json > audit.json

# Check for deprecated packages
npm info <each-package> | grep deprecated
```

### Step 3: Analyze and Categorize

Parse the output and categorize each dependency:

```typescript
interface DependencyUpdate {
  name: string;
  current: string;
  wanted: string;    // Highest version within semver range
  latest: string;    // Absolute latest version
  type: 'dependencies' | 'devDependencies';
  updateType: 'patch' | 'minor' | 'major';
  hasSecurityIssue: boolean;
  securitySeverity?: 'low' | 'moderate' | 'high' | 'critical';
  isDeprecated: boolean;
  breaking: boolean; // If major version bump
}
```

### Step 4: Generate Update Plan

**Phase 1: Critical Security Fixes (Immediate)**
```markdown
## 🚨 CRITICAL: Security Updates (Execute Immediately)

These packages have known security vulnerabilities and must be updated ASAP.

### Update 1: package-name (Critical Vulnerability)
**Current:** 1.2.3
**Latest:** 1.2.5
**Severity:** Critical
**CVE:** CVE-2024-12345

**Action:**
```bash
pnpm add package-name@latest
```

**Test:**
```bash
pnpm test
pnpm run test:component
pnpm run test:integration
```

**Rollback if needed:**
```bash
git checkout package.json pnpm-lock.yaml
pnpm install
```

---
```

**Phase 2: Patch Updates (Low Risk)**
```markdown
## ✅ LOW RISK: Patch Updates (Bug Fixes Only)

These are backward-compatible bug fixes. Safe to apply in batch.

### Batch 1: TypeScript Ecosystem
```bash
pnpm add -D typescript@latest @types/node@latest @types/express@latest
pnpm test
```

### Batch 2: Testing Tools
```bash
pnpm add -D jest@latest ts-jest@latest @types/jest@latest
pnpm test
```

---
```

**Phase 3: Minor Updates (Medium Risk)**
```markdown
## ⚠️ MEDIUM RISK: Minor Updates (New Features)

These add new features but should be backward-compatible. Update one at a time.

### Update 1: express (4.18.0 → 4.19.0)
**Changes:** Added new middleware features
**Breaking:** None expected
**Migration Guide:** https://github.com/expressjs/express/releases/tag/4.19.0

**Action:**
```bash
pnpm add express@latest
```

**Test:**
```bash
pnpm test
pnpm run test:component
# Manual smoke test if possible
```

**Review:**
- Check if new features are useful
- Verify no deprecation warnings
- Confirm all routes still work

---
```

**Phase 4: Major Updates (High Risk)**
```markdown
## 🔴 HIGH RISK: Major Updates (Breaking Changes)

These have breaking changes. Requires careful review, testing, and potential code changes.

### Update 1: jest (28.x → 29.x)
**Current:** 28.1.3
**Latest:** 29.7.0
**Breaking Changes:**
- Dropped Node.js 14 support
- Changed default test environment
- Removed deprecated APIs

**Migration Guide:** https://jestjs.io/docs/upgrading-to-jest29

**Estimated Effort:** 2-4 hours
**Risk Level:** High

**Pre-update Checklist:**
- [ ] Read migration guide completely
- [ ] Check if we use deprecated APIs
- [ ] Verify Node.js version compatibility
- [ ] Create feature branch for update
- [ ] Allocate time for potential fixes

**Action:**
```bash
git checkout -b update/jest-29
pnpm add -D jest@latest ts-jest@latest @types/jest@latest
```

**Test:**
```bash
pnpm test
# If tests fail, review error messages
# Update test configuration as needed
# Fix deprecated API usage
```

**Rollback if needed:**
```bash
git checkout main
git branch -D update/jest-29
```

---
```

**Phase 5: Deprecated Packages**
```markdown
## ⚠️ DEPRECATED: Package Replacements

These packages are deprecated. Plan migration to alternatives.

### package-name → recommended-alternative
**Current:** package-name@1.2.3 (deprecated)
**Replacement:** recommended-alternative@2.0.0
**Migration Effort:** Medium (4-8 hours)

**Migration Plan:**
1. Research replacement package API
2. Create feature branch
3. Update imports and usage
4. Run full test suite
5. Review for any behavior changes

**Resources:**
- Migration guide: [link]
- Alternative docs: [link]

---
```

### Step 5: Generate Summary Report

```markdown
# Dependency Review Summary

**Review Date:** 2024-01-15
**Package Manager:** pnpm
**Total Dependencies:** 45
**Updates Available:** 23

## Update Breakdown

| Category | Count | Estimated Time |
|----------|-------|----------------|
| 🚨 Critical Security | 2 | 30 min |
| ✅ Patch Updates | 12 | 2 hours |
| ⚠️ Minor Updates | 7 | 3 hours |
| 🔴 Major Updates | 2 | 8 hours |
| ⚠️ Deprecated | 0 | - |

## Recommended Execution Order

**Week 1: Critical + Patches**
- Day 1: Execute critical security updates (30 min)
- Day 2-3: Apply patch updates in batches (2 hours)
- Day 4: Full regression testing

**Week 2: Minor Updates**
- Days 1-3: Apply minor updates one at a time (3 hours)
- Day 4: Integration testing
- Day 5: Deploy to staging/UAT

**Week 3+: Major Updates**
- Allocate dedicated time per major update
- Each major update gets its own feature branch
- Full testing cycle per update
- Consider spacing major updates apart

## Risk Mitigation

1. **Always commit before updating**
   ```bash
   git add .
   git commit -m "chore: checkpoint before dependency updates"
   ```

2. **Update one at a time** (for minor/major updates)
3. **Run full test suite after each update**
4. **Deploy to staging before production**
5. **Keep rollback plan ready**

## Next Steps

1. Review this plan with team
2. Schedule time for updates
3. Start with Phase 1 (Critical Security)
4. Create feature branches for major updates
5. Track progress and document any issues

---

*Generated by `/dependency-review` command*
```

## Output Location

Save the generated plan to:
```
docs/dependency-updates/review-YYYY-MM-DD.md
```

This creates a historical record of dependency reviews and updates.

## Implementation Example

When you run `/dependency-review`, execute:

```bash
# 1. Run outdated check
pnpm outdated --format json > /tmp/outdated.json

# 2. Run security audit
pnpm audit --json > /tmp/audit.json

# 3. Parse and analyze
# (Read JSON files, categorize updates, assess risk)

# 4. Generate markdown plan
# (Create structured update plan as shown above)

# 5. Save to file
mkdir -p docs/dependency-updates
# Save generated plan to docs/dependency-updates/review-2024-01-15.md

# 6. Display summary
echo "✅ Dependency review complete!"
echo "📄 Plan saved to: docs/dependency-updates/review-2024-01-15.md"
echo ""
echo "Summary:"
echo "  🚨 Critical: 2 security updates"
echo "  ✅ Patch: 12 updates"
echo "  ⚠️  Minor: 7 updates"
echo "  🔴 Major: 2 updates"
echo ""
echo "Start with Phase 1 (Critical Security) immediately."
```

## Integration with TDD Workflow

After applying each update:

```bash
# 1. Update package
pnpm add package-name@latest

# 2. Run tests (TDD safety net)
pnpm test

# 3. If tests pass
git add package.json pnpm-lock.yaml
git commit -m "chore: update package-name to X.Y.Z"

# 4. If tests fail
git checkout package.json pnpm-lock.yaml
pnpm install
# Investigate failure, fix tests, or defer update
```

## Best Practices

1. **Never bulk update** - One package at a time for minor/major updates
2. **Always read release notes** - Especially for major updates
3. **Check breaking changes** - Review migration guides before updating
4. **Test after each update** - Run full test suite
5. **Deploy to staging first** - Validate in production-like environment
6. **Keep audit trail** - Commit each update separately
7. **Space major updates** - Don't do multiple major updates in one day
8. **Consider rollback cost** - If an update is risky, schedule more time
9. **Update lock files** - Commit both package.json and lock file
10. **Monitor after deployment** - Watch for errors in production

## Example Workflow

```bash
# Monday: Critical Security
/dependency-review
# Review generated plan
pnpm add vulnerable-package@latest
pnpm test
git commit -m "security: update vulnerable-package (CVE-2024-12345)"

# Tuesday: Patch Batch 1
pnpm add -D typescript@latest @types/node@latest @types/express@latest
pnpm test
git commit -m "chore: update TypeScript ecosystem to latest patches"

# Wednesday: Patch Batch 2
pnpm add -D jest@latest ts-jest@latest @types/jest@latest
pnpm test
git commit -m "chore: update Jest ecosystem to latest patches"

# Thursday: Minor Update
pnpm add express@latest
pnpm test
pnpm run test:component
git commit -m "chore: update express to 4.19.0"

# Next Week: Major Update (dedicated time)
git checkout -b update/jest-29
pnpm add -D jest@latest
# Fix breaking changes, update configs, etc.
pnpm test
# Create PR, review, merge
```

## Handling Update Failures

If an update breaks tests:

1. **Capture the error**
   ```bash
   pnpm test 2>&1 | tee test-failure.log
   ```

2. **Analyze the failure**
   - Is it a breaking change?
   - Deprecated API usage?
   - Configuration change needed?

3. **Fix or rollback**
   ```bash
   # Option A: Fix the code
   # Update code to work with new version

   # Option B: Rollback
   git checkout package.json pnpm-lock.yaml
   pnpm install
   ```

4. **Document the issue**
   ```markdown
   ## Update Blocked: package-name

   **Attempted:** 1.2.3 → 2.0.0
   **Failure:** Tests fail with error XYZ
   **Cause:** Breaking change in API
   **Action Required:** Refactor usage in src/module/file.ts
   **Estimated Effort:** 4 hours
   **Deferred Until:** Sprint 23
   ```

## See Also

- [dependency-management.md](../rules/dependency-management.md) - Dependency installation rules
- [/cd-init](cd-init.md) - Initial project setup with @latest
- [CLAUDE.md](../../CLAUDE.md) - Project conventions

---

## MANDATORY: Workflow Checkpoint

After completing this command, you MUST suggest the next step:

**Current Phase**: Maintenance - Dependency Review Complete

**Suggested Next Steps**:
1. **If critical security updates found**: Apply immediately - update packages, run tests, commit
2. **If update plan generated**: Review with team, schedule time for updates
3. **If starting updates**: Begin with Phase 1 (Critical Security), one package at a time
4. **If updates complete**: Return to feature work - `/plan <feature>` or continue existing work

**Output Format**:
```
✅ DEPENDENCY REVIEW COMPLETE

Report saved to: docs/dependency-updates/review-[date].md

Update Summary:
- 🚨 Critical Security: [count] updates (IMMEDIATE)
- ✅ Patch Updates: [count] updates
- ⚠️  Minor Updates: [count] updates
- 🔴 Major Updates: [count] updates
- ⚠️  Deprecated: [count] packages

Estimated Total Time: [X] hours spread over [Y] weeks

Suggested Next Step:
→ Apply critical security updates immediately (Phase 1)
   OR
→ Schedule update sessions following generated plan
   OR
→ Return to feature work - /plan <feature> or continue TDD cycle

See: CLAUDE.md "Dependency Management" and docs/workflow-flowchart.md for complete workflow
```

**DO NOT complete this command without suggesting immediate action for critical updates or return to feature work.**
