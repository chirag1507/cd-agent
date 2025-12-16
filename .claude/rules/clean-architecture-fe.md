# Clean Architecture - Frontend (React/Next.js)

> **Trigger**: Creating or modifying frontend code in `src/features/`, `src/shared/`, or `src/app/`

## Core Principle

Frontend follows the same Clean Architecture principles as backend: **dependencies point inward**, business logic is framework-agnostic, and presentation is a thin layer.

## Layer Structure

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION                                 │
│  Pages (app/), Feature Components, Custom Hooks                  │
├──────────────────────────────────────────────────────────────────┤
│                      APPLICATION                                  │
│  Use Cases (orchestrate business logic)                          │
├──────────────────────────────────────────────────────────────────┤
│                      DOMAIN                                       │
│  Types, Interfaces (Ports), Mappers, Constants                   │
├──────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                               │
│  Repositories (Adapters), Services (Http, Storage, Navigation)   │
└──────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── app/                           # Next.js App Router (Presentation)
│   ├── page.tsx                   # Pages are thin - use hooks/components
│   └── <route>/page.tsx
├── features/                      # Feature modules (Bounded Contexts)
│   └── <feature>/
│       ├── application/
│       │   └── usecases/          # Business logic orchestration
│       ├── components/            # Feature-specific UI components
│       ├── constants/             # Feature constants, mock data
│       ├── hooks/                 # Feature-specific custom hooks
│       ├── interfaces/            # Repository interfaces (Ports)
│       ├── mappers/               # Domain → Presentation transformation
│       ├── repositories/          # Repository implementations (Adapters)
│       ├── types/                 # Domain types & interfaces
│       └── utils/                 # Feature utilities
└── shared/                        # Cross-cutting concerns
    ├── components/                # Shared UI (Atomic Design)
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   ├── templates/
    │   └── shadcn/                # shadcn/ui components
    ├── config/                    # Environment configs
    ├── constants/                 # App-wide constants
    ├── hooks/                     # Shared React hooks
    ├── interfaces/                # Service interfaces (Ports)
    ├── lib/                       # Utilities (cn helper, etc.)
    ├── providers/                 # React Context providers (DI)
    ├── services/                  # Service implementations (Adapters)
    ├── types/                     # Shared TypeScript types
    └── utils/                     # Shared utilities
```

## Layer Rules

### 1. Use Cases (Application Layer)

**Location**: `features/<feature>/application/usecases/`

```typescript
// ✅ GOOD: Pure business logic, no React/framework dependencies
export class AuthenticateWithSocialProviderUsecase {
  constructor(
    private readonly authenticationRepository: AuthenticationRepository,
    private readonly navigationService: NavigationClient,
    private readonly notificationService: NotificationClient
  ) {}

  async execute(): Promise<void> {
    try {
      const { url } = await this.authenticationRepository.authenticate();
      this.navigationService.navigateTo(url);
    } catch (error) {
      const authError = error as AuthenticationError;
      this.notificationService.showError(authError.message);
    }
  }
}
```

**Rules**:

- NO React imports (useState, useEffect, etc.)
- NO framework dependencies (Next.js, etc.)
- Constructor injection for all dependencies
- Business-focused naming (`AuthenticateWithSocialProvider`, not `LoginUser`)
- Single responsibility per use case

### 2. Repositories (Infrastructure Layer)

**Interface (Port)**: `features/<feature>/interfaces/`
**Implementation (Adapter)**: `features/<feature>/repositories/`

```typescript
// Port (interface)
export interface DiagnosisRepository {
  getDiagnosisStats(projectIds: string[]): Promise<ProjectDiagnosisStatsResponse>;
  getCategoryHealthScore(projectId: string): Promise<CategoryDetails[]>;
}

// Adapter (implementation)
export class DiagnosisRepositoryImpl implements DiagnosisRepository {
  constructor(private readonly httpClient: HttpClient, private readonly configService: ConfigClient) {}

  async getDiagnosisStats(projectIds: string[]): Promise<ProjectDiagnosisStatsResponse> {
    const path = this.configService.getApiPath("diagnosis", "stats");
    return this.httpClient.post({ path, body: { projectIds } });
  }
}
```

**Rules**:

- Repositories depend on service interfaces (HttpClient, ConfigClient)
- No direct `fetch()` calls - use HttpClient
- API paths from ConfigService, not hardcoded
- Error handling at adapter boundary

### 3. Mappers (Domain Layer)

**Location**: `features/<feature>/mappers/`

```typescript
// ✅ GOOD: Static mapper class, no React
export class DiagnosisChartDataMapper {
  static toChartData(diagnosis: DiagnosisMetric[], metricType: MetricType): LineSmoothModel {
    const sortedDiagnosis = this.sortByDate(diagnosis);
    const dateLabels = this.formatDateLabels(sortedDiagnosis);
    const metricValues = this.extractMetricValues(sortedDiagnosis, metricType);
    return { labels: dateLabels, data: metricValues };
  }

