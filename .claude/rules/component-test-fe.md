# Component Tests (Frontend)

> Apply when writing tests for React components to verify behavior, not implementation.

## Purpose

Test component behavior from a user's perspective with fast, focused tests that provide immediate feedback.

## Non-Negotiable Rules

### 1. Test Behavior, Not Implementation

```typescript
// BAD: Testing implementation details
expect(screen.getByTestId("email-input")).toHaveAttribute("type", "email");
expect(container.querySelector(".form-field")).toBeRequired();

// GOOD: Testing user-facing behavior
expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
```

### 2. Behavior-Focused Test Names

```typescript
// BAD: Prop-focused names
"should display loading state when isLoading prop is true"
"should disable button when disabled prop is true"

// GOOD: Behavior-focused names
"should display a loading indicator while an operation is in progress"
"should disable the submit button when the form is invalid"
```

### 3. Query by User-Facing Attributes

**Priority order:**
1. `getByRole` - Accessible roles
2. `getByLabelText` - Form labels
3. `getByText` - Visible text
4. `getByTestId` - Last resort only

### 4. Use Page Object Pattern (Mandatory)

```typescript
// Page Object
export class RegistrationFormPage extends BasePage {
  get submitButton() {
    return screen.getByRole("button", { name: /create account/i });
  }

  isSubmitButtonDisabled(): boolean {
    return this.submitButton.hasAttribute("disabled");
  }

  shouldShowError(message: string | RegExp): void {
    expect(screen.getByText(message)).toBeInTheDocument();
  }

  shouldBeInLoadingState(): void {
    expect(this.isSubmitButtonDisabled()).toBe(true);
    expect(this.submitButton).toHaveTextContent(/loading|saving/i);
  }
}

// Test using Page Object
it("should display a loading indicator while submitting", () => {
  const { page } = renderComponent({ isLoading: true });
  page.shouldBeInLoadingState();
});
```

### 5. Stateless vs Stateful Testing

**Stateless Components (Props-Driven):**
```typescript
// Test how props affect rendered output
it("should populate fields with initial data", () => {
  const initialData = { name: "John", email: "john@example.com" };
  const { page } = renderComponent({ initialData });

  expect(page.getFieldValue("name")).toBe("John");
  expect(page.getFieldValue("email")).toBe("john@example.com");
});
```

**Stateful Components:**
```typescript
// Test state changes from user interactions
it("should handle form submission", async () => {
  const mockOnSubmit = jest.fn();
  const { page, user } = renderComponent({ onSubmit: mockOnSubmit });

  await user.type(page.nameField, "John");
  await user.click(page.submitButton);

  expect(mockOnSubmit).toHaveBeenCalled();
});
```

## Test Structure

```typescript
describe("Component Test: RegistrationForm", () => {
  const defaultProps = {
    name: { value: "", onChange: jest.fn() },
    email: { value: "", onChange: jest.fn() },
    onSubmit: jest.fn(),
    isLoading: false,
    error: null,
  };

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    render(<RegistrationForm {...mergedProps} />);
    return { page: new RegistrationFormPage() };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When the form is submitting", () => {
    it("should display a loading indicator", () => {
      const { page } = renderComponent({ isLoading: true });
      page.shouldBeInLoadingState();
    });
  });

  describe("When there is an error", () => {
    it("should display the error message", () => {
      const { page } = renderComponent({ error: "Invalid credentials" });
      page.shouldShowError(/invalid credentials/i);
    });
  });

  describe("When populated with initial data", () => {
    it("should display the initial values", () => {
      const { page } = renderComponent({
        name: { value: "John Doe", onChange: jest.fn() }
      });
      expect(page.nameField).toHaveValue("John Doe");
    });
  });
});
```

## Forbidden Test Types

```typescript
// FORBIDDEN: Implementation detail testing
"should have proper input types"
"should have required attributes"
"should have correct CSS classes"
"should have proper ARIA labels"
"should match snapshot" // for structural testing

// FORBIDDEN: Interaction verification
expect(mockOnSubmit).toHaveBeenCalledTimes(1);
expect(mockOnChange).toHaveBeenCalledWith(expectedValue);
```

## What NOT to Test

1. **HTML Structure/Attributes**: Input types, required attributes, CSS classes
2. **Framework-Specific Details**: React lifecycle, hooks implementation
3. **Props Interface Edge Cases**: Missing props, default props (TypeScript handles this)
4. **Styling and Layout**: CSS classes, visual positioning

## Speed Requirements

- Total test suite < 2 seconds
- No API calls
- No timers (use `jest.useFakeTimers()` if needed)

## File Naming

`<ComponentName>.component.test.tsx`

Example: `RegistrationForm.component.test.tsx`

## Page Object Location

`src/__tests__/page-objects/<component-name>.page.ts`
