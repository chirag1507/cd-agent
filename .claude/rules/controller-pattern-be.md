# Controller Pattern (Backend)

> **Trigger**: Creating or modifying backend controllers, use cases, or HTTP request handlers

## Purpose

Establish a clean, testable controller pattern that separates HTTP concerns from business logic while maintaining type safety and semantic clarity.

## Core Principle

Controllers are thin HTTP adapters that:
1. Receive HTTP requests via HttpRequest wrapper
2. Delegate business logic to Use Cases
3. Map domain errors to HTTP status codes using `instanceof`
4. Return responses via HttpResponse semantic methods

Use Cases handle business logic and return domain-specific errors via Result pattern.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROUTE LAYER                              │
│  - Wraps Express req/res with HttpRequest/HttpResponse          │
│  - Calls controller.handle(httpRequest, httpResponse)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                            │
│  - Implements Controller interface                              │
│  - Validates required fields only                               │
│  - Calls use case                                               │
│  - Maps domain errors to HTTP status (instanceof)               │
│  - Uses httpResponse.created(), conflict(), badRequest(), etc.  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       USE CASE LAYER                             │
│  - Executes business logic                                      │
│  - Validates domain rules                                       │
│  - Returns Result.ok(data) or Result.fail(DomainError)          │
│  - Throws specific domain errors (UserAlreadyExistsError, etc.) │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                               │
│  - Domain error classes (errors/)                               │
│  - Business entities and value objects                          │
└─────────────────────────────────────────────────────────────────┘
```

## Non-Negotiable Rules

### 1. Use HttpResponse Semantic Methods

```typescript
// ✅ GOOD - Semantic, self-documenting
httpResponse.created(data);        // 201
httpResponse.ok(data);             // 200
httpResponse.badRequest(error);    // 400
httpResponse.unauthorized(error);  // 401
httpResponse.conflict(error);      // 409
httpResponse.serverError(error);   // 500

// ❌ BAD - Manual status codes
res.status(201).json(data);
res.status(400).json(error);
res.status(409).json(error);
```

### 2. Use Cases MUST Return Domain Errors

```typescript
// ✅ GOOD - Specific domain errors
export class RegisterUserUseCase {
  async execute(dto: RegisterUserDto): Promise<Result<User, Error>> {
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) {
      return Result.fail(new InvalidEmailError(emailResult.getError().message));
    }

    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      return Result.fail(new UserAlreadyExistsError(email.value));
    }

    return Result.ok(user);
  }
}

// ❌ BAD - Generic errors
export class RegisterUserUseCase {
  async execute(dto: RegisterUserDto): Promise<Result<User, Error>> {
    if (existingUser) {
      return Result.fail(new Error('User already exists')); // NO! Use domain error
    }
  }
}
```

### 3. Controllers MUST Use instanceof for Error Mapping

```typescript
// ✅ GOOD - Type-safe instanceof checks
const error = result.getError();

if (error instanceof UserAlreadyExistsError) {
  httpResponse.conflict({ error: error.message });
  return;
}

if (error instanceof InvalidEmailError) {
  httpResponse.badRequest({ error: error.message });
  return;
}

if (error instanceof ValidationError) {
  httpResponse.badRequest({ error: error.message });
  return;
}

// ❌ BAD - String matching (brittle)
const errorMessage = result.getError().message;

if (errorMessage.includes('already exists')) {  // NO! Use instanceof
  httpResponse.conflict({ error: errorMessage });
  return;
}
```

### 4. Validation Logic Belongs in Use Case

```typescript
// ✅ GOOD - Controller only checks required fields
export class RegisterController implements Controller {
  async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void> {
    const { email, password, name } = httpRequest.body;

    if (!email || !password || !name) {
      httpResponse.badRequest({ error: 'Missing required fields' });
      return;
    }

    const result = await this.registerUserUseCase.execute({ email, password, name });
  }
}

