---
description: Review code for XP/CD best practices and Clean Architecture
argument-hint: [file path or PR number]
---

# Code Review: XP/CD Best Practices Check

Review code against XP/CD principles, Clean Architecture, and testing standards.

## Input

$ARGUMENTS

(File path, directory, or PR number to review)

## Review Checklist

### 1. Clean Architecture Compliance

**Domain Layer**
- [ ] No external dependencies (no frameworks, no infrastructure)
- [ ] Business logic in entities and value objects
- [ ] Domain errors are domain-specific
- [ ] Interfaces defined for ports (repositories, services)

**Application Layer**
- [ ] Use cases have single responsibility
- [ ] No framework dependencies in use cases
- [ ] Result types for error handling
- [ ] Cross-cutting concerns via decorators (not in use case)

**Infrastructure Layer**
- [ ] Implements domain interfaces
- [ ] Handles technical concerns (DB, HTTP, etc.)
- [ ] Mappers for domain ↔ persistence conversion

**Presentation Layer**
- [ ] DTOs for request/response
- [ ] Controllers are thin (delegate to use cases)
- [ ] Mappers for domain ↔ HTTP conversion

### 2. Test Quality

**Test Coverage**
- [ ] Sociable unit tests for use cases
- [ ] Narrow integration tests for repositories
- [ ] Component tests for API endpoints
- [ ] Contract tests for external APIs

**Test Structure**
- [ ] Clear Arrange-Act-Assert pattern
- [ ] Descriptive test names
- [ ] One assertion concept per test
- [ ] Test data builders used

**Test Doubles**
- [ ] Stubs for boundaries (repositories, external services)
- [ ] Real objects for domain collaborators
- [ ] No mocks with behavior expectations (prefer stubs)
- [ ] `jest.fn()` used correctly

### 3. Code Quality

**SOLID Principles**
- [ ] Single Responsibility: Each class/function does one thing
- [ ] Open/Closed: Extended through composition, not modification
- [ ] Liskov Substitution: Subtypes are substitutable
- [ ] Interface Segregation: Small, focused interfaces
- [ ] Dependency Inversion: Depend on abstractions

**Naming**
- [ ] Classes: Nouns (`UserRepository`, `RegisterUserUseCase`)
- [ ] Methods: Verbs (`execute`, `findByEmail`, `validate`)
- [ ] Variables: Descriptive, no abbreviations
- [ ] Files: kebab-case (`register-user.use-case.ts`)

**Complexity**
- [ ] Methods under 20 lines
- [ ] Cyclomatic complexity reasonable
- [ ] No deep nesting (max 3 levels)
- [ ] Early returns for guard clauses

### 4. XP Values

**Simplicity**
- [ ] YAGNI: No unused code or speculative features
- [ ] No over-engineering
- [ ] Minimal dependencies

**Communication**
- [ ] Code is self-documenting
- [ ] Complex logic has comments explaining WHY
- [ ] API contracts are clear

**Feedback**
- [ ] Fast tests (unit tests < 100ms each)
- [ ] Good error messages
- [ ] Observable behavior

## Review Process

### Step 1: Understand Context
```bash
git log --oneline -10  # Recent commits
git diff main...HEAD   # Changes in this branch
```

### Step 2: Run Tests
```bash
npm test
```
All tests must pass before review.

### Step 3: Check Architecture
Review file locations:
- Domain code in `domain/`
- Use cases in `application/use-cases/`
- Infrastructure in `infrastructure/`
- Presentation in `presentation/`

### Step 4: Review Changes
For each file:
1. Does it belong in the right layer?
2. Does it follow the patterns for that layer?
3. Is it properly tested?

### Step 5: Document Findings

## Output Format

```
═══════════════════════════════════════════════════
CODE REVIEW: [scope]
═══════════════════════════════════════════════════

SUMMARY
───────
[Overall assessment]

ARCHITECTURE
────────────
✓ [What's good]
✗ [Issues found]

TESTS
─────
✓ [What's good]
✗ [Missing coverage or issues]

CODE QUALITY
────────────
✓ [What's good]
✗ [Issues found]

RECOMMENDATIONS
───────────────
Priority 1 (must fix):
- [Critical issues]

Priority 2 (should fix):
- [Important improvements]

Priority 3 (nice to have):
- [Minor suggestions]

═══════════════════════════════════════════════════
```

## Common Issues

### Architecture Violations

**Framework in Domain**
```typescript
// BAD: Prisma in domain
import { PrismaClient } from '@prisma/client';

// GOOD: Domain interface
interface UserRepository {
  save(user: User): Promise<void>;
}
```

**Business Logic in Controller**
```typescript
// BAD: Logic in controller
if (user.role === 'admin') { ... }

// GOOD: Logic in use case
const result = await checkAdminAccessUseCase.execute(userId);
```

### Test Issues

**Testing Implementation, Not Behavior**
```typescript
// BAD: Testing internal calls
expect(service.validate).toHaveBeenCalled();

// GOOD: Testing outcome
expect(result.isSuccess).toBe(true);
```

**Missing Test Layer**
```
If component test exists but no unit test:
→ Add sociable unit test for use case

If unit test exists but no integration test:
→ Add narrow integration test for repository
```

## Next Steps

After review:
- Fix Priority 1 issues before shipping
- Create tasks for Priority 2 items
- Consider Priority 3 for future refactoring
