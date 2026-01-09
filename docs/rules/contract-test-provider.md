# Provider Contract Tests (Backend)

> Apply when verifying consumer contracts in backend applications.

## Purpose

Honor consumer contracts by verifying the provider can fulfill all consumer expectations.

## Working with Pre-Existing Frontend

**IMPORTANT: Three scenarios when frontend already exists:**

### Scenario A: Frontend Has Pact Contracts (Built with Agent or Pact-Aware)

**Situation**: Frontend team already uses Pact and has consumer contracts.

**Check**: `docs/frontend-reference/contracts/pact/` or contracts in Pact Broker

**Workflow**:
1. **Import contracts** (if only local files):
   ```bash
   pact-broker publish \
     docs/frontend-reference/contracts/pact/*.json \
     --consumer-app-version=frontend-v1.0.0 \
     --tag=main \
     --broker-base-url=$PACT_BROKER_URL \
     --broker-token=$PACT_BROKER_TOKEN
   ```

2. **Implement backend provider** using TDD to satisfy contracts
3. **Verify provider** (fetch from broker)
4. **Publish verification results**

### Scenario B: Frontend Exists Without Pact (Under Our Control)

**Situation**: Working frontend built without agent, no Pact contracts exist, but **we control the frontend codebase**.

**Check for**:
- API request/response examples in code or docs
- OpenAPI/Swagger specs (if available)
- Network traces/Postman collections

**Workflow - Retrofit Pact Consumer Tests in Frontend First**:

**Step 1: Generate Consumer Contracts from Existing Frontend**

Go to the frontend project and add Pact consumer tests:

```bash
cd frontend-project
pnpm add -D @pact-foundation/pact@latest
```

**Step 2: Write Pact Consumer Tests for Existing API Calls**

For each API endpoint the frontend currently uses, create a Pact consumer test:

```typescript
// frontend-project/src/api/__tests__/user-api.pact.test.ts
import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/dsl/matchers';
import { UserApiClient } from '../user-api-client';

describe('User API Pact Tests', () => {
  const provider = new Pact({
    consumer: 'frontend-app',
    provider: 'backend-api',
    port: 1234,
    dir: path.resolve(process.cwd(), 'pacts'),
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // Document existing GET /api/users/:id endpoint
  it('should get user by ID', async () => {
    await provider.addInteraction({
      state: 'a user with ID 123 exists',
      uponReceiving: 'a request to get user by ID',
      withRequest: {
        method: 'GET',
        path: '/api/users/123',
        headers: { Accept: 'application/json' }
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: '123',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user'
        })
      }
    });

    const apiClient = new UserApiClient('http://localhost:1234');
    const user = await apiClient.getUserById('123');
    expect(user.id).toBe('123');
  });

  // Document existing POST /api/users endpoint
  it('should create new user', async () => {
    await provider.addInteraction({
      state: 'the API is available',
      uponReceiving: 'a request to create user',
      withRequest: {
        method: 'POST',
        path: '/api/users',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'new@example.com',
          password: 'ValidPass123!',
          name: 'New User'
        }
      },
      willRespondWith: {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: '456',
          email: 'new@example.com',
          name: 'New User',
          createdAt: '2024-01-01T00:00:00Z'
        })
      }
    });

    const apiClient = new UserApiClient('http://localhost:1234');
    const user = await apiClient.createUser({
      email: 'new@example.com',
      password: 'ValidPass123!',
      name: 'New User'
    });
    expect(user.id).toBeDefined();
  });
});
```

**Step 3: Run Consumer Tests to Generate Pact Files**

```bash
cd frontend-project
npm run test:contract  # Generates pact/*.json files
```

**Step 4: Publish Contracts to Pact Broker**