  private static sortByDate(diagnosis: DiagnosisMetric[]): DiagnosisMetric[] {
    return [...diagnosis].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
```

**Rules**:

- Static methods for transformation
- No React/framework imports
- Pure functions - testable without components
- Domain model → Presentation model

### 4. Custom Hooks (Presentation Layer)

**Location**: `features/<feature>/hooks/`

```typescript
export type UseGetCategoriesDependencies = {
  projectId: string;
  getCategoryHealthScoreUseCase: GetCategoryHealthScoreUseCase;
};

export const useGetCategories = ({
  projectId,
  getCategoryHealthScoreUseCase,
}: UseGetCategoriesDependencies): UseGetCategoriesReturn => {
  const [categories, setCategories] = useState<CategoryDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    setIsLoading(true);
    getCategoryHealthScoreUseCase
      .execute(projectId)
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [projectId, getCategoryHealthScoreUseCase]);

  return { categories, isLoading, error };
};
```

**Rules**:

- Dependency injection of use cases/services
- Explicit return types
- Manage loading/error/data states
- Orchestrate use case calls

### 5. Components (Presentation Layer)

**Location**: `features/<feature>/components/` and `shared/components/`

```typescript
"use client";

export default function AuthPage() {
  const { authenticateWithSocialProviderUseCase } = useAppDependencies();
  const { isLoading, authenticateWithGitHub } = useSocialProviderAuthentication({
    authenticateWithSocialProviderUseCase,
  });

  return <SocialProviderAuthForm onSubmit={authenticateWithGitHub} loading={isLoading} />;
}
```

**Rules**:

- `'use client'` for components using hooks/context
- Get dependencies via `useAppDependencies()` hook
- Use custom hooks to coordinate business logic
- Components are thin - render UI, delegate logic

## Dependency Injection

### Service Container

**Location**: `shared/providers/AppDependenciesContext.tsx`

```typescript
export interface AppDependenciesContextValue {
  httpClient: HttpClient;
  configService: ConfigClient;
  authenticationRepository: AuthenticationRepository;
  authenticateWithSocialProviderUseCase: AuthenticateWithSocialProviderUsecase;
  // ... all dependencies
}

export const AppDependenciesProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const dependencies = useMemo(() => {
    // Wire up all dependencies
    const configService = new AppConfigServiceAdapter();
    const httpClient = new FetchHttpServiceAdapter(configService);
    const authRepository = new AuthenticationRepositoryImpl(httpClient, configService);
    const authUseCase = new AuthenticateWithSocialProviderUsecase(authRepository, ...);

    return { httpClient, configService, authRepository, authUseCase };
  }, [router]);

  return (
    <AppDependenciesContext.Provider value={dependencies}>
      {children}
    </AppDependenciesContext.Provider>
  );
};

export const useAppDependencies = () => useContext(AppDependenciesContext);
```

## Service Interfaces

**Location**: `shared/interfaces/`

```typescript
// HttpClient - fetch abstraction
export interface HttpClient {
  get<T>(params: { path: string; queryParams?: Record<string, any> }): Promise<T>;
  post<T>(params: { path: string; body: unknown; headers?: Headers }): Promise<T>;
  put<T>(params: { path: string; body: unknown }): Promise<T>;
  delete<T>(params: { path: string; body?: unknown }): Promise<T>;
}

// ConfigClient - environment config
export interface ConfigClient {
  getApiBaseUrl(): string;
  getApiPath(feature: string, endpoint: string): string;
  getEnvironment(): "local" | "uat" | "prod";
}

// NavigationClient - routing abstraction
export interface NavigationClient {
  navigateTo(path: string): void;
  goBack(): void;
}

// NotificationClient - toast abstraction
export interface NotificationClient {
  showSuccess(message: string): void;
  showError(message: string): void;
}
```

## Environment Configuration

**Location**: `shared/config/`

```typescript
// types.ts
export interface EnvironmentConfig {
  environment: "local" | "uat" | "prod";
  api: {
    baseUrl: string;
    timeoutMs: number;
  };
  features?: Record<string, boolean>;
}

// default.ts (local)
export const defaultConfig: EnvironmentConfig = {
  environment: "local",
  api: { baseUrl: "http://localhost:3001/api", timeoutMs: 10000 },
};

// uat.ts
export const uatConfig: Partial<EnvironmentConfig> = {
  environment: "uat",
  api: { baseUrl: "https://uat.example.com/api", timeoutMs: 15000 },
};
```

## Anti-Patterns

```typescript
// ❌ BAD: React imports in use case
import { useState } from "react";
export class MyUseCase {
  execute() {
    useState(false);
  } // NO!
}

// ❌ BAD: Direct fetch in repository
export class MyRepository {
  async getData() {
    return fetch("/api/data"); // NO! Use HttpClient
  }
}

// ❌ BAD: Business logic in component
export function MyComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData); // NO!
  }, []);
}

// ❌ BAD: Hardcoded API paths
const response = await httpClient.get({ path: "/api/v1/users" }); // NO! Use ConfigService
```

## File Naming

- Use kebab-case: `get-categories.use-case.ts`
- Use cases: `*.use-case.ts`
- Repositories: `*.repository.ts`
- Mappers: `*.mapper.ts`
- Hooks: `use-*.ts` or `use*.ts`
- Components: `PascalCase.tsx`
- Types: `*.types.ts`
