# Element Selector Module

A comprehensive, modular element selection system for web applications with multi-framework support.

## Overview

The Element Selector module provides functionality to highlight, select, and annotate DOM elements on web pages. It has been completely refactored from a monolithic 1300+ line hook into a modular, maintainable architecture with clear separation of concerns.

## Key Features

- 🎯 **Interactive Element Selection**: Click-to-select any DOM element with visual feedback
- 🔍 **Framework Detection**: Automatic detection of React, Vue, Angular components
- 💬 **Element Annotation**: Add comments and metadata to selected elements
- 🎨 **Customizable UI**: Fully configurable styling and behavior
- 🏗️ **Modular Architecture**: Clean separation between logic, UI, and services
- 🔧 **TypeScript Support**: Full type safety throughout the module
- 📱 **Responsive Design**: Works across different screen sizes and devices

## Architecture

### Before Refactoring
```
use-element-selector.ts (1362 lines)
├── All UI creation logic
├── All event handling
├── All component detection
├── All modal management
└── All styling utilities
```

### After Refactoring
```
element-selector/
├── types/                    # Type definitions
│   └── index.ts
├── services/                 # Business logic
│   └── component-detection/
│       ├── base-detector.ts
│       ├── react-detector.ts
│       ├── vue-detector.ts
│       └── index.ts
├── components/              # UI components
│   ├── cursor-follower.ts
│   ├── selection-guide.ts
│   ├── tag-display.ts
│   ├── comment-modal.ts
│   └── element-selector-ui.ts
├── handlers/               # Event management
│   ├── selection-handlers.ts
│   └── modal-handlers.ts
├── utils/                  # Utilities
│   ├── dom-utils.ts
│   └── style-utils.ts
├── use-element-selector.ts # Main hook (orchestration)
└── index.ts               # Public API
```

## Benefits of Refactoring

### 1. **Maintainability**
- **Before**: Single 1362-line file with mixed concerns
- **After**: 20+ focused files, each under 500 lines
- Each module has a single responsibility
- Easy to locate and fix bugs

### 2. **Testability**
- **Before**: Difficult to test individual features
- **After**: Each service and component can be tested in isolation
- Mock dependencies easily
- Better test coverage possible

### 3. **Extensibility**
- **Before**: Adding new frameworks required modifying core logic
- **After**: Simply create new detector classes extending `BaseComponentDetector`
- Plugin-like architecture for framework support

### 4. **Reusability**
- **Before**: Tightly coupled components
- **After**: Components can be used independently
- UI components can be reused in other contexts

### 5. **Framework Support**
- **Before**: Only React detection
- **After**: Built-in support for React, Vue, Angular with extensible architecture

## Quick Start

### Basic Usage

```typescript
import { useElementSelector } from './hooks/element-selector';

function MyComponent() {
  const { startElementSelection, isSelectingElement } = useElementSelector(
    (contextItem) => {
      console.log('Element added to context:', contextItem);
    }
  );

  return (
    <button onClick={startElementSelection}>
      {isSelectingElement ? 'Selecting...' : 'Select Element'}
    </button>
  );
}
```

### Advanced Usage

```typescript
import {
  useElementSelector,
  ElementSelectorUI,
  componentDetectionService,
  UI_CONFIG_PRESETS
} from './hooks/element-selector';

// Custom configuration
function AdvancedComponent() {
  const selector = useElementSelector(handleAddContext);
  
  // Update UI theme
  selector.updateConfig(UI_CONFIG_PRESETS.DARK);
  
  // Access detection service directly
  const frameworks = componentDetectionService.detectFrameworks();
  
  return (
    <div>
      <p>Detected frameworks: {frameworks.join(', ')}</p>
      <button onClick={selector.startElementSelection}>
        Start Selection
      </button>
    </div>
  );
}
```

### Custom Component Detector

```typescript
import { BaseComponentDetector } from './hooks/element-selector';

class AngularDetector extends BaseComponentDetector {
  framework = 'angular';
  
  canDetect(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('ng-controller') ||
      element.getAttribute('ng-app') ||
      element.closest('[ng-app]')
    );
  }
  
  detectComponent(element: HTMLElement) {
    // Implementation for Angular component detection
    return {
      componentName: this.extractAngularComponentName(element),
      componentPath: this.generateDefaultPath(componentName, 'ts'),
      framework: 'angular'
    };
  }
}

// Register custom detector
componentDetectionService.registerDetector(new AngularDetector());
```

