---
description: Merge completed work to main branch
argument-hint: [optional PR title]
---

# Ship: Merge to Main

Merge completed, tested work to the main branch.

## Input

$ARGUMENTS

(Optional: PR title or description)

## Prerequisites

Before shipping, verify:
- [ ] All tests pass locally
- [ ] Code has been reviewed (if required)
- [ ] Commits follow conventional commit format
- [ ] No WIP or debug code remains
- [ ] Documentation updated (if needed)

## Process

### 1. Verify Clean State

```bash
git status
```

Ensure:
- Working directory is clean
- All changes are committed
- On the correct branch

### 2. Run All Tests

```bash
# Run the full test suite
npm test

# Or project-specific commands
pnpm test
yarn test
```

All tests must pass before shipping.

### 3. Sync with Main

```bash
# Fetch latest from remote
git fetch origin main

# Rebase on main (preferred)
git rebase origin/main

# Or merge (if team prefers)
git merge origin/main
```

Resolve any conflicts, then re-run tests.

### 4. Push to Remote

```bash
git push origin <branch-name>
```

### 5. Create Pull Request (if applicable)

If your workflow uses PRs:

```bash
gh pr create --title "feat: [description]" --body "## Summary
- [Change 1]
- [Change 2]

## Test Plan
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing done"
```

Or merge directly (if trunk-based):

```bash
git checkout main
git merge <branch-name>
git push origin main
```

## PR Description Template

```markdown
## Summary
[Brief description of what this PR does]

## Changes
- [Change 1]
- [Change 2]

## Test Plan
- [x] Sociable unit tests
- [x] Component tests
- [x] Contract tests (if applicable)
- [ ] System tests (runs in CI)

## Checklist
- [ ] Tests pass
- [ ] Code follows project conventions
- [ ] No breaking changes (or documented)
```

## After Shipping

### If Using Feature Branches

```bash
# Delete local branch
git branch -d <branch-name>

# Delete remote branch
git push origin --delete <branch-name>
```

### Verify CI Pipeline

After merge to main:
1. Commit Stage runs automatically
2. Docker images built and published (if tests pass)
3. Ready for release trigger

## Output

```
═══════════════════════════════════════════════════
SHIP COMPLETE
═══════════════════════════════════════════════════

Branch: [branch-name]
Merged to: main
Commits: [number]

CI Status: [link to pipeline]

Next steps:
- Monitor CI pipeline
- Trigger release when ready: /release

═══════════════════════════════════════════════════
```

## Handling Issues

### CI Pipeline Fails

If commit stage fails after merge:
1. Check the failure logs
2. Fix locally
3. Push fix to main
4. Don't leave main broken!

### Merge Conflicts

```bash
# During rebase
git rebase origin/main
# ... resolve conflicts ...
git add .
git rebase --continue

# Re-run tests after resolving
npm test
```

### Need to Revert

If something goes wrong after shipping:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main
```

## Shipping Checklist

```
[ ] All tests pass locally
[ ] Rebased/merged with latest main
[ ] No conflicts
[ ] PR created (if using PRs)
[ ] PR approved (if required)
[ ] Merged to main
[ ] CI pipeline green
[ ] Feature branch deleted
```

## Next Steps

- **Deploy to environment**: Trigger release workflow
- **Start next feature**: `/plan [next feature]`
- **Monitor**: Check CI pipeline and deployment
