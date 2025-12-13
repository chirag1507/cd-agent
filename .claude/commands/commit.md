---
description: Create a git commit following conventional commit standards
argument-hint: [optional commit description]
---

# Commit: Save Progress

Create a git commit following project standards.

## Input

$ARGUMENTS

(Optional: description hint for the commit message)

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Use When |
|------|----------|
| `feat` | Adding new functionality |
| `fix` | Fixing a bug |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Maintenance tasks |
| `style` | Formatting, whitespace (no code change) |

### Scope (Optional)

The module or component affected:
- `auth` - Authentication module
- `user` - User module
- `api` - API layer
- `ui` - Frontend components

### Examples

```
feat(auth): add user registration use case

fix(user): handle duplicate email validation

refactor(api): extract validation middleware

test(auth): add registration component tests

chore: update dependencies
```

## Process

### 1. Review Changes

```bash
git status
git diff
```

Verify:
- [ ] Only intended files are modified
- [ ] No secrets or credentials included
- [ ] No debug code left behind

### 2. Check Recent Commits

```bash
git log --oneline -5
```

Match the style of existing commits.

### 3. Stage Files

```bash
git add <files>
```

Or stage all:
```bash
git add .
```

### 4. Create Commit

```bash
git commit -m "type(scope): description"
```

For multi-line messages:
```bash
git commit -m "type(scope): description" -m "Body with more details"
```

### 5. Verify

```bash
git status
git log -1
```

## Guidelines

### DO
- Write clear, concise descriptions
- Use imperative mood ("add" not "added")
- Reference issue numbers when applicable
- Keep subject line under 72 characters

### DON'T
- Include AI credits or co-author tags
- Mention TDD or development process
- Make vague commits ("fix stuff", "updates")
- Commit failing tests (unless intentional WIP)

## Commit Frequency

Commit at natural breakpoints:
- After completing a TDD cycle
- After implementing a complete behavior
- Before switching context
- At end of work session

**Small, frequent commits** are better than large, infrequent ones.

## Pre-Commit Checks

Before committing, ensure:
- [ ] All tests pass
- [ ] Code compiles/builds
- [ ] Linting passes (if configured)
- [ ] No console.log or debug statements

## Output

After committing:

```
COMMIT CREATED

Hash: [short hash]
Message: [commit message]
Files: [number] changed

Status: Clean working directory

Next: /ship to merge, or continue development
```

## Handling Issues

### Commit Rejected by Pre-commit Hook

If hooks modify files:
1. Review the changes
2. Stage the modified files
3. Amend the commit (if safe)

```bash
git add .
git commit --amend --no-edit
```

### Need to Undo

```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes (CAREFUL!)
git reset --hard HEAD~1
```

## Next Steps

- **Continue development**: Start next feature with `/plan`
- **Ready to ship**: Use `/ship` to merge to main
- **Push to remote**: `git push origin <branch>`