// ❌ BAD - Validation in controller
export class RegisterController implements Controller {
  async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void> {
    const { email, password, name } = httpRequest.body;

    // NO! Domain validation belongs in use case
    const emailResult = Email.create(email);
    if (emailResult.isFailure) {
      httpResponse.badRequest({ error: emailResult.getError().message });
      return;
    }
  }
}
```

## Directory Structure

```
src/
├── shared/
│   └── presentation/
│       └── http/
│           ├── controller.ts              # Controller interface
│           ├── http-request.ts            # HttpRequest wrapper
│           ├── http-response.ts           # HttpResponse helper
│           └── index.ts
│
└── features/
    └── <feature>/
        ├── domain/
        │   └── errors/
        │       ├── <feature>.error.ts     # Domain error classes
        │       └── index.ts
        ├── application/
        │   └── use-cases/
        │       └── <use-case>/
        │           └── <use-case>.use-case.ts
        └── presentation/
            ├── controllers/
            │   └── <action>.controller.ts
            └── routes/
                └── <feature>.routes.ts
```

## Complete Implementation Example

### 1. Domain Error Classes

```typescript
// features/authentication/domain/errors/authentication.error.ts
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 2. Use Case with Domain Errors

```typescript
// features/authentication/application/use-cases/register-user/register-user.use-case.ts
import { Result } from '@/shared/types/result';
import { User } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/interfaces/user.repository';
import {
  UserAlreadyExistsError,
  InvalidEmailError,
  InvalidPasswordError,
  ValidationError,
} from '../../../domain/errors';

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: RegisterUserDto): Promise<Result<User, Error>> {
    const emailResult = Email.create(dto.email);
    if (emailResult.isFailure) {
      return Result.fail(new InvalidEmailError(emailResult.getError().message));
    }

    const passwordResult = Password.create(dto.password);
    if (passwordResult.isFailure) {
      return Result.fail(new InvalidPasswordError(passwordResult.getError().message));
    }

    const email = emailResult.getValue();
    const password = passwordResult.getValue();

    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      return Result.fail(new UserAlreadyExistsError(email.value));
    }

    const userResult = User.create({
      email,
      password,
      name: dto.name,
    });

    if (userResult.isFailure) {
      return Result.fail(new ValidationError(userResult.getError().message));
    }

    const user = userResult.getValue();
    await this.userRepository.save(user);

    return Result.ok(user);
  }
}
```

### 3. Controller with Error Mapping

```typescript
// features/authentication/presentation/controllers/register.controller.ts
import { Controller, HttpRequest, HttpResponse } from '@/shared/presentation/http';
import { RegisterUserUseCase } from '../../application/use-cases/register-user/register-user.use-case';
import {
  UserAlreadyExistsError,
  InvalidEmailError,
  InvalidPasswordError,
  ValidationError,
} from '../../domain/errors';

export class RegisterController implements Controller {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void> {
    const { email, password, name } = httpRequest.body;

    if (!email || !password || !name) {
      httpResponse.badRequest({ error: 'Missing required fields: email, password, name' });
      return;
    }

    const result = await this.registerUserUseCase.execute({ email, password, name });

    if (result.isSuccess) {
      const user = result.getValue();
      httpResponse.created({
        id: user.id.value,
        email: user.email.value,
        name: user.name,
      });
      return;
    }

    const error = result.getError();

    if (error instanceof UserAlreadyExistsError) {
      httpResponse.conflict({ error: error.message });
      return;
    }

    if (error instanceof InvalidEmailError || error instanceof InvalidPasswordError) {
      httpResponse.badRequest({ error: error.message });
      return;
    }

    if (error instanceof ValidationError) {
      httpResponse.badRequest({ error: error.message });
      return;
    }

    httpResponse.serverError({ error: 'An unexpected error occurred' });
  }
}
```

### 4. HTTP Wrappers

```typescript
// shared/presentation/http/controller.ts
export interface Controller {
  handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void>;
}

// shared/presentation/http/http-request.ts
export class HttpRequest {
  constructor(
    public readonly body: any,
    public readonly query: any,
    public readonly params: any,
    public readonly headers: any
  ) {}

  static fromExpress(req: Request): HttpRequest {
    return new HttpRequest(req.body, req.query, req.params, req.headers);
  }
}

// shared/presentation/http/http-response.ts
import { Response } from 'express';

export class HttpResponse {
  constructor(private readonly res: Response) {}

  ok(data: any): void {
    this.res.status(200).json(data);
  }

  created(data: any): void {
    this.res.status(201).json(data);
  }

  badRequest(error: any): void {
    this.res.status(400).json(error);
  }

  unauthorized(error: any): void {
    this.res.status(401).json(error);
  }

  forbidden(error: any): void {
    this.res.status(403).json(error);
  }

  notFound(error: any): void {
    this.res.status(404).json(error);
  }

  conflict(error: any): void {
    this.res.status(409).json(error);
  }

  serverError(error: any): void {
    this.res.status(500).json(error);
  }

  static fromExpress(res: Response): HttpResponse {
    return new HttpResponse(res);
  }
}
```

