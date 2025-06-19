# PreviewPanel Organism

A comprehensive preview panel component that combines different preview types with a toolbar for switching between them.

## Overview

The `PreviewPanel` organism provides a unified interface for displaying different types of content previews including app previews, code views, tests, statistics, documentation, and deployment information. It includes an integrated toolbar for switching between preview types.

## Usage

```tsx
import React, { useState } from 'react';
import { PreviewPanel, PreviewType } from '@chara/design-system';

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

## Props

### PreviewPanelProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeType` | `PreviewType` | Yes | The currently active preview type |
| `onTypeChange` | `(type: PreviewType) => void` | Yes | Callback function called when preview type changes |

## Preview Types

The component supports the following preview types:

- `PreviewType.APP` - App preview with placeholder content
- `PreviewType.CODE` - Code editor view with syntax highlighting
- `PreviewType.TESTS` - Test results display with pass/fail indicators
- `PreviewType.STATISTICS` - Statistics dashboard with cards
- `PreviewType.DOCUMENTATION` - Documentation sections
- `PreviewType.DEPLOYMENT` - Deployment status information

## Features

- **Responsive Layout**: Adapts to different screen sizes
- **Integrated Toolbar**: Built-in toolbar for switching between preview types
- **Themed Styling**: Uses the design system theme for consistent appearance
- **Type Safety**: Full TypeScript support with proper type definitions

## Styling

The component uses styled-components and follows the design system theme. Key styled components include:

- `PreviewContainer` - Main container with flex layout
- `PreviewContent` - Content area with padding and scroll
- `ToolbarColumn` - Right-side toolbar column
- Various preview-specific containers (`AppPreview`, `CodePreview`, etc.)

## Integration

This organism was moved from the web package to provide better reusability across the application. It combines the preview content rendering logic with the preview toolbar for a complete preview solution.

## Example with Custom Content

```tsx
// Future enhancement: Support for custom content providers
const CustomPreviewPanel = () => {
  const [activeType, setActiveType] = useState(PreviewType.CODE);

  return (
    <div style={{ height: '100vh' }}>
      <PreviewPanel
        activeType={activeType}
        onTypeChange={setActiveType}
      />
    </div>
  );
};
```

## Migration Notes

If migrating from the old inline preview implementation:

1. Replace inline `renderPreviewContent()` logic with `<PreviewPanel />`
2. Replace separate `<PreviewToolbar />` usage with the integrated toolbar
3. Remove custom styled components that are now included in the organism
4. Update imports to use `PreviewPanel` from `@chara/design-system`

## Dependencies

- React
- styled-components
- @chara/design-system theme system
- PreviewToolbar molecule
- Various icon components