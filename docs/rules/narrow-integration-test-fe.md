# Narrow Integration Tests (Frontend)

> Apply when testing custom hooks that integrate Use Cases with UI state management.

## Purpose

Verify that custom hooks correctly integrate with Use Cases and manage state transitions for the UI layer.

## Non-Negotiable Rules

### 1. Real Use Case Integration

- Use REAL Use Case instances
- Mock ONLY I/O boundaries (HTTP clients, storage, notifications)
- Verify the "plumbing" between hook and application layer

### 2. Boundaries to Mock

- HTTP clients / fetch services
- Browser storage (localStorage, sessionStorage)
- Notification services
- Navigation services
- External APIs

### 3. Keep Internal Collaborators Real

- Use Cases = REAL
- Domain entities = REAL
- Value objects = REAL

### 4. Separate State vs Side-Effect Tests

**State tests:** Verify hook state transitions
**Side-effect tests:** Verify Use Case calls services correctly

## Test Structure

```typescript
describe("Narrow Integration Test: useRegistration Hook", () => {
  let registrationUseCase: RegistrationUseCase;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockNavigationService: jest.Mocked<NavigationService>;

  beforeEach(() => {
    // 1. Mock ONLY I/O boundaries
    mockRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    };
    mockNotificationService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };
    mockNavigationService = {
      navigateTo: jest.fn(),
    };

    // 2. Create REAL Use Case with mocked I/O dependencies
    registrationUseCase = new RegistrationUseCase(
      mockRepository,
      mockNotificationService,
      mockNavigationService
    );
  });

  // Test 1: Hook State Transitions
  it("should transition through loading and success states", async () => {
    // Arrange
    const expectedUser = { id: "123", email: "test@example.com" };
    mockRepository.save.mockResolvedValue(expectedUser);
    mockRepository.findByEmail.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useRegistration({ registrationUseCase })
    );

    // Act: Trigger registration
    let promise: Promise<void>;
    act(() => {
      promise = result.current.register({
        email: "test@example.com",
        password: "ValidPass123!"
      });
    });

    // Assert: Loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.errors).toEqual({});

    // Wait for completion
    await act(async () => {
      await promise;
    });

    // Assert: Final success state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  // Test 2: Service Integration
  it("should call all required services on success", async () => {
    // Arrange
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue({ id: "123", email: "test@example.com" });

    const { result } = renderHook(() =>
      useRegistration({ registrationUseCase })
    );

    // Act
    await act(async () => {
      await result.current.register({
        email: "test@example.com",
        password: "ValidPass123!"
      });
    });

    // Assert: Verify Use Case called services correctly
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining("success")
    );
    expect(mockNavigationService.navigateTo).toHaveBeenCalledWith("/login");
  });

  // Test 3: Error State Management
  it("should handle errors and update hook state", async () => {
    // Arrange
    mockRepository.findByEmail.mockResolvedValue({ id: "existing" }); // User exists

    const { result } = renderHook(() =>
      useRegistration({ registrationUseCase })
    );

    // Act
    await act(async () => {
      await result.current.register({
        email: "exists@example.com",
        password: "ValidPass123!"
      });
    });

    // Assert: Hook error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toContain("already exists");
    expect(mockNotificationService.showError).toHaveBeenCalled();
  });

  // Test 4: Form State Management
  it("should update form state and clear errors on input change", () => {
    // Arrange
    const { result } = renderHook(() =>
      useRegistration({ registrationUseCase })
    );

    // Set initial error
    act(() => {
      result.current.setError("email", "Invalid email");
    });
    expect(result.current.errors.email).toBe("Invalid email");

    // Act: Change input
    act(() => {
      result.current.onFieldChange("email", "valid@example.com");
    });

    // Assert: Error cleared
    expect(result.current.formData.email).toBe("valid@example.com");
    expect(result.current.errors.email).toBe("");
  });
});
```

## Key Testing Patterns

1. **State-Focused Tests**: Use stubs to test hook state transitions
2. **Service Integration Tests**: Verify Use Case calls I/O services
3. **Error Handling Tests**: Test both hook error state and error services
4. **Input Management Tests**: Test form state and validation clearing

