# Sociable Unit Tests (Frontend)

> Apply when writing unit tests for Use Cases and custom hooks in frontend applications.

## Purpose

Test Use Case and hook behavior with real domain collaborators but stubbed I/O boundaries.

## Non-Negotiable Rules

### 1. Test Behavior, Not Implementation

```typescript
// BAD: Testing internal hook implementation
expect(mockService.create).toHaveBeenCalledWith(exactParams);

// GOOD: Testing observable behavior
expect(result.isSuccess).toBe(true);
expect(result.current.isLoading).toBe(false);
expect(result.current.error).toBeNull();
```

### 2. Real Collaborators for Domain, Stubs for Boundaries

```typescript
// REAL: Domain objects
const title = Title.create("Sample Item").getValue();
const description = Description.create("Item description").getValue();

// STUBS: I/O boundaries
const httpClient = {
  post: jest.fn(),
  get: jest.fn(),
};
const notificationService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};
```

### 3. Boundaries to Stub

- HTTP clients
- External APIs
- Browser APIs (localStorage, sessionStorage)
- Notification services
- Navigation services

## Use Case Test Structure

```typescript
describe("CreateItemUseCase", () => {
  let useCase: CreateItemUseCase;
  let mockItemService: jest.Mocked<ItemService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockItemService = {
      create: jest.fn(),
      getById: jest.fn(),
    };
    mockNotificationService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };
    useCase = new CreateItemUseCase(mockItemService, mockNotificationService);
  });

  it("should successfully create a new item", async () => {
    // Arrange
    const itemData = { title: "Sample", description: "Desc" };
    const createdItem = { id: "123", ...itemData, createdAt: new Date() };
    mockItemService.create.mockResolvedValue(createdItem);

    // Act
    const result = await useCase.execute(itemData);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(createdItem);
  });
});
```

## Custom Hook Test Structure

Use `renderHook` from React Testing Library:

```typescript
import { renderHook, act } from "@testing-library/react";

describe("useCreateItem", () => {
  let mockItemService: jest.Mocked<ItemService>;

  beforeEach(() => {
    mockItemService = {
      create: jest.fn(),
    };
  });

  it("should handle successful item creation", async () => {
    // Arrange
    const createdItem = { id: "123", title: "Sample" };
    mockItemService.create.mockResolvedValue(createdItem);

    // Act
    const { result } = renderHook(() => useCreateItem(mockItemService));
    await act(async () => {
      await result.current.createItem("Sample", "Description");
    });

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.createdItem).toEqual(createdItem);
  });

  it("should manage loading state correctly", async () => {
    // Arrange
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockItemService.create.mockReturnValue(createPromise);

    // Act & Assert - Loading state
    const { result } = renderHook(() => useCreateItem(mockItemService));
    act(() => {
      result.current.createItem("Sample", "Description");
    });
    expect(result.current.isLoading).toBe(true);

    // Complete creation
    await act(async () => {
      resolveCreate!({ id: "123", title: "Sample" });
    });
    expect(result.current.isLoading).toBe(false);
  });
});
```

## State Over Interaction Verification

**Prefer:**
```typescript
expect(result.current.isLoading).toBe(false);
expect(result.current.data).toEqual(expectedData);
```

**Minimal interaction verification:**
```typescript
expect(mockService.create).toHaveBeenCalledTimes(1);
```

## Speed Requirements

- Each test < 100ms
- No network calls
- No real browser APIs

## File Naming

- Use Case: `<use-case-name>.use-case.test.ts`
- Hook: `use<HookName>.test.ts`
