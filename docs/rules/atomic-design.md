# Atomic Design System

> **Trigger**: Creating or modifying ANY UI component files (`.tsx`, `.jsx`) in frontend projects
>
> **CRITICAL**: Every frontend component MUST follow Atomic Design hierarchy. Before creating any component, determine its level: Atom, Molecule, Organism, or Template.

## Core Principle

UI components follow Brad Frost's **Atomic Design** methodology, building complex interfaces from simple, reusable building blocks. We use **shadcn/ui** as our component library foundation with **Tailwind CSS** for styling.

## BEFORE Creating Any Component: Decision Guide

**MANDATORY**: Before creating any component, determine its level using this guide:

| Component Type | When to Use | Examples | Location |
|----------------|-------------|----------|----------|
| **Atom** | Smallest, indivisible UI element. Cannot be broken down further. | Button, Input, Typography, Icon, Badge, Avatar | `shared/components/atoms/` |
| **Molecule** | Simple group of atoms working together as a unit. | SearchBar (input + button), IconButton (icon + button), FormField (label + input + error), CardHeader (title + subtitle) | `shared/components/molecules/` |
| **Organism** | Complex, self-contained section combining molecules and atoms. | Navbar, AuthForm, DataTable, SidePanel, ProductCard, UserProfileCard | `shared/components/organisms/` |
| **Template** | Page-level layout structure with content slots. | DashboardLayout, AuthLayout, MainLayout, TwoColumnLayout | `shared/components/templates/` |
| **Feature Component** | Domain-specific component for a particular feature. | ProjectList, KudosCard, DiagnosisChart | `features/<feature>/components/` |

### Component Selection Flow

```
Is it feature-specific (domain logic)?
  YES → Feature Component (features/<feature>/components/)
  NO  → Continue ↓

Can it be broken into smaller parts?
  NO  → Atom (shared/components/atoms/)
  YES → Continue ↓

Does it combine 2-3 atoms into a simple unit?
  YES → Molecule (shared/components/molecules/)
  NO  → Continue ↓

Is it a page layout structure?
  YES → Template (shared/components/templates/)
  NO  → Organism (shared/components/organisms/)
```

### Examples to Clarify

**Atom Examples:**
- `<Button>` - Cannot break down further
- `<Input>` - Basic text input
- `<Typography variant="h1">` - Text element
- `<Icon name="check" />` - Icon display

**Molecule Examples:**
- `<SearchBar>` - Input + Search Button (2 atoms)
- `<IconButton>` - Icon + Button label (2 atoms)
- `<FormField>` - Label + Input + Error message (3 atoms)
- `<CardHeader>` - Title Typography + Subtitle Typography (2 atoms)

**Organism Examples:**
- `<Navbar>` - Logo + Navigation links + User menu + Search (complex structure)
- `<AuthForm>` - Multiple form fields + submit button + social login buttons
- `<DataTable>` - Table headers + rows + pagination + filters
- `<ProductCard>` - Image + Title + Description + Price + Add to cart button

**Template Examples:**
- `<DashboardLayout>` - Navbar + Sidebar + Main content area + Footer
- `<AuthLayout>` - Centered card with logo + form slot
- `<TwoColumnLayout>` - Sidebar slot + Main content slot

**Feature Component Examples:**
- `<ProjectList>` - Uses ProjectCard organisms, specific to project feature
- `<KudosForm>` - Kudos-specific form, lives in kudos feature
- `<DiagnosisChart>` - Chart specific to diagnosis feature

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATES                                                       │
│  Page-level layouts with content slots                          │
├─────────────────────────────────────────────────────────────────┤
│  ORGANISMS                                                       │
│  Complex, self-contained sections (forms, cards, navbars)       │
├─────────────────────────────────────────────────────────────────┤
│  MOLECULES                                                       │
│  Simple groups of atoms (search bar, card header)               │
├─────────────────────────────────────────────────────────────────┤
│  ATOMS                                                           │
│  Basic building blocks (buttons, inputs, typography)            │
├─────────────────────────────────────────────────────────────────┤
│  SHADCN/UI                                                       │
│  Base Radix primitives with Tailwind styling                    │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
shared/components/
├── atoms/                    # Smallest, indivisible components
│   ├── Typography/
│   │   ├── Typography.tsx
│   │   ├── Typography.test.tsx
│   │   └── index.ts
│   ├── Button/
│   ├── Input/
│   ├── Icon/
│   └── Badge/
├── molecules/                # Composed atoms
│   ├── SearchBar/
│   ├── CardHeader/
│   ├── IconButton/
│   └── FormField/
├── organisms/                # Complex, self-contained sections
│   ├── Navbar/
│   ├── AuthForm/
│   ├── DataTable/
│   └── SidePanel/
├── templates/                # Page-level layout containers
│   ├── DashboardLayout/
│   ├── AuthLayout/
│   └── MainLayout/
└── shadcn/                   # shadcn/ui primitives
    ├── accordion.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ...
