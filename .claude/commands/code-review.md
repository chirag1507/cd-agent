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

**Infrastructure Layer** (see [infrastructure-services.md](../rules/infrastructure-services.md))
- [ ] Implements domain interfaces
- [ ] Handles technical concerns (DB, HTTP, etc.)
- [ ] Mappers for domain ↔ persistence conversion
- [ ] Technical services use Port/Adapter pattern (tokens, email, SMS, payments)

**Presentation Layer** (see [controller-pattern-be.md](../rules/controller-pattern-be.md))
- [ ] DTOs for request/response
- [ ] Controllers are thin (delegate to use cases)
- [ ] Controllers use HttpRequest/HttpResponse wrappers
- [ ] Error mapping uses `instanceof` (not string matching)
- [ ] Semantic HTTP methods (created, ok, conflict, badRequest, etc.)
- [ ] Controllers only validate required fields (domain validation in use case)
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

### 5. Pattern Consistency

**Controller Pattern** (Backend)
- [ ] All routes use HttpRequest.fromExpress() / HttpResponse.fromExpress()
- [ ] All controllers use semantic HTTP methods (created, ok, badRequest, etc.)
- [ ] Error mapping uses instanceof (not string matching)
- [ ] No direct res.status() calls in controllers

**Port/Adapter Pattern**
- [ ] Use cases depend on interfaces (ports), not concrete implementations
- [ ] Infrastructure implements all required interfaces (adapters)
- [ ] No business logic in infrastructure adapters

**Component Hierarchy** (Frontend - if using Atomic Design)
- [ ] Components placed in correct atomic level (atoms/molecules/organisms/templates)
- [ ] No atoms importing from molecules/organisms
- [ ] Feature components in features/<feature>/components/

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

### Step 4.5: Pattern Consistency Checks

Run automated consistency checks:

```bash
# Backend: Check for old HTTP wrapper pattern
echo "🔍 Checking HTTP wrapper usage..."
OLD_HTTP_REQUEST=$(git grep -n "new HttpRequest(req)" src/ 2>/dev/null | grep -v "fromExpress" || true)
OLD_HTTP_RESPONSE=$(git grep -n "new HttpResponse(res)" src/ 2>/dev/null | grep -v "fromExpress" || true)

if [ ! -z "$OLD_HTTP_REQUEST" ] || [ ! -z "$OLD_HTTP_RESPONSE" ]; then
  echo "❌ Found old HTTP wrapper pattern:"
  [ ! -z "$OLD_HTTP_REQUEST" ] && echo "$OLD_HTTP_REQUEST"
  [ ! -z "$OLD_HTTP_RESPONSE" ] && echo "$OLD_HTTP_RESPONSE"
  echo "   Fix: Use HttpRequest.fromExpress(req) / HttpResponse.fromExpress(res)"
fi

# Backend: Check for manual status codes (should use semantic methods)
echo "🔍 Checking for manual status codes..."
MANUAL_STATUS=$(git grep -n "\.status(" src/ | grep -v "test\|spec\|expect\|mockResolvedValue" || true)

if [ ! -z "$MANUAL_STATUS" ]; then
  echo "⚠️  Found manual status codes:"
  echo "$MANUAL_STATUS"
  echo "   Fix: Use httpResponse.ok/created/badRequest/unauthorized/etc."
fi

# Backend: Check for instanceof error handling
echo "🔍 Checking error handling pattern..."
ERROR_STRINGS=$(git grep -n "error\.message\.includes\|error\.message\.contains" src/ | grep -v test || true)

if [ ! -z "$ERROR_STRINGS" ]; then
  echo "❌ Found string-based error detection:"
  echo "$ERROR_STRINGS"
  echo "   Fix: Use 'error instanceof SpecificError' instead"
fi

# Frontend: Check for wrong atomic levels (atoms importing molecules)
echo "🔍 Checking atomic design hierarchy..."
ATOM_VIOLATIONS=$(git grep -l "from.*molecules\|from.*organisms" src/shared/components/atoms/ 2>/dev/null || true)

if [ ! -z "$ATOM_VIOLATIONS" ]; then
  echo "❌ Atoms importing from higher levels:"
  echo "$ATOM_VIOLATIONS"
  echo "   Fix: Atoms should only import from other atoms or primitives"
fi

echo "✅ Pattern consistency checks complete"
```

**If violations found:**
- Document in review under "PATTERN VIOLATIONS" section
- Add to Priority 1 (must fix) if breaking architectural rules
- Add to Priority 2 (should fix) if inconsistency with new patterns

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

**String-Based Error Detection**
```typescript
// BAD: String matching for errors
if (error.message.includes('already exists')) {
  res.status(409).json({ error });
}

// GOOD: Type-safe instanceof
if (error instanceof UserAlreadyExistsError) {
  httpResponse.conflict({ error: error.message });
}
```

**Manual Status Codes**
```typescript
// BAD: Manual status codes
res.status(201).json(data);
res.status(409).json(error);

// GOOD: Semantic HTTP methods
httpResponse.created(data);
httpResponse.conflict(error);
```

### Pattern Violations

**Old HTTP Wrapper Usage**
```typescript
// BAD: Direct instantiation (old pattern)
const httpRequest = new HttpRequest(req);
const httpResponse = new HttpResponse(res);

// GOOD: Static factory method (new pattern)
const httpRequest = HttpRequest.fromExpress(req);
const httpResponse = HttpResponse.fromExpress(res);
```

**Atomic Design Violations**
```typescript
// BAD: Atom importing from Molecule
// src/shared/components/atoms/Button/Button.tsx
import { SearchBar } from '../../molecules/SearchBar';

// GOOD: Atom importing from Atom
// src/shared/components/atoms/Button/Button.tsx
import { Icon } from '../../atoms/Icon';
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
