# @chara-codes/widget

An embeddable AI Widget component that brings intelligent coding assistance directly into web pages through interactive element selection and contextual AI interactions.

## Features

- 🎯 **Interactive Element Selection**: Click any element on a webpage to provide context to the AI
- 🌟 **Visual Highlighting**: Selected elements are visually highlighted with clear indicators
- 🤖 **AI-Powered Assistance**: Context-aware AI responses based on selected page elements
- 🔧 **Web Component**: Can be embedded in any website or web application
- ⚡ **Real-time Integration**: Seamless integration with Chara AI agents and providers
- 🎨 **Customizable UI**: Styled with Tailwind CSS and customizable theming
- 📱 **Responsive Design**: Works across desktop and mobile devices

## Installation

```bash
npm install @chara-codes/widget
```

## Quick Start

### As a Web Component

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with Chara AI Widget</title>
</head>
<body>
    <div id="my-app">
        <h1>My Application</h1>
        <p>Click on any element to get AI assistance!</p>
    </div>
    
    <!-- Chara AI Widget -->
    <chara-ai-widget></chara-ai-widget>
    
    <script type="module">
        import '@chara-codes/widget';
    </script>
</body>
</html>
```

### As a React Component

```tsx
import React from 'react';
import { CharaWidget } from '@chara-codes/widget';

function App() {
  return (
    <div>
      <h1>My React App</h1>
      <p>Content goes here...</p>
      
      <CharaWidget 
        apiEndpoint="http://localhost:3031"
        enableElementSelection={true}
        theme="dark"
      />
    </div>
  );
}

export default App;
```

## Element Selection

The widget enables users to interact with any element on the page:

1. **Activation**: Click the widget to enter selection mode
2. **Selection**: Hover over elements to preview, click to select
3. **Context**: Selected elements provide context including:
   - DOM structure and hierarchy
   - CSS styles and computed properties
   - Element attributes and data
   - Text content and accessibility information
4. **AI Interaction**: Ask questions or request assistance about selected elements

### Selection Features

- **Visual Preview**: Hover effects show what will be selected
- **Multi-Selection**: Select multiple elements for complex queries
- **Hierarchy Understanding**: AI understands element relationships
- **Style Analysis**: Detailed CSS and layout information
- **Accessibility Context**: ARIA attributes and semantic information

## Configuration

### Widget Props

```tsx
interface CharaWidgetProps {
  // Connection settings
  apiEndpoint?: string;           // Default: 'http://localhost:3031'
  websocketEndpoint?: string;     // Default: 'ws://localhost:3031/ws'
  
  // Feature toggles
  enableElementSelection?: boolean; // Default: true
  enableChat?: boolean;            // Default: true
  enableCodeGeneration?: boolean;  // Default: true
  
  // UI customization
  theme?: 'light' | 'dark' | 'auto'; // Default: 'auto'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large'; // Default: 'medium'
  
  // AI configuration
  defaultModel?: string;          // Default: 'openai:::gpt-4o'
  maxTokens?: number;            // Default: 4000
  temperature?: number;          // Default: 0.7
  
  // Callbacks
  onElementSelect?: (element: HTMLElement, context: ElementContext) => void;
  onResponse?: (response: string) => void;
  onError?: (error: Error) => void;
}
```

### Element Context

When an element is selected, the widget provides rich context:

```typescript
interface ElementContext {
  // Basic information
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  
  // DOM structure
  attributes: Record<string, string>;
  hierarchy: string[];
  siblings: ElementInfo[];
  children: ElementInfo[];
  
  // Styling
  computedStyles: CSSStyleDeclaration;
  boundingRect: DOMRect;
  
  // Accessibility
  ariaAttributes: Record<string, string>;
  role?: string;
  accessibleName?: string;
  
  // Semantic information
  semanticInfo: {
    isInteractive: boolean;
    isForm: boolean;
    isNavigation: boolean;
    isContent: boolean;
  };
}
```

## Use Cases

### 1. Design System Assistance

```tsx
// Help with component styling and improvements
<CharaWidget 
  onElementSelect={(element, context) => {
    console.log('Selected component:', context.tagName);
    console.log('Current styles:', context.computedStyles);
  }}
  defaultPrompt="Help me improve this component's design and accessibility"
/>
```

### 2. Debugging Support

```tsx
// Get help debugging layout and styling issues
<CharaWidget 
  enableElementSelection={true}
  defaultPrompt="What might be causing issues with this element?"
/>
```

### 3. Code Generation

```tsx
// Generate code based on selected elements
<CharaWidget 
  enableCodeGeneration={true}
  onResponse={(code) => {
    // Handle generated code
    navigator.clipboard.writeText(code);
  }}
/>
```

### 4. Accessibility Analysis

```tsx
// Get accessibility recommendations
<CharaWidget 
  defaultPrompt="Analyze this element for accessibility issues and provide recommendations"
/>
```

## API Integration

The widget integrates with Chara AI agents through REST and WebSocket APIs:

### REST API Endpoints

- `POST /api/chat` - Send chat messages with element context
- `GET /api/models` - Get available AI models
- `POST /api/analyze-element` - Analyze specific elements

### WebSocket Events

- `element:selected` - Element selection events
- `chat:message` - Real-time chat messages
- `ai:response` - Streaming AI responses
- `error` - Error notifications

## Styling and Theming

The widget uses Tailwind CSS and supports custom theming:

```css
/* Custom theme variables */
:root {
  --chara-widget-primary: #3b82f6;
  --chara-widget-secondary: #6b7280;
  --chara-widget-background: #ffffff;
  --chara-widget-border: #e5e7eb;
  --chara-widget-text: #1f2937;
}

/* Dark theme */
[data-theme="dark"] {
  --chara-widget-primary: #60a5fa;
  --chara-widget-secondary: #9ca3af;
  --chara-widget-background: #1f2937;
  --chara-widget-border: #374151;
  --chara-widget-text: #f9fafb;
}
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/chara-codes/chara.git
cd chara/packages/widget

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run type checking
bun run typecheck
```

### Development Server

The widget includes a development server with hot reload:

```bash
bun run dev
# Open http://localhost:3000 to see the widget in action
```

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

- **Content Security Policy**: Ensure your CSP allows the widget's scripts
- **CORS**: Configure your API endpoints to allow widget origins
- **API Keys**: Never expose API keys in client-side code
- **Element Access**: The widget only accesses DOM elements, not sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Apache License 2.0

Copyright (c) 2025 Chara Codes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See the main [LICENSE](../../LICENSE) file for details.