### 5. Route with Wrappers

```typescript
// features/authentication/presentation/routes/authentication.routes.ts
import { Router } from 'express';
import { RegisterController } from '../controllers/register.controller';
import { HttpRequest, HttpResponse } from '@/shared/presentation/http';

export const createAuthenticationRoutes = (registerController: RegisterController): Router => {
  const router = Router();

  router.post('/register', async (req, res) => {
    const httpRequest = HttpRequest.fromExpress(req);
    const httpResponse = HttpResponse.fromExpress(res);

    await registerController.handle(httpRequest, httpResponse);
  });

  return router;
};
```

## Testing Pattern

### Controller Test

```typescript
// features/authentication/presentation/controllers/register.controller.test.ts
describe('RegisterController', () => {
  let controller: RegisterController;
  let mockUseCase: jest.Mocked<RegisterUserUseCase>;
  let httpRequest: HttpRequest;
  let httpResponse: HttpResponse;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new RegisterController(mockUseCase);

    httpRequest = new HttpRequest(
      { email: 'test@example.com', password: 'ValidPass123!', name: 'Test User' },
      {},
      {},
      {}
    );

    httpResponse = {
      created: jest.fn(),
      conflict: jest.fn(),
      badRequest: jest.fn(),
      serverError: jest.fn(),
    } as any;
  });

  it('should return 201 when registration succeeds', async () => {
    const user = new UserBuilder().build();
    mockUseCase.execute.mockResolvedValue(Result.ok(user));

    await controller.handle(httpRequest, httpResponse);

    expect(httpResponse.created).toHaveBeenCalledWith({
      id: user.id.value,
      email: user.email.value,
      name: user.name,
    });
  });

  it('should return 409 when user already exists', async () => {
    mockUseCase.execute.mockResolvedValue(
      Result.fail(new UserAlreadyExistsError('test@example.com'))
    );

    await controller.handle(httpRequest, httpResponse);

    expect(httpResponse.conflict).toHaveBeenCalledWith({
      error: 'User with email test@example.com already exists',
    });
  });

  it('should return 400 when email is invalid', async () => {
    mockUseCase.execute.mockResolvedValue(
      Result.fail(new InvalidEmailError('Invalid email format'))
    );

    await controller.handle(httpRequest, httpResponse);

    expect(httpResponse.badRequest).toHaveBeenCalledWith({
      error: 'Invalid email format',
    });
  });

  it('should return 400 when required fields are missing', async () => {
    httpRequest = new HttpRequest({ email: 'test@example.com' }, {}, {}, {});

    await controller.handle(httpRequest, httpResponse);

    expect(httpResponse.badRequest).toHaveBeenCalledWith({
      error: 'Missing required fields: email, password, name',
    });
  });
});
```

## Key Benefits

1. **Type Safety**: `instanceof` checks provide compile-time safety
2. **Testability**: Controllers are easily unit tested with mock use cases
3. **Clarity**: Semantic HTTP methods self-document intent
4. **Separation of Concerns**: HTTP logic stays in controllers, business logic in use cases
5. **Consistency**: All controllers follow same pattern

## Anti-Patterns

```typescript
// ❌ Business logic in controller
export class RegisterController implements Controller {
  async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      httpResponse.conflict({ error: 'User exists' });
      return;
    }
  }
}

// ❌ Direct Express usage in controller
export class RegisterController {
  async handle(req: Request, res: Response): Promise<void> {
    res.status(201).json(data);
  }
}

// ❌ String-based error detection
if (error.message.includes('exists')) {
  httpResponse.conflict({ error: error.message });
}

// ❌ Use case returning HTTP status codes
export class RegisterUserUseCase {
  async execute(): Promise<{ status: number; data: any }> {
    return { status: 409, data: { error: 'User exists' } };
  }
}
```

## Summary

**Controllers = HTTP Adapters. Use Cases = Business Logic.**

- Controllers validate request structure, delegate to use cases, map errors to HTTP
- Use cases validate domain rules, return domain-specific errors
- Use `instanceof` for type-safe error mapping
- Use HttpResponse semantic methods for clarity
