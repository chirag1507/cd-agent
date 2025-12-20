# Infrastructure Services (Clean Architecture)

> Apply when implementing technical services like authentication, token generation, email, SMS, or external APIs.

## Purpose

Ensure technical infrastructure concerns remain in the infrastructure layer while keeping the application layer technology-agnostic through interfaces (Ports).

## Core Principle

**Technical services are NOT business rules. Use Port/Adapter pattern with dependency injection.**

## Non-Negotiable Rules

### 1. Infrastructure Services Belong in Infrastructure Layer

```typescript
// ❌ BAD: Technical implementation in use case
export class LoginUserUseCase {
  async execute(request: LoginUserRequest) {
    const token = jwt.sign({ userId }, SECRET, { expiresIn: '24h' }); // NO!
    return Result.ok({ user, token });
  }
}

// ✅ GOOD: Use case depends on interface
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService  // ← Interface
  ) {}

  async execute(request: LoginUserRequest) {
    const token = this.tokenService.generateToken(userId, email, role);
    return Result.ok({ user, token });
  }
}
```

### 2. Define Port (Interface) in Application Layer

```typescript
// src/features/<feature>/application/interfaces/token.service.ts
export interface TokenService {
  generateToken(userId: string, email: string, role: string): string;
  verifyToken(token: string): TokenPayload | null;
}
```

**Location**: `src/features/<feature>/application/interfaces/`

### 3. Implement Adapter in Infrastructure Layer

```typescript
// src/features/<feature>/infrastructure/services/jwt-token.service.ts
import jwt from 'jsonwebtoken';
import { TokenService } from '../../application/interfaces/token.service';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiryHours: number
  ) {}

  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, this.secret, {
      expiresIn: `${this.expiryHours}h`
    });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch {
      return null;
    }
  }
}
```

**Location**: `src/features/<feature>/infrastructure/services/`

### 4. Wire Up in Controller/Factory

```typescript
// src/features/<feature>/presentation/routes/<feature>.routes.ts
const tokenService = new JwtTokenService(process.env.JWT_SECRET!, 24);
const userRepository = new PrismaUserRepository(prisma);
const loginUseCase = new LoginUserUseCase(userRepository, tokenService);
const loginController = new LoginController(loginUseCase);
```

### 5. Testing Strategy

**Sociable Unit Tests (Use Case):**
- Stub the interface using `jest.fn()`
- Verify use case behavior with stubbed infrastructure service
- NO separate unit tests for infrastructure adapter

```typescript
describe('LoginUserUseCase', () => {
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('valid-token'),
      verifyToken: jest.fn(),
    };
    useCase = new LoginUserUseCase(userRepository, mockTokenService);
  });

  it('should return token when login succeeds', async () => {
    const result = await useCase.execute({ email, password });

    expect(result.getValue().token).toBe('valid-token');
    expect(mockTokenService.generateToken).toHaveBeenCalledTimes(1);
  });
});
```

**Component Tests:**
- Use REAL infrastructure service
- Test full vertical slice through HTTP

```typescript
describe('POST /auth/login', () => {
  const tokenService = new JwtTokenService('test-secret', 24);
  const app = createApp({ loginUseCase: new LoginUserUseCase(repo, tokenService) });

  it('should return valid JWT token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.token).toBeDefined();
    const decoded = jwt.verify(response.body.token, 'test-secret');
    expect(decoded.userId).toBeDefined();
  });
});
```

## When to Use Port/Adapter Pattern

Use this pattern for:
- Authentication/Authorization (tokens, sessions, API keys)
- Email/SMS services (SendGrid, Twilio, AWS SES)
- Payment gateways (Stripe, PayPal)
- File storage (S3, Azure Blob, local filesystem)
- External APIs (geocoding, weather, social media)
- Caching (Redis, Memcached, in-memory)
- Message queues (RabbitMQ, SQS, Kafka)

## When NOT to Use Decorator Pattern

❌ **Decorator is NOT for core dependencies:**

```typescript
// ❌ WRONG: Token generation is core business requirement
const decoratedUseCase = new TokenDecorator(loginUseCase);
```

✅ **Decorator IS for optional cross-cutting concerns:**

```typescript
// ✅ CORRECT: Logging/caching wrap existing behavior
const cachedUseCase = new CachingDecorator(getUserUseCase);
const loggedRepo = new LoggingDecorator(userRepository);
```

## Directory Structure

```
src/features/<feature>/
├── application/
│   ├── interfaces/              # Ports
│   │   ├── token.service.ts
│   │   └── email.service.ts
│   └── use-cases/
│       └── <use-case>/
│           └── <use-case>.use-case.ts  # Depends on interfaces
├── infrastructure/
│   └── services/                # Adapters
│       ├── jwt-token.service.ts
│       └── sendgrid-email.service.ts
└── presentation/
    └── routes/                  # Wires adapters to use cases
```

## Benefits

1. **Technology Independence**: Swap JWT → Paseto without changing use case
2. **Testability**: Stub interfaces in unit tests
3. **Clean Architecture**: Technical concerns stay in infrastructure layer
4. **Maintainability**: Single Responsibility - use case = business logic only
5. **Refactorability**: Change implementation without breaking tests

## File Naming

- **Interface (Port)**: `<service-name>.service.ts`
- **Implementation (Adapter)**: `<technology>-<service-name>.service.ts`

**Examples:**
- `token.service.ts` (interface)
- `jwt-token.service.ts` (JWT implementation)
- `email.service.ts` (interface)
- `sendgrid-email.service.ts` (SendGrid implementation)