## Interaction Verification vs State Verification

### Prefer State Verification (Robust)

Narrow integration tests for hooks should focus on **observable hook state** that components consume, not implementation details.

**Good - State-focused:**
```typescript
it('should successfully complete login flow', async () => {
  // Arrange
  mockAuthRepository.login.mockResolvedValue(mockLoginResponse);
  const { result } = renderHook(() => useLogin({ loginUserUseCase }));

  // Act
  await act(async () => {
    await result.current.login({ email: 'test@example.com', password: 'pass' });
  });

  // Assert - Focus on hook state
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.loginResponse).toEqual(mockLoginResponse);
  expect(result.current.error).toBeNull();
  expect(result.current.isLoading).toBe(false);
});
```

**Avoid - Over-specified interaction verification:**
```typescript
// Too brittle - couples to implementation
expect(mockAuthRepository.login).toHaveBeenCalledTimes(1);
expect(mockAuthRepository.login).toHaveBeenCalledWith({
  email: 'test@example.com',
  password: 'pass'
});
expect(mockNotificationClient.showSuccess).toHaveBeenCalledWith(
  'Login successful! Welcome back.'
);
```

### When to Verify Interactions (Minimal)

Verify interactions ONLY for:
1. **Critical side effects** - Navigation, logout, etc.
2. **User-visible effects** - Notifications (verify it was called, not exact message)
3. **Minimal verification** - Just that it happened, not parameters

**Acceptable minimal verification:**
```typescript
// Critical navigation
expect(mockNavigationClient.navigateTo).toHaveBeenCalledWith('/dashboard');

// User-visible notification (flexible message matching)
expect(mockNotificationClient.showSuccess).toHaveBeenCalledWith(
  expect.stringContaining('success')
);

// Repository was called (don't verify exact params)
expect(mockAuthRepository.login).toHaveBeenCalled();
```

### Test Organization

Group tests by purpose:

```typescript
describe('State transitions', () => {
  // Test hook state changes through lifecycle
  it('should initialize with default state', () => { ... });
  it('should transition through loading and success states', async () => { ... });
  it('should handle error state transitions', async () => { ... });
});

describe('Service integration', () => {
  // Minimal verification that services are called
  it('should call repository when action is triggered', async () => {
    expect(mockRepository.action).toHaveBeenCalled();
  });

  it('should navigate on success', async () => {
    expect(mockNavigationClient.navigateTo).toHaveBeenCalledWith('/expected-route');
  });
});

describe('Error handling', () => {
  // Focus on how hook state reflects different error scenarios
  it('should handle 401 errors', async () => {
    expect(result.current.error).toBe('Invalid credentials');
  });
});
```

### Anti-Patterns

```typescript
// ❌ BAD: Testing exact call count
expect(mockService.method).toHaveBeenCalledTimes(1);

// ❌ BAD: Testing exact parameters
expect(mockService.method).toHaveBeenCalledWith(exactObject);

// ❌ BAD: Testing exact notification messages
expect(mockNotificationClient.showSuccess).toHaveBeenCalledWith('Exact message');

// ✅ GOOD: Testing hook state
expect(result.current.isSuccess).toBe(true);

// ✅ GOOD: Minimal interaction for critical effects
expect(mockNavigationClient.navigateTo).toHaveBeenCalled();

// ✅ GOOD: Flexible message matching for notifications
expect(mockNotificationClient.showSuccess).toHaveBeenCalledWith(
  expect.stringContaining('success')
);
```

### Benefits

1. **Refactor-friendly**: Change implementation without breaking tests
2. **Focus on behavior**: Tests verify what users care about (hook state)
3. **Less brittle**: Don't break when adding logging, analytics, etc.
4. **Clearer intent**: Tests show what state changes matter

## What These Tests Are NOT

- **Not Unit Tests**: They integrate hook with real Use Case
- **Not Component Tests**: They don't test React components
- **Not E2E Tests**: They mock I/O boundaries

## File Naming

`use<HookName>.integration.test.ts`

Example: `useRegistration.integration.test.ts`

## Location

`src/features/<feature>/hooks/__tests__/`