## API Reference

### Main Hook

#### `useElementSelector(onAddContext: Function)`

Main hook for element selection functionality.

**Parameters:**
- `onAddContext`: Callback when element is added to context

**Returns:**
- `isSelectingElement`: Boolean indicating selection mode
- `selectedElement`: Currently selected element
- `showCommentModal`: Boolean indicating modal visibility
- `elementComment`: Current comment text
- `startElementSelection()`: Start selection mode
- `endElementSelection()`: End selection mode
- `setElementComment(comment)`: Set comment text

### Components

#### `ElementSelectorUI`
Main UI orchestrator managing all visual components.

#### `CursorFollower`
Crosshair cursor that follows mouse during selection.

#### `SelectionGuide`
Instruction banner shown during selection.

#### `TagDisplay`
Element information tooltip following mouse.

#### `CommentModal`
Modal for adding comments to selected elements.

### Services

#### `ComponentDetectionService`
Service for detecting framework components.

**Methods:**
- `detectComponent(element)`: Detect component info from element
- `registerDetector(detector)`: Add custom detector
- `detectFrameworks()`: Get detected frameworks on page

### Configuration

#### UI Config Presets

```typescript
import { UI_CONFIG_PRESETS } from './hooks/element-selector';

// Available presets:
UI_CONFIG_PRESETS.DEFAULT   // Blue theme
UI_CONFIG_PRESETS.DARK      // Dark theme
UI_CONFIG_PRESETS.LIGHT     // Light theme
UI_CONFIG_PRESETS.SUCCESS   // Green theme
UI_CONFIG_PRESETS.WARNING   // Orange theme
UI_CONFIG_PRESETS.ERROR     // Red theme
```

#### Custom Configuration

```typescript
const customConfig = {
  primaryColor: '#8b5cf6',
  textColor: 'white',
  borderColor: '#a78bfa',
  backgroundColor: 'rgba(139, 92, 246, 0.2)',
  zIndexBase: 2147483640
};

selector.updateConfig(customConfig);
```

## Migration Guide

### From Old Hook

**Before:**
```typescript
const {
  isSelectingElement,
  startElementSelection,
  detectComponentInfo
} = useElementSelector(onAddContext);
```

**After:**
```typescript
// Same API - no changes needed!
const {
  isSelectingElement,
  startElementSelection,
  detectComponentInfo
} = useElementSelector(onAddContext);

// But now you also have access to:
const {
  updateConfig,
  getConfig,
  forceCleanup
} = useElementSelector(onAddContext);
```

The public API remains the same for backward compatibility.

## Performance Improvements

### Event Handling Optimization
- **Throttled mouse events**: Limited to 60fps for smooth performance
- **Debounced highlighting**: Reduces DOM manipulation frequency
- **Efficient cleanup**: Proper removal of all event listeners

### Memory Management
- **Proper service disposal**: All services clean up their resources
- **Reference cleanup**: Prevents memory leaks from DOM references
- **Event listener management**: Automatic cleanup on unmount

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Framework Detection

### React
- Detects React Fiber internals
- Supports function components, class components
- Handles forwardRef and memo components
- Extracts component names and display names

### Vue
- Vue 2 and Vue 3 support
- Detects component instances and options
- Handles scoped CSS and directives
- Extracts component names from various sources

### Angular
- Detects Angular directives and components
- Supports component metadata extraction
- Handles dependency injection patterns

## Best Practices

### Custom Detectors
1. Extend `BaseComponentDetector` for consistency
2. Implement `canDetect()` for reliable detection
3. Use framework-specific patterns for accuracy
4. Provide meaningful component names and paths

### Performance
1. Use configuration presets when possible
2. Avoid frequent config updates during selection
3. Clean up properly using `forceCleanup()` if needed

### Accessibility
1. The selection mode temporarily disables normal interactions
2. Provides keyboard shortcuts (ESC to cancel)
3. Clear visual feedback for selection state

## Contributing

When contributing to this module:

1. **Keep files focused**: Each file should have a single responsibility
2. **Update types**: Always update TypeScript interfaces when adding features
3. **Add tests**: Test new detectors and components thoroughly
4. **Document changes**: Update this README for API changes
5. **Follow patterns**: Use established patterns for new components/services

## License

Part of the Chara project. See main project license for details.