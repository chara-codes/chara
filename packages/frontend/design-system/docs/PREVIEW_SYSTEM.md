# Preview System Documentation

A modular preview system built with React and styled-components that provides different types of content previews with an integrated toolbar.

## Overview

The Preview System consists of a main `PreviewPanel` organism that orchestrates multiple preview molecules. Each preview type is implemented as a separate molecule for better maintainability and reusability.

## Architecture

```
PreviewPanel (Organism)
├── PreviewToolbar (Molecule)
└── Preview Content (Molecules)
    ├── AppPreview
    ├── CodePreview
    ├── TestsPreview
    ├── StatisticsPreview
    ├── DocumentationPreview
    └── DeploymentPreview
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { PreviewPanel, PreviewType } from '@chara-codes/design-system';

const MyComponent = () => {
  const [activePreviewType, setActivePreviewType] = useState<PreviewType>(
    PreviewType.APP
  );

  return (
    <PreviewPanel
      activeType={activePreviewType}
      onTypeChange={setActivePreviewType}
    />
  );
};
```

## Preview Molecules

### AppPreview

Displays application preview with placeholder content.

```tsx
import { AppPreview } from '@chara-codes/design-system';

<AppPreview 
  placeholder="Custom placeholder text"
  isLoading={false}
/>
```

**Props:**
- `placeholder?: string` - Custom placeholder text
- `isLoading?: boolean` - Show loading state

### CodePreview

Displays code with syntax highlighting in a monospace container.

```tsx
import { CodePreview } from '@chara-codes/design-system';

<CodePreview 
  code={myCodeString}
  language="typescript"
  isLoading={false}
/>
```

**Props:**
- `code?: string` - Code content to display
- `language?: string` - Programming language (for future syntax highlighting)
- `isLoading?: boolean` - Show loading state

### TestsPreview

Displays test results with pass/fail indicators and summary.

```tsx
import { TestsPreview } from '@chara-codes/design-system';

const testResults = [
  {
    id: '1',
    name: 'Component renders correctly',
    passed: true,
    duration: 15
  },
  // ... more tests
];

<TestsPreview 
  tests={testResults}
  isLoading={false}
  totalTests={10}
  passedTests={8}
/>
```

**Props:**
- `tests?: TestResult[]` - Array of test results
- `isLoading?: boolean` - Show loading state
- `totalTests?: number` - Total number of tests
- `passedTests?: number` - Number of passed tests

**TestResult Interface:**
```tsx
interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
}
```

### StatisticsPreview

Displays project statistics in a responsive grid layout.

```tsx
import { StatisticsPreview } from '@chara-codes/design-system';

const stats = [
  {
    id: '1',
    label: 'Components',
    value: 12,
    description: 'Reusable UI components',
    trend: 'up',
    trendValue: '+2 this week'
  },
  // ... more stats
];

<StatisticsPreview 
  stats={stats}
  isLoading={false}
  title="Project Statistics"
/>
```

**Props:**
- `stats?: StatData[]` - Array of statistics
- `isLoading?: boolean` - Show loading state
- `title?: string` - Statistics section title

**StatData Interface:**
```tsx
interface StatData {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}
```

### DocumentationPreview

Displays documentation sections with code examples.

```tsx
import { DocumentationPreview } from '@chara-codes/design-system';

const docSections = [
  {
    id: '1',
    title: 'Getting Started',
    content: 'Documentation content here...',
    codeExample: 'npm run dev'
  },
  // ... more sections
];

<DocumentationPreview 
  sections={docSections}
  isLoading={false}
  title="Documentation"
/>
```

**Props:**
- `sections?: DocSection[]` - Array of documentation sections
- `isLoading?: boolean` - Show loading state
- `title?: string` - Documentation title

**DocSection Interface:**
```tsx
interface DocSection {
  id: string;
  title: string;
  content: string;
  codeExample?: string;
}
```

### DeploymentPreview

Displays deployment environments with status indicators.

```tsx
import { DeploymentPreview } from '@chara-codes/design-system';

const environments = [
  {
    id: '1',
    name: 'Production',
    status: 'success',
    statusText: 'Online',
    description: 'Last deployed 2 hours ago',
    url: 'https://app.example.com',
    version: 'v1.2.3'
  },
  // ... more environments
];

<DeploymentPreview 
  environments={environments}
  isLoading={false}
  title="Deployment Status"
/>
```

**Props:**
- `environments?: DeploymentEnvironment[]` - Array of deployment environments
- `isLoading?: boolean` - Show loading state
- `title?: string` - Deployment section title

**DeploymentEnvironment Interface:**
```tsx
interface DeploymentEnvironment {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'info';
  statusText: string;
  description: string;
  url?: string;
  lastDeployedAt?: string;
  version?: string;
}
```

## Preview Types

```tsx
enum PreviewType {
  APP = "app",
  CODE = "code", 
  TESTS = "tests",
  STATISTICS = "statistics",
  DOCUMENTATION = "documentation",
  DEPLOYMENT = "deployment",
}
```

## Styling & Theming

All preview molecules use the design system theme for consistent styling:

- **Colors**: Uses theme colors for backgrounds, borders, text, and status indicators
- **Typography**: Consistent font sizes and weights across components
- **Spacing**: Uses theme spacing tokens for padding and margins
- **Responsive**: Grid layouts adapt to different screen sizes

## Benefits of Modular Approach

1. **Reusability**: Each preview molecule can be used independently
2. **Maintainability**: Easier to update and extend individual preview types
3. **Testing**: Each molecule can be tested in isolation
4. **Performance**: Better code splitting and bundle optimization
5. **Flexibility**: Easy to customize or replace individual preview types

## Migration from Legacy

If migrating from the old monolithic preview implementation:

1. Replace inline preview content with individual molecules
2. Update imports to use new molecule exports
3. Pass appropriate props to customize each preview type
4. Remove duplicate styled components

## Custom Preview Types

To add a new preview type:

1. Create a new molecule in `src/molecules/`
2. Export it from `src/molecules/index.ts`
3. Add the new preview type to the `PreviewType` enum
4. Update the `PreviewPanel` to handle the new type
5. Add the molecule import to `PreviewPanel`

## Example: Custom Preview

```tsx
// src/molecules/my-custom-preview.tsx
export const MyCustomPreview: React.FC<MyCustomPreviewProps> = (props) => {
  return (
    <CustomContainer>
      {/* Custom preview content */}
    </CustomContainer>
  );
};

// Add to PreviewPanel
case PreviewType.CUSTOM:
  return <MyCustomPreview />;
```
