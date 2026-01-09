# Preventing Test Flakiness (System-Level Tests)

> Apply when writing acceptance tests, E2E tests, or any system-level tests to ensure reliability and stability.

## Purpose

Prevent flaky tests that intermittently fail without code changes, which erode trust in the test suite and waste engineering time debugging false positives.

## Core Principle

**Flaky tests are worse than no tests.** They create a "cry wolf" culture where failures are ignored, defeating the purpose of automated testing.

## Non-Negotiable Rules

### 1. NEVER Use Hard-Coded Waits

```typescript
// ❌ FORBIDDEN: Hard-coded sleep/wait
await page.waitForTimeout(3000); // Flaky - timing varies
await new Promise(resolve => setTimeout(resolve, 2000)); // Flaky

// ✅ REQUIRED: Wait for specific conditions
await page.waitForSelector('[data-testid="success-message"]', { state: 'visible' });
await page.waitForURL(/\/dashboard/);
await page.waitForLoadState('networkidle');

// ✅ GOOD: Wait for element state
await expect(page.getByTestId('submit-button')).toBeEnabled();
await expect(page.getByText('Loading...')).not.toBeVisible();
```

**Why hard-coded waits fail:**
- System load varies (CI vs local)
- Network latency fluctuates
- Database operations take variable time
- Race conditions remain undetected

### 2. Ensure Test Data Isolation

```typescript
// ❌ BAD: Shared test data between tests
describe('User tests', () => {
  const testUser = { email: 'test@example.com' }; // Reused across tests

  it('should register user', async () => {
    await userService.register(testUser); // First test passes
  });

  it('should login user', async () => {
    await userService.login(testUser); // May fail if first test didn't run
  });
});

// ✅ GOOD: Isolated test data per test
describe('User tests', () => {
  it('should register user', async () => {
    const uniqueUser = { email: `test-${Date.now()}@example.com` };
    await userService.register(uniqueUser);
  });

  it('should login user', async () => {
    // Setup: Create user via back-door
    const user = await createTestUser({ email: `test-${Date.now()}@example.com` });

    // Act: Test login behavior
    await userService.login(user.email, user.password);
  });
});

// ✅ BEST: Use test data tracking service
describe('User tests', () => {
  afterEach(async () => {
    await userService.cleanupAllTrackedData(); // Clean after each test
  });

  it('should register user', async () => {
    const user = await userService.registerAndTrackUser({
      email: `test-${Date.now()}@example.com`
    });
    // userService tracks this for cleanup
  });
});
```

**Test isolation patterns:**
- Use unique identifiers (timestamps, UUIDs) for test data
- Clean up test data in `afterEach` hooks
- Use test data tracking services
- Never assume test execution order

### 3. Wait for Network and State Transitions

```typescript
// ❌ BAD: Immediate assertion after action
await page.click('[data-testid="submit-button"]');
expect(page.getByText('Success')).toBeVisible(); // Race condition!

// ✅ GOOD: Wait for network completion
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/submit')),
  page.click('[data-testid="submit-button"]')
]);
expect(response.status()).toBe(201);
await expect(page.getByText('Success')).toBeVisible();

// ✅ GOOD: Wait for specific state change
await page.click('[data-testid="submit-button"]');
await page.waitForSelector('[data-testid="submit-button"]:disabled');
await page.waitForResponse(resp => resp.url().includes('/api/submit'));
await expect(page.getByText('Success')).toBeVisible();

// ✅ GOOD: Wait for loading indicators
await page.click('[data-testid="load-data"]');
await expect(page.getByTestId('loading-spinner')).toBeVisible();
await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
await expect(page.getByTestId('data-table')).toBeVisible();
```

### 4. Handle Asynchronous Operations Properly

```typescript
// ❌ BAD: Not waiting for async operations
page.fill('[data-testid="email"]', 'test@example.com'); // Missing await
page.click('[data-testid="submit"]'); // Missing await

// ✅ GOOD: Always await async operations
await page.fill('[data-testid="email"]', 'test@example.com');
await page.click('[data-testid="submit"]');

// ❌ BAD: Parallel operations with dependencies
await Promise.all([
  page.fill('[data-testid="email"]', 'test@example.com'),
  page.click('[data-testid="submit"]') // Depends on fill completing!
]);

// ✅ GOOD: Sequential dependent operations
await page.fill('[data-testid="email"]', 'test@example.com');
await page.click('[data-testid="submit"]');

// ✅ GOOD: Parallel independent operations
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/user')),
  page.waitForResponse(resp => resp.url().includes('/api/projects'))
]);
```

### 5. Avoid Race Conditions in Element Selection

