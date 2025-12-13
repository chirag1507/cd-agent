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

## What These Tests Are NOT

- **Not Unit Tests**: They integrate hook with real Use Case
- **Not Component Tests**: They don't test React components
- **Not E2E Tests**: They mock I/O boundaries

## File Naming

`use<HookName>.integration.test.ts`

Example: `useRegistration.integration.test.ts`

## Location

`src/features/<feature>/hooks/__tests__/`