```

## Layer Definitions

### Atoms

**Smallest, indivisible UI components.**

```typescript
// shared/components/atoms/Typography/Typography.tsx
import { cn } from '@/shared/lib/utils';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

interface TypographyProps {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold',
  h3: 'text-2xl font-medium',
  body: 'text-base',
  caption: 'text-sm text-muted-foreground',
  label: 'text-sm font-medium',
};

export const Typography = ({
  variant = 'body',
  children,
  className,
  as: Component = 'p',
}: TypographyProps) => {
  return (
    <Component className={cn(variantStyles[variant], className)}>
      {children}
    </Component>
  );
};
```

**Characteristics**:
- No business logic
- Props-driven
- Highly reusable across the app
- Use Tailwind for styling
- Wrap shadcn/ui primitives when needed

### Molecules

**Simple component groups combining atoms.**

```typescript
// shared/components/molecules/IconButton/IconButton.tsx
import { Button } from '@/shared/components/shadcn/button';
import { Typography } from '@/shared/components/atoms/Typography';
import { cn } from '@/shared/lib/utils';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export const IconButton = ({
  icon,
  label,
  onClick,
  disabled,
  variant = 'default',
  className,
}: IconButtonProps) => {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn('flex items-center gap-2', className)}
    >
      {icon}
      <Typography variant="label">{label}</Typography>
    </Button>
  );
};
```

**Characteristics**:
- Compose atoms
- Simple UI state (hover, focus)
- No business logic
- May have default props for convenience

### Organisms

**Complex, self-contained UI sections.**

```typescript
// shared/components/organisms/AuthForm/AuthForm.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/components/shadcn/card';
import { IconButton } from '@/shared/components/molecules/IconButton';
import { Typography } from '@/shared/components/atoms/Typography';
import { GitHubIcon } from '@/shared/components/atoms/Icon';

interface AuthFormProps {
  onSubmit: () => void;
  loading: boolean;
  title?: string;
}

export const AuthForm = ({
  onSubmit,
  loading,
  title = 'Sign In',
}: AuthFormProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <Typography variant="h2">{title}</Typography>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <IconButton
          icon={<GitHubIcon className="w-5 h-5" />}
          label={loading ? 'Signing in...' : 'Continue with GitHub'}
          onClick={onSubmit}
          disabled={loading}
          className="w-full"
        />
      </CardContent>
      <CardFooter>
        <Typography variant="caption" className="text-center w-full">
          By continuing, you agree to our Terms of Service
        </Typography>
      </CardFooter>
    </Card>
  );
};
```

**Characteristics**:
- Compose molecules and atoms
- May interact with use cases via props (not directly)
- Self-contained, reusable sections
- Domain-aware but not domain-dependent

### Templates

**Page-level layout containers.**

```typescript
// shared/components/templates/DashboardLayout/DashboardLayout.tsx
import { Navbar } from '@/shared/components/organisms/Navbar';
import { Sidebar } from '@/shared/components/organisms/Sidebar';
import { Footer } from '@/shared/components/organisms/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const DashboardLayout = ({ children, sidebar }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {sidebar && <aside className="w-64 border-r">{sidebar}</aside>}
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
};
```

**Characteristics**:
- Define page structure
- Slot content via children/render props
- No business logic
- Consistent layout across pages

## shadcn/ui Integration

### Installation Pattern

```bash
# Add shadcn/ui components
npx shadcn@latest add button card dialog input
```

### Usage Pattern

```typescript
// Import from shadcn folder
import { Button } from '@/shared/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/shared/components/shadcn/card';

