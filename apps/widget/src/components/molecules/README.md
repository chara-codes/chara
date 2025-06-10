# Context Components - Molecule Level

This directory contains the molecular components that make up the context management system in the widget. These components have been refactored from the original monolithic `context-panel.tsx` to follow atomic design principles.

## Components Overview

### 📁 `context-item/`
**Main component for individual context items**

- `ContextItem` - Displays a single context item with icon, name, file size, and removal button
- Handles hover states and tooltip visibility
- Manages mouse interactions for tooltip display

```tsx
<ContextItem 
  item={contextItem} 
  onRemove={handleRemove} 
/>
```

### 🔍 `context-tooltip/`
**Tooltip component for context item details**

- `ContextItemTooltip` - Shows detailed file information in a hover tooltip
- Displays file name, type, size, and content status
- Integrates with `ContextPreview` for content previews

```tsx
<ContextItemTooltip 
  item={contextItem}
  isVisible={isHovered}
  className="context-tooltip"
/>
```

### 👁️ `context-preview/`
**Content preview component for different file types**

- `ContextPreview` - Renders appropriate preview based on file type
- Supports image thumbnails, text snippets, JSON formatting
- Handles SVG files with special text preview

```tsx
<ContextPreview item={contextItem} />
```

## Architecture

### Before Refactoring
The original `context-panel.tsx` was a monolithic component with ~300 lines containing:
- Context panel layout
- Individual context item rendering
- Tooltip display logic
- Preview content handling
- File type detection
- Styling for all components

### After Refactoring
The functionality is now split into focused, reusable molecules:

```
context-panel.tsx (Organism - 50 lines)
├── ContextItem (Molecule)
    ├── Icons (Atoms)
    ├── ContextItemTooltip (Molecule)
        └── ContextPreview (Molecule)
```

## File Type Support

### Images
- **Regular images**: Shows thumbnail preview (PNG, JPEG, GIF, WebP)
- **SVG files**: Shows opening SVG tag with attributes as text
- **Error handling**: Displays "Preview unavailable" for corrupted images

### Text Files
- **Plain text**: Shows first 30 characters with ellipsis
- **JSON**: Pretty-formatted with proper indentation
- **Code files**: Displays with monospace font and syntax context

### Binary Files
- Shows file metadata only
- No content preview for unsupported types

## Usage Examples

### Basic Context Item
```tsx
import { ContextItem } from '../molecules/context-item';

<ContextItem 
  item={{
    id: "1",
    name: "package.json",
    type: "File",
    content: '{"name": "my-app"}',
    mimeType: "application/json"
  }}
  onRemove={(id) => removeItem(id)}
/>
```

### Custom Tooltip
```tsx
import { ContextItemTooltip } from '../molecules/context-tooltip';

<ContextItemTooltip
  item={fileItem}
  isVisible={showTooltip}
  className="custom-tooltip"
/>
```

### Standalone Preview
```tsx
import { ContextPreview } from '../molecules/context-preview';

<ContextPreview 
  item={{
    content: "console.log('hello');",
    mimeType: "application/javascript",
    name: "script.js"
  }} 
/>
```

## Styling Approach

### Styled Components
Each molecule uses styled-components for consistent theming:
- Dark tooltips with light text
- Consistent spacing and typography
- Hover transitions and animations
- Responsive max-widths

### Theme Variables
```scss
// Colors
Background: #1f2937 (tooltip)
Text: white (tooltip text)
Secondary: #9ca3af (file info)
Border: #374151 (preview sections)

// Dimensions
Tooltip max-width: 300px
Image preview: 120x80px max
Text preview: 60px max-height
```

## Integration with Parent Components

### Context Panel (Organism)
```tsx
// Simple, clean organism component
const ContextPanel = ({ contextItems, onRemoveContext }) => (
  <Container>
    <ContextList>
      {contextItems.map(item => (
        <ContextItem 
          key={item.id}
          item={item} 
          onRemove={onRemoveContext} 
        />
      ))}
    </ContextList>
  </Container>
);
```

### Message Bubble Integration
Can be reused in message bubbles or other components:
```tsx
import { ContextPreview } from './molecules/context-preview';

// In message bubble component
{message.contextItems?.map(item => (
  <ContextPreview key={item.id} item={item} />
))}
```

## Benefits of Refactoring

### 🔧 **Maintainability**
- Each component has a single responsibility
- Easier to test individual components
- Clear separation of concerns

### 🔄 **Reusability**
- Components can be used in different contexts
- Preview component works standalone
- Tooltip logic is extracted and reusable

### 📖 **Readability**
- Main context panel is now ~50 lines instead of ~300
- Each file focuses on one specific functionality
- Clear component hierarchy

### 🧪 **Testability**
- Components can be tested in isolation
- Easier to mock specific behaviors
- Unit tests can focus on single responsibilities

### 🎨 **Customization**
- Easier to customize individual parts
- Style overrides are more targeted
- Component composition allows for flexible layouts

## Future Enhancements

### Potential Improvements
- Add animation transitions for tooltip appearance
- Support for more file types (video thumbnails, PDF previews)
- Accessibility improvements (ARIA labels, keyboard navigation)
- Lazy loading for large image previews
- Virtualization for large context lists

### Extension Points
- Custom preview renderers for specific file types
- Pluggable tooltip content providers
- Theme customization through props
- Integration with external preview services