```typescript
// ❌ BAD: Selecting elements that may not exist yet
const button = page.locator('[data-testid="submit"]');
await button.click(); // May fail if button not rendered

// ✅ GOOD: Wait for element before interaction
await page.waitForSelector('[data-testid="submit"]', { state: 'visible' });
await page.click('[data-testid="submit"]');

// ✅ BETTER: Use Playwright auto-wait
await page.getByTestId('submit').click(); // Auto-waits for actionability

// ❌ BAD: Assuming element count
const items = await page.locator('.item').count();
expect(items).toBe(5); // Flaky - may not be loaded yet

// ✅ GOOD: Wait for expected count
await expect(page.locator('.item')).toHaveCount(5);

// ❌ BAD: Checking visibility immediately
expect(await page.locator('[data-testid="error"]').isVisible()).toBe(false);

// ✅ GOOD: Use assertion with auto-retry
await expect(page.getByTestId('error')).not.toBeVisible();
```

### 6. Handle External Service Dependencies

```typescript
// ❌ BAD: Relying on real external services
await githubAuthProvider.authenticate(); // Flaky - GitHub may be down

// ✅ GOOD: Stub all external services
await scenaristService.switchToScenario(githubOAuthSuccess);
await page.click('[data-testid="github-login"]');

// ❌ BAD: Assuming external API response time
const response = await fetch('https://api.external.com/data');
// Flaky - network latency varies

// ✅ GOOD: Use controlled stubs/mocks
await stubService.simulateExternalAPISuccess({ data: mockData });
const response = await systemUnderTest.fetchData();
```

### 7. Use Idempotent Operations

```typescript
// ❌ BAD: Operations that fail on retry
await createUser({ email: 'test@example.com' }); // Fails if user exists

// ✅ GOOD: Ensure user doesn't exist first (back-door)
await deleteUserIfExists('test@example.com');
await createUser({ email: 'test@example.com' });

// ✅ BETTER: Use unique data per test
await createUser({ email: `test-${uuid()}@example.com` });

// ❌ BAD: Increment operations
await cart.addItem(productId); // What if test re-runs?
expect(cart.itemCount()).toBe(1); // Flaky

// ✅ GOOD: Reset state before test
await cart.clear();
await cart.addItem(productId);
expect(cart.itemCount()).toBe(1);
```

### 8. Avoid Brittle Selectors

```typescript
// ❌ BAD: Brittle CSS selectors
await page.click('.btn.btn-primary.mt-4'); // Breaks with style changes
await page.click('div > div > button:nth-child(2)'); // Breaks with structure changes
await page.click('button:contains("Submit")'); // Breaks with text changes

// ✅ GOOD: Semantic selectors
await page.click('[data-testid="submit-button"]'); // Stable
await page.getByRole('button', { name: /submit/i }).click(); // Accessible
await page.getByLabel('Email address').fill('test@example.com'); // User-facing

// ❌ BAD: XPath selectors
await page.click('//div[@class="container"]/button[1]'); // Brittle

// ✅ GOOD: data-testid attributes
await page.click('[data-testid="checkout-button"]');
```

### 9. Handle Animation and Transition Timing

```typescript
// ❌ BAD: Not accounting for animations
await page.click('[data-testid="open-modal"]');
await page.click('[data-testid="modal-submit"]'); // May click before modal fully opens

// ✅ GOOD: Wait for element to be actionable
await page.click('[data-testid="open-modal"]');
await page.waitForSelector('[data-testid="modal-submit"]', { state: 'visible' });
await page.getByTestId('modal-submit').click(); // Auto-waits for actionability

// ✅ GOOD: Disable animations in test environment
// playwright.config.ts
export default {
  use: {
    // Disable CSS animations and transitions
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
};

// CSS: Disable animations in test mode
// global.css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10. Manage Test Execution Order

```typescript
// ❌ BAD: Tests depend on execution order
describe('Shopping cart', () => {
  it('should add item to cart', async () => {
    await cart.addItem('item-1');
  });

  it('should show correct count', async () => {
    expect(cart.itemCount()).toBe(1); // Assumes previous test ran!
  });
});