// Use cn() for class merging
import { cn } from '@/shared/lib/utils';

<Button
  variant="outline"
  className={cn('w-full', isActive && 'bg-primary text-white')}
>
  Click me
</Button>
```

### Customization Pattern

```typescript
// Extend shadcn components in atoms when needed
// shared/components/atoms/PrimaryButton/PrimaryButton.tsx
import { Button, ButtonProps } from '@/shared/components/shadcn/button';
import { cn } from '@/shared/lib/utils';

interface PrimaryButtonProps extends ButtonProps {
  fullWidth?: boolean;
}

export const PrimaryButton = ({
  fullWidth,
  className,
  ...props
}: PrimaryButtonProps) => {
  return (
    <Button
      variant="default"
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    />
  );
};
```

## Tailwind CSS Patterns

### cn() Utility

```typescript
// shared/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Conditional Classes

```typescript
<div
  className={cn(
    'flex items-center p-4',
    isActive ? 'bg-primary text-white' : 'bg-gray-100',
    isDisabled && 'opacity-50 cursor-not-allowed',
    className
  )}
>
```

### Responsive Design

```typescript
<div className="flex flex-col md:flex-row lg:gap-8">
  <aside className="w-full md:w-64 lg:w-80" />
  <main className="flex-1 p-4 md:p-6 lg:p-8" />
</div>
```

## Component Props Patterns

### Base Props Interface

```typescript
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}
```

### Forwarding Refs

```typescript
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} className={cn('...', className)} {...props} />
        {error && <span className="text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Testing Pattern

### Component Test Structure

```typescript
// shared/components/atoms/Typography/Typography.test.tsx
import { render, screen } from '@testing-library/react';
import { Typography } from './Typography';

describe('Typography', () => {
  it('renders children correctly', () => {
    render(<Typography>Hello World</Typography>);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Typography variant="h1">Title</Typography>);

    const element = screen.getByText('Title');
    expect(element).toHaveClass('text-4xl', 'font-bold');
  });

  it('merges custom className', () => {
    render(<Typography className="custom-class">Text</Typography>);

    expect(screen.getByText('Text')).toHaveClass('custom-class');
  });

  it('renders as specified element', () => {
    render(<Typography as="h1">Heading</Typography>);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

### Using data-testid

```typescript
// Component
<Button data-testid="submit-button" onClick={onSubmit}>
  Submit
</Button>

// Test
const button = screen.getByTestId('submit-button');
await userEvent.click(button);
```

## Export Pattern

```typescript
// shared/components/atoms/Typography/index.ts
export { Typography } from './Typography';
export type { TypographyProps, TypographyVariant } from './Typography';

// shared/components/atoms/index.ts
export * from './Typography';
export * from './Button';
export * from './Input';

// Usage
import { Typography, Button, Input } from '@/shared/components/atoms';
```

## Anti-Patterns

```typescript
// ❌ BAD: Business logic in atom
export const UserAvatar = ({ userId }) => {
  const [user, setUser] = useState();
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(...); // NO!
  }, []);
};

// ❌ BAD: Hardcoded styles
<button style={{ backgroundColor: 'blue' }}>Click</button> // NO! Use Tailwind

// ❌ BAD: Not using cn() for class merging
<div className={`${baseClass} ${conditionalClass}`}>  // NO! Use cn()

// ❌ BAD: Inline complex logic
<div>
  {items.filter(i => i.active).map(i => ...)} // Move to parent or custom hook
</div>

// ❌ BAD: Atom depending on molecule
import { IconButton } from '../molecules/IconButton'; // Atoms can't import molecules!
```

## File Naming

- Components: `PascalCase.tsx`
- Tests: `ComponentName.test.tsx`
- Stories (if using Storybook): `ComponentName.stories.tsx`
- Index exports: `index.ts`
