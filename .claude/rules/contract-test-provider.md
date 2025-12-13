# Provider Contract Tests (Backend)

> Apply when verifying consumer contracts in backend applications.

## Purpose

Honor consumer contracts by verifying the provider can fulfill all consumer expectations.

## Non-Negotiable Rules

### 1. Fetch Contracts from Pact Broker Only

- No manual contract file sharing
- Broker is single source of truth
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