// ✅ GOOD: Each test is independent
describe('Shopping cart', () => {
  beforeEach(async () => {
    await cart.clear(); // Reset state
  });

  it('should add item to cart', async () => {
    await cart.addItem('item-1');
    expect(cart.itemCount()).toBe(1);
  });

  it('should show correct count after adding item', async () => {
    await cart.addItem('item-1');
    expect(cart.itemCount()).toBe(1);
  });
});
```

## Common Flakiness Patterns and Solutions

### Pattern 1: "Works locally, fails in CI"

**Cause:** Different system resources, timing, or parallelization

**Solution:**
```typescript
// Use explicit waits instead of implicit assumptions
// playwright.config.ts
export default {
  timeout: 30000, // Increase for CI
  retries: process.env.CI ? 2 : 0, // Retry on CI
  workers: process.env.CI ? 1 : undefined, // Serial execution on CI
};
```

### Pattern 2: "Fails intermittently"

**Cause:** Race conditions, timing issues

**Solution:**
```typescript
// Replace hard-coded waits with condition waits
// ❌ await page.waitForTimeout(1000);
// ✅ await page.waitForLoadState('networkidle');
// ✅ await expect(element).toBeVisible({ timeout: 5000 });
```

### Pattern 3: "Test pollution - passes alone, fails in suite"

**Cause:** Shared state between tests

**Solution:**
```typescript
// Use proper isolation and cleanup
beforeEach(async () => {
  await database.clear();
  await localStorage.clear();
  await cookies.clear();
});

afterEach(async () => {
  await userService.cleanupAllTrackedData();
});
```

### Pattern 4: "Element not found"

**Cause:** Checking for element before it's rendered

**Solution:**
```typescript
// Use Playwright's auto-waiting assertions
await expect(page.getByTestId('element')).toBeVisible();
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

### Pattern 5: "Stale element reference"

**Cause:** DOM changes between finding and interacting with element

**Solution:**
```typescript
// ❌ const button = await page.locator('button');
//    // DOM updates here
//    await button.click(); // Stale!

// ✅ Re-query element when needed
await page.locator('button').click(); // Fresh query each time
```

## Configuration Best Practices

### Playwright Configuration

```typescript
// playwright.config.ts
export default {
  timeout: 30000,
  expect: {
    timeout: 10000, // Assertions auto-retry for 10s
  },
  use: {
    actionTimeout: 10000, // Actions auto-retry for 10s
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
};
```

### Environment Variables

```typescript
// config.ts
export const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  headless: process.env.HEADLESS !== 'false',
  slowMo: process.env.HEADLESS === 'false' ? 500 : 0,
};
```

## Page Object Pattern for Reliability

```typescript
// Good page object with built-in waits
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string): Promise<void> {
    // Wait for page load
    await this.page.waitForLoadState('networkidle');

    // Fill form with auto-wait
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);

    // Click and wait for navigation
    const [response] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
      this.page.getByRole('button', { name: /sign in/i }).click()
    ]);

    // Verify success
    await this.page.waitForURL(/\/dashboard/);
  }

  async shouldShowError(message: string | RegExp): Promise<void> {
    await expect(this.page.getByTestId('error-message')).toBeVisible();
    await expect(this.page.getByTestId('error-message')).toContainText(message);
  }
}
```

## Anti-Patterns Summary

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `waitForTimeout(3000)` | Hard-coded wait | `waitForSelector()`, `waitForResponse()` |
| Shared test data | Test pollution | Unique data per test, cleanup hooks |
| Missing `await` | Race conditions | Always await async operations |
| Brittle selectors | Breaks with UI changes | Use `data-testid`, roles, labels |
| Real external services | Unreliable | Stub with Scenarist/MSW |
| Assuming load order | Timing dependency | Wait for specific conditions |
| Checking state immediately | Race conditions | Use assertions with auto-retry |
| Test execution order dependency | Brittle suite | Isolate tests, use `beforeEach` |
| Complex selectors | Maintenance burden | Simple, semantic selectors |
| Not waiting for animations | Premature interaction | Wait for actionability, disable animations |

## Debugging Flaky Tests

When a test fails intermittently:

1. **Enable tracing**: `trace: 'on'` in config
2. **Record video**: `video: 'on'`
3. **Take screenshots**: `screenshot: 'on'`
4. **Run test 100 times**: `npx playwright test --repeat-each=100`
5. **Check timing**: Look for hard-coded waits
6. **Verify isolation**: Run test alone vs in suite
7. **Check CI logs**: Compare local vs CI behavior
8. **Review network**: Check for race conditions with API calls

## Benefits of Non-Flaky Tests

1. **Trust**: Team trusts failures are real bugs
2. **Speed**: No time wasted debugging false positives
3. **CI/CD**: Reliable deployment gates
4. **Confidence**: Safe to deploy on green pipeline
5. **Productivity**: Engineers focus on features, not test maintenance

## File Naming

`*.test.ts` or `*.spec.ts` (Cucumber: `*.feature` + `*.steps.ts`)

## Location

`<project>-system-tests/` (separate repository for system-level tests)
