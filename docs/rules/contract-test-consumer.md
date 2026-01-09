# Consumer Contract Tests (Frontend)

> Apply when writing Pact contract tests for API clients in frontend applications.

## Purpose

Define consumer expectations for provider APIs, enabling independent deployment with confidence.

## Non-Negotiable Rules

### 1. Every API Client Must Have Contracts

- No exceptions
- Contract tests are unit tests for API client code
- Live alongside the code they test

### 2. Define Expectations Explicitly

```typescript
await provider.addInteraction({
  state: "a user with ID 123 exists",        // Provider state
  uponReceiving: "a request to get user",    // Description
  withRequest: {
    method: "GET",
    path: "/api/users/123",
    headers: { Accept: "application/json" }
  },
  willRespondWith: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: like({
      id: "123",
      email: "user@example.com",
      name: "John Doe"
    })
  }
});
```

### 3. Use Matchers for Flexibility

```typescript
import { like, eachLike, regex } from "@pact-foundation/pact/dsl/matchers";

// Match type/shape, not exact values
body: like({
  id: "123",                    // String type
  createdAt: "2024-01-01",     // String type
  items: eachLike({            // Array with at least one item
    id: "item-1",
    name: "Sample"
  })
})

// Regex for patterns
body: {
  email: regex(/^[\w.]+@[\w.]+\.\w+$/, "test@example.com")
}
```

### 4. Do NOT Commit Pact Files

- `/pacts` directory in `.gitignore`
- Pact files are build artifacts
- Generated and published by CI

### 5. Test Locally Before Push

```bash
npm run test:contract  # Generate pact files
```

## Test Structure

```typescript
import { Pact } from "@pact-foundation/pact";
import { like, eachLike } from "@pact-foundation/pact/dsl/matchers";
import { UserRepositoryImpl } from "../UserRepository";

describe("UserRepository Contract Tests", () => {
  const provider = new Pact({
    consumer: "frontend-app",
    provider: "api-service",
    port: 1234,
    dir: path.resolve(process.cwd(), "pacts"),
  });

  const MOCK_SERVER_URL = "http://localhost:1234";

  beforeAll(async () => {
    await provider.setup();
  });

  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe("getUser", () => {
    it("should retrieve an existing user", async () => {
      // Arrange
      await provider.addInteraction({
        state: "a user with ID 123 exists",
        uponReceiving: "a request to get user by ID",
        withRequest: {
          method: "GET",
          path: "/api/users/123",
          headers: { Accept: "application/json" }
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: like({
            id: "123",
            email: "user@example.com",
            name: "John Doe"
          })
        }
      });

      // Act
      const httpClient = new FetchHttpClient(MOCK_SERVER_URL);
      const repository = new UserRepositoryImpl(httpClient);
      const user = await repository.getById("123");

      // Assert
      expect(user.id).toBe("123");
      expect(user.email).toBeDefined();
    });

    it("should handle user not found", async () => {
      // Arrange
      await provider.addInteraction({
        state: "no user with ID 999 exists",
        uponReceiving: "a request for non-existent user",
        withRequest: {
          method: "GET",
          path: "/api/users/999",
          headers: { Accept: "application/json" }
        },
        willRespondWith: {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: like({
            error: "User not found"
          })
        }
      });

      // Act & Assert
      const httpClient = new FetchHttpClient(MOCK_SERVER_URL);
      const repository = new UserRepositoryImpl(httpClient);
      await expect(repository.getById("999")).rejects.toThrow("not found");
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      // Arrange
      const newUser = { email: "new@example.com", name: "New User" };

      await provider.addInteraction({
        state: "the API is available",
        uponReceiving: "a request to create a user",
        withRequest: {
          method: "POST",
          path: "/api/users",
          headers: { "Content-Type": "application/json" },
          body: newUser
        },
        willRespondWith: {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: like({
            id: "new-id",
            email: "new@example.com",
            name: "New User",
            createdAt: "2024-01-01T00:00:00Z"
          })
        }
      });

      // Act
      const httpClient = new FetchHttpClient(MOCK_SERVER_URL);
      const repository = new UserRepositoryImpl(httpClient);
      const created = await repository.create(newUser);

      // Assert
      expect(created.id).toBeDefined();
      expect(created.email).toBe("new@example.com");
    });
  });

  describe("listUsers", () => {
    it("should return paginated list", async () => {
      // Arrange
      await provider.addInteraction({
        state: "users exist in the system",
        uponReceiving: "a request to list users",
        withRequest: {
          method: "GET",
          path: "/api/users",
          query: { page: "1", limit: "10" },
          headers: { Accept: "application/json" }
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: like({
            items: eachLike({
              id: "123",
              email: "user@example.com",
              name: "John Doe"
            }),
            pagination: like({
              page: 1,
              limit: 10,
              total: 25
            })
          })
        }
      });

      // Act
      const httpClient = new FetchHttpClient(MOCK_SERVER_URL);
      const repository = new UserRepositoryImpl(httpClient);
      const result = await repository.list({ page: 1, limit: 10 });

      // Assert
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination.page).toBe(1);
    });
  });
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "test:contract": "jest --testPathPattern=pact",
    "publish:pacts": "pact-broker publish ./pacts --consumer-app-version=$GIT_SHA --tag=$BRANCH"
  }
}
```

## Communication

- While pipeline provides technical feedback, communicate breaking changes to provider team as professional courtesy
- Pipeline is safety net, not substitute for collaboration

## File Naming

`<RepositoryName>.pact.test.ts`

Example: `UserRepository.pact.test.ts`

## Location

`src/features/<feature>/repositories/__tests__/`
