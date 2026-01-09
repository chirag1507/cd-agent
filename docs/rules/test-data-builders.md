# Test Data Builders

> Apply when creating test data for any test type (unit, component, integration, acceptance).

## Purpose

Decouple tests from data construction logic. When entity properties change, update the builder once—not every test.

## Non-Negotiable Rules

### 1. ALWAYS Use Builders for Domain Entities

```typescript
// FORBIDDEN: Direct instantiation in tests
const user = User.create({
  email: Email.create("test@example.com").getValue(),
  password: Password.create("ValidPass123!").getValue(),
  name: "John Doe",
  isEmailVerified: false
}).getValue();

// REQUIRED: Use builder
const user = new UserBuilder().withEmail("test@example.com").build();
```

### 2. Provide Sensible Defaults

Builder must produce valid object without customization:

```typescript
const user = new UserBuilder().build(); // Valid user with default values
```

### 3. Customize Only What's Relevant

```typescript
// GOOD: Only specify relevant data
it("should reject disabled users", async () => {
  const user = new UserBuilder().isDisabled().build();
  // ...
});

// BAD: Over-specifying irrelevant data
it("should reject disabled users", async () => {
  const user = new UserBuilder()
    .withEmail("test@example.com")     // Irrelevant
    .withName("John Doe")              // Irrelevant
    .withPassword("ValidPass123!")     // Irrelevant
    .isDisabled()                      // ONLY THIS MATTERS
    .build();
});
```

## Builder Structure (Backend)

```typescript
// src/__tests__/builders/user.builder.ts
import { User } from "@/domain/entities/User";
import { Email } from "@/domain/value-objects/Email";
import { Password } from "@/domain/value-objects/Password";
import { UserId } from "@/domain/value-objects/UserId";

export class UserBuilder {
  private props = {
    id: UserId.create(),
    email: Email.create("default@example.com").getValue(),
    password: Password.create("DefaultPass123!").getValue(),
    name: "Default User",
    isEmailVerified: false,
    isDisabled: false,
    createdAt: new Date("2024-01-01"),
  };

  withId(id: string): this {
    this.props.id = UserId.fromString(id);
    return this;
  }

  withEmail(email: string): this {
    this.props.email = Email.create(email).getValue();
    return this;
  }

  withPassword(password: string): this {
    this.props.password = Password.create(password).getValue();
    return this;
  }

  withName(name: string): this {
    this.props.name = name;
    return this;
  }

  isEmailVerified(): this {
    this.props.isEmailVerified = true;
    return this;
  }

  isDisabled(): this {
    this.props.isDisabled = true;
    return this;
  }

  build(): User {
    return User.create(this.props).getValue();
  }
}
```

## Builder Structure (Frontend Props)

```typescript
// src/__tests__/builders/registration-form-props.builder.ts
export interface RegistrationFormProps {
  name: { value: string; onChange: jest.Mock };
  email: { value: string; onChange: jest.Mock };
  password: { value: string; onChange: jest.Mock };
  onSubmit: jest.Mock;
  isLoading: boolean;
  error: string | null;
}

export class RegistrationFormPropsBuilder {
  private props: RegistrationFormProps = {
    name: { value: "", onChange: jest.fn() },
    email: { value: "", onChange: jest.fn() },
    password: { value: "", onChange: jest.fn() },
    onSubmit: jest.fn(),
    isLoading: false,
    error: null,
  };

  withName(name: string): this {
    this.props.name.value = name;
    return this;
  }

  withEmail(email: string): this {
    this.props.email.value = email;
    return this;
  }

  isLoading(): this {
    this.props.isLoading = true;
    return this;
  }

  withError(error: string): this {
    this.props.error = error;
    return this;
  }

  withOnSubmit(onSubmit: jest.Mock): this {
    this.props.onSubmit = onSubmit;
    return this;
  }

  build(): RegistrationFormProps {
    // Return fresh mocks to avoid test pollution
    return {
      ...this.props,
      name: { ...this.props.name, onChange: jest.fn() },
      email: { ...this.props.email, onChange: jest.fn() },
      password: { ...this.props.password, onChange: jest.fn() },
      onSubmit: this.props.onSubmit || jest.fn(),
    };
  }
}
```

## Factory Functions for Common Scenarios

```typescript
// src/__tests__/builders/user.factory.ts
import { UserBuilder } from "./user.builder";

export const UserFactory = {
  default: () => new UserBuilder(),

  verified: () => new UserBuilder().isEmailVerified(),

  disabled: () => new UserBuilder().isDisabled(),

  admin: () => new UserBuilder().withRole("admin"),

  withEmail: (email: string) => new UserBuilder().withEmail(email),
};

// Usage in tests
const verifiedUser = UserFactory.verified().build();
const adminUser = UserFactory.admin().withName("Admin").build();
```

## Usage Examples

### Sociable Unit Test

```typescript
it("should not allow disabled users to login", async () => {
  // Only specify what matters
  const disabledUser = new UserBuilder().isDisabled().build();
  userRepository.findByEmail.mockResolvedValue(disabledUser);

  const result = await loginUseCase.execute({
    email: "any@example.com",
    password: "anyPassword"
  });

  expect(result.isFailure).toBe(true);
  expect(result.error).toBeInstanceOf(UserDisabledError);
});
```

### Component Test (Frontend)

```typescript
it("should display loading state", () => {
  const props = new RegistrationFormPropsBuilder().isLoading().build();
  const { page } = renderComponent(props);

  page.shouldBeInLoadingState();
});

it("should display error message", () => {
  const props = new RegistrationFormPropsBuilder()
    .withError("Invalid credentials")
    .build();
  const { page } = renderComponent(props);

  page.shouldShowError("Invalid credentials");
});
```

### Narrow Integration Test

```typescript
it("should save and retrieve user", async () => {
  const user = new UserBuilder()
    .withEmail("test@example.com")
    .isEmailVerified()
    .build();

  await userRepository.save(user);
  const found = await userRepository.findByEmail("test@example.com");

  expect(found).not.toBeNull();
  expect(found!.isEmailVerified).toBe(true);
});
```

## Directory Structure

```
src/__tests__/builders/
├── index.ts              # Re-exports all builders
├── user.builder.ts
├── user.factory.ts
├── project.builder.ts
├── registration-form-props.builder.ts
└── ...
```

## Index File

```typescript
// src/__tests__/builders/index.ts
export { UserBuilder } from "./user.builder";
export { UserFactory } from "./user.factory";
export { ProjectBuilder } from "./project.builder";
export { RegistrationFormPropsBuilder } from "./registration-form-props.builder";
```

## Key Benefits

1. **Maintainability**: Change entity structure in one place
2. **Readability**: Tests show only relevant data
3. **Consistency**: All tests use same construction patterns
4. **Type Safety**: Builders enforce valid construction
5. **Test Isolation**: Fresh mocks prevent pollution
