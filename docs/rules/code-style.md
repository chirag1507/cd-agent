# Code Style and Comments

> Apply to ALL code generation - backend, frontend, tests, acceptance tests.

## Purpose

Maintain clean, self-documenting code that prioritizes clarity through naming over comments.

## Non-Negotiable Rules

### 1. NO "WHAT" Comments

**NEVER add comments that describe what the code does.**

```typescript
// ❌ BAD: "WHAT" comments
// Create a new user
const user = new User(email, password);

// Save user to database
await repository.save(user);

// Send confirmation email
await emailService.send(user.email);

// ✅ GOOD: Self-explanatory code, no comments needed
const user = new User(email, password);
await repository.save(user);
await emailService.sendConfirmation(user.email);
```

### 2. Only "WHY" Comments for Non-Obvious Logic

Add comments ONLY when:
- Business rules are complex or counterintuitive
- Technical decisions require explanation
- Workarounds for bugs or limitations
- Performance optimizations that aren't obvious

```typescript
// ✅ GOOD: "WHY" comment for business rule
// We must verify email before allowing login to comply with GDPR requirements
if (!user.isEmailVerified) {
  throw new EmailNotVerifiedError();
}

// ✅ GOOD: "WHY" comment for technical decision
// Using Promise.all here instead of sequential awaits reduces
// total execution time from 3s to 1s for typical workloads
const [userData, projectData, teamData] = await Promise.all([
  fetchUser(userId),
  fetchProjects(userId),
  fetchTeam(userId)
]);

// ✅ GOOD: "WHY" comment for workaround
// Prisma doesn't support composite unique constraints in this version,
// so we manually check for duplicates before inserting
const existing = await this.prisma.user.findFirst({
  where: { email, organizationId }
});
if (existing) throw new DuplicateUserError();
```

### 3. Code Should Be Self-Documenting

**Use clear, descriptive names instead of comments:**

```typescript
// ❌ BAD: Cryptic names requiring comments
// Check if user can access resource
const canAccess = u.r.includes(res.id) || u.id === res.ownerId;

// ✅ GOOD: Self-explanatory names
const canAccess =
  user.roles.includes(resource.id) ||
  user.id === resource.ownerId;

// ❌ BAD: Unclear function requiring comment
// Processes the order and returns status
function proc(o: Order): boolean { ... }

// ✅ GOOD: Clear function name
function processOrderAndReturnSuccess(order: Order): boolean { ... }
```

### 4. Remove Section Comments in Drivers/Services

**AVOID section divider comments:**

```typescript
// ❌ BAD: Section comments
export class AccountWebDriver {
  // ============================================
  // ACTIONS (Use PRODUCTION routes)
  // ============================================
  async registerUser(data: RegistrationData): Promise<void> {
    await this.registrationPage.fillRegistrationForm(data);
  }

  // ============================================
  // SETUP (Use BACK-DOOR for efficiency)
  // ============================================
  async createExistingUser(email: string): Promise<void> {
    await this.userService.registerAndTrackUser({ email });
  }
}

// ✅ GOOD: Group by blank lines, let method names speak
export class AccountWebDriver {
  // Actions - production routes
  async registerUser(data: RegistrationData): Promise<void> {
    await this.registrationPage.fillRegistrationForm(data);
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginPage.login(email, password);
  }

  // Setup - back-door routes
  async createExistingUser(email: string): Promise<void> {
    await this.userService.registerAndTrackUser({ email });
  }

  async validateUserIsNotRegistered(email: string): Promise<void> {
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users/${email}`);
    if (response.status() !== 404) {
      throw new Error(`User already exists`);
    }
  }
}
```

**Even better - use separate classes for different concerns:**

```typescript
// ✅ BEST: Separate classes, no section comments needed
export class ProductionAccountActions implements AccountActions {
  async registerUser(data: RegistrationData): Promise<void> {
    await this.registrationPage.fillRegistrationForm(data);
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginPage.login(email, password);
  }
}

export class TestSupportAccountActions implements TestSupportActions {
  async createExistingUser(email: string): Promise<void> {
    await this.userService.registerAndTrackUser({ email });
  }

  async validateUserIsNotRegistered(email: string): Promise<void> {
    const response = await this.page.request.get(`${CONFIG.apiUrl}/users/${email}`);
    if (response.status() !== 404) {
      throw new Error(`User already exists`);
    }
  }
}
```

## Acceptable Documentation

### JSDoc for Public APIs (Optional)

```typescript
/**
 * Registers a new user with the provided credentials.
 *
 * @throws UserAlreadyExistsError if email is already registered
 * @throws InvalidEmailError if email format is invalid
 */
export class RegisterUserUseCase {
  async execute(request: RegisterUserRequest): Promise<Result<User, DomainError>> {
    // Implementation
  }
}
```

### Interface/Type Documentation (Optional)

```typescript
/**
 * Configuration for the authentication system.
 */
export interface AuthConfig {
  /** JWT secret key for signing tokens */
  jwtSecret: string;
  /** Token expiration time in seconds */
  tokenExpirySeconds: number;
}
```

### README/Architectural Documentation

- High-level system architecture
- Setup and installation instructions
- Deployment procedures
- API documentation (if public API)

## Anti-Patterns to Avoid

```typescript
// ❌ Commented-out code (use version control instead)
// const oldImplementation = () => { ... }

// ❌ Obvious comments
// Increment counter
counter++;

// ❌ Changelog comments (use git history)
// 2024-01-15: Added validation
// 2024-01-20: Fixed bug with null values

// ❌ Author comments (use git blame)
// Author: John Doe
// Date: 2024-01-15

// ❌ TODO comments without context
// TODO: fix this

// ✅ Actionable TODO with ticket reference (if absolutely needed)
// TODO(JIRA-123): Refactor to use new UserRepository interface after Q2 migration
```

## Summary

**Write code that explains itself. Comments should explain WHY, never WHAT.**

If you find yourself writing a "WHAT" comment, refactor the code to be clearer instead.