```bash
pact-broker publish \
  ./pacts \
  --consumer-app-version=$(git rev-parse HEAD) \
  --tag=main \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

**Step 5: Copy Contracts to Backend Reference**

```bash
cp frontend-project/pacts/*.json backend-project/docs/frontend-reference/contracts/pact/
```

**Step 6: Build Backend Provider**

Now in backend project, implement provider using TDD:

1. Review contracts in `docs/frontend-reference/contracts/pact/`
2. Implement provider to satisfy contract expectations
3. Run provider verification tests (fetch from broker)
4. Publish verification results

**Step 7: Integrate into CI/CD**

- **Frontend CI**: Publish consumer contracts on main branch push
- **Backend CI**: Verify provider (webhook-triggered on contract changes)
- **Deployment gate**: Use `can-i-deploy` before releases

### Scenario C: Frontend Not Under Our Control (Third-Party)

**Situation**: External team, no Pact contracts, only API documentation.

**Workflow**:
1. Use API specs to create provider tests manually
2. Implement backend to specification
3. Manual integration testing
4. Recommend Pact to external team for future collaboration

### Contract-First Development Benefits

- Backend guided by **real** consumer needs (not assumptions)
- Prevents breaking existing frontend
- Parallel development possible
- Clear API specification before implementation
- Integration issues caught early

## Non-Negotiable Rules

### 1. Fetch Contracts from Pact Broker Only

- No manual contract file sharing (except initial import)
- Broker is single source of truth after initial setup
- CI automatically fetches latest contracts

### 2. State Handlers Are Critical

State handlers prepare the system for specific scenarios:

```typescript
const stateHandlers = {
  "a user with ID 123 exists": async () => {
    // Mock repository to return expected user
    mockUserRepository.findById.mockResolvedValue(
      new UserBuilder().withId("123").build()
    );
  },

  "no user with ID 999 exists": async () => {
    mockUserRepository.findById.mockResolvedValue(null);
  },

  "the API is available": async () => {
    // Default state, no special setup needed
  }
};
```

### 3. Black-Box Verification

- Treat running service as black box
- Start server, set state, verify response
- NO knowledge of internal business logic

### 4. Isolate External Services

- Mock all external third-party services
- Email, payment, SMS = STUBBED
- Internal infrastructure = can be real or mocked

### 5. CI is a Hard Gate

- Contract verification MUST be in CI pipeline
- Failure = breaking consumer contract
- Pipeline MUST stop on failure

### 6. Use `can-i-deploy` Before Release

```bash
pact-broker can-i-deploy \
  --pacticipant api-service \
  --version $GIT_SHA \
  --to-environment production
```

## Test Structure

```typescript
import { Verifier } from "@pact-foundation/pact";
import { createApp } from "../app";

describe("Provider Contract Verification", () => {
  let app: Express;
  let server: Server;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeAll(async () => {
    // Create mock dependencies
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    mockEmailService = {
      sendConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    // Create app with test dependencies
    const useCase = new GetUserUseCase(mockUserRepository);
    app = createApp({ getUserUseCase: useCase });
    server = app.listen(3001);
  });

  afterAll(async () => {
    server.close();
  });

  it("should verify consumer contracts", async () => {
    const verifier = new Verifier({
      providerBaseUrl: "http://localhost:3001",
      provider: "api-service",
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: process.env.CI === "true",
      providerVersion: process.env.GIT_SHA,
      consumerVersionSelectors: [
        { mainBranch: true },
        { deployedOrReleased: true }
      ],
      stateHandlers: {
        "a user with ID 123 exists": async () => {
          mockUserRepository.findById.mockResolvedValue(
            new UserBuilder()
              .withId("123")
              .withEmail("user@example.com")
              .withName("John Doe")
              .build()
          );
        },

        "no user with ID 999 exists": async () => {
          mockUserRepository.findById.mockResolvedValue(null);
        },

        "users exist in the system": async () => {
          mockUserRepository.findAll.mockResolvedValue({
            items: [
              new UserBuilder().withId("1").build(),
              new UserBuilder().withId("2").build(),
            ],
            pagination: { page: 1, limit: 10, total: 25 }
          });
        },

        "the API is available": async () => {
          // Default state - no special setup
        }
      }
    });

    await verifier.verifyProvider();
  });
});
```

## Automated Workflow

### Path A: Consumer Changes Contract

1. Consumer publishes new contract to Broker
2. Webhook triggers provider CI
3. Provider fetches specific changed contract
4. Verification runs against that contract
5. Results published back to Broker

### Path B: Provider Changes Code

1. Developer pushes code changes
2. CI runs commit stage
3. Fetch latest contracts from Broker (tagged `main`)
4. Verify provider against all contracts
5. Failure = breaking change for consumer

## State Handler Patterns

### Database State

```typescript
"a user with specific data exists": async () => {
  mockRepository.findById.mockResolvedValue(
    new UserBuilder()
      .withId("specific-id")
      .withEmail("specific@example.com")
      .build()
  );
}
```

### Error States

```typescript
"the database is unavailable": async () => {
  mockRepository.findById.mockRejectedValue(
    new DatabaseConnectionError("Connection failed")
  );
}
```

### Empty States

```typescript
"no users exist": async () => {
  mockRepository.findAll.mockResolvedValue({
    items: [],
    pagination: { page: 1, limit: 10, total: 0 }
  });
}
```

## CI Pipeline Integration

```yaml
# .github/workflows/commit-stage.yml
jobs:
  contract-verification:
    runs-on: ubuntu-latest
    steps:
      - name: Run Provider Contract Verification
        run: npm run test:contract:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_SHA: ${{ github.sha }}
          CI: true
```

## Release Gate

```yaml
# .github/workflows/release.yml
jobs:
  can-i-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Check if safe to deploy
        run: |
          pact-broker can-i-deploy \
            --pacticipant api-service \
            --version ${{ github.sha }} \
            --to-environment ${{ inputs.environment }}
```

## File Naming

`provider-contract.test.ts`

## Location

`src/__tests__/contract/`
