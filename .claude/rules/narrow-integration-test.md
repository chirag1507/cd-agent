# Narrow Integration Tests (Backend)

> Apply when testing infrastructure components like repositories against real dependencies.

## Purpose

Verify that infrastructure components correctly interact with real external dependencies (database, message queues, etc.) in a focused, narrow scope.

## Non-Negotiable Rules

### 1. Focused Integration

- Test ONE external dependency per test
- Narrow scope: single infrastructure class
- Example: `PrismaUserRepository` + real test database

### 2. Real Test Instances

- Use dedicated test database (NOT shared/production)
- Use real database operations
- Set `DATABASE_URL` to test database

```typescript
// Environment setup
process.env.DATABASE_URL = "postgresql://localhost:5432/test_db";
```

### 3. Data Isolation

- Clean state before EACH test
- Use `beforeEach` to clear relevant tables
- Tests must be independent and repeatable

### 4. Test the Implementation

- Target the CONCRETE implementation class
- NOT the domain interface
- Verify specific technology integration

## Test Structure

```typescript
describe("PrismaUserRepository - Narrow Integration Tests", () => {
  let userRepository: PrismaUserRepository;
  let prismaClient: PrismaClient;

  beforeAll(async () => {
    // Initialize Prisma client for test database
    prismaClient = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL }
      }
    });
    await prismaClient.$connect();
    userRepository = new PrismaUserRepository(prismaClient);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaClient.user.deleteMany({});
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  it("should save a user and retrieve them by email", async () => {
    // Arrange
    const email = Email.create("test@example.com").getValue();
    const password = Password.create("ValidPass123!").getValue();
    const user = User.create({ email, password }).getValue();

    // Act
    await userRepository.save(user);
    const foundUser = await userRepository.findByEmail(email.value);

    // Assert
    expect(foundUser).not.toBeNull();
    expect(foundUser!.id.equals(user.id)).toBe(true);
    expect(foundUser!.email.value).toBe(email.value);
  });

  it("should return null when finding non-existent user", async () => {
    // Arrange
    const email = "nonexistent@example.com";

    // Act
    const foundUser = await userRepository.findByEmail(email);

    // Assert
    expect(foundUser).toBeNull();
  });

  it("should update an existing user", async () => {
    // Arrange
    const user = new UserBuilder().withEmail("test@example.com").build();
    await userRepository.save(user);

    // Act
    user.verifyEmail();
    await userRepository.save(user);
    const updatedUser = await userRepository.findByEmail("test@example.com");

    // Assert
    expect(updatedUser!.isEmailVerified).toBe(true);
  });
});
```

## Contract Verification

Verify the component correctly:
- Serializes/deserializes data
- Forms correct queries
- Handles responses from external dependency
- Manages errors from external dependency

## What These Tests Are NOT

- **Not Unit Tests**: They connect to real dependencies
- **Not Component Tests**: They don't test full application flow
- **Not E2E Tests**: They focus on single infrastructure component

## Database Setup

```typescript
// jest.setup.integration.ts
import { execSync } from "child_process";

beforeAll(async () => {
  // Run migrations on test database
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL
    }
  });
});
```

## Using Test Data Builders

```typescript
it("should handle complex user creation", async () => {
  // Use builder for test data
  const user = new UserBuilder()
    .withEmail("test@example.com")
    .withRole("admin")
    .build();

  await userRepository.save(user);
  const found = await userRepository.findByEmail("test@example.com");

  expect(found!.role).toBe("admin");
});
```

## File Naming

`<implementation-name>.integration.test.ts`

Example: `prisma-user.repository.integration.test.ts`

## Location

`src/modules/<module>/infrastructure/persistence/__tests__/`
