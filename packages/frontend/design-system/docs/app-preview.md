# App Preview Components

The App Preview components provide a comprehensive solution for displaying running applications within an iframe, with full integration to the runner store for automatic URL detection and status management.

## Components

### `AppPreview`

The base app preview component that can display any URL in an iframe with controls.

#### Props

```typescript
interface AppPreviewProps {
  // URL of the running application
  url?: string;
  // Placeholder text when no URL is provided
  placeholder?: string;
  // Loading state
  isLoading?: boolean;
  // Whether to show the URL bar and controls
  showControls?: boolean;
  // Callback when iframe loads
  onLoad?: () => void;
  // Callback when iframe fails to load
  onError?: (error: string) => void;
}
```

#### Features

- **Full-size iframe**: Displays the application in a full-size iframe
- **URL controls**: Shows the current URL with refresh and external link buttons
- **Loading states**: Handles loading and error states gracefully
- **Security**: Uses appropriate iframe sandbox attributes
- **Responsive**: Adapts to container size

#### Usage

```tsx
import { AppPreview } from '@/design-system';

// Basic usage with URL
<AppPreview 
  url="http://localhost:3000"
  onLoad={() => console.log('App loaded')}
  onError={(error) => console.error('Failed to load:', error)}
/>

// Without URL (placeholder state)
<AppPreview 
  placeholder="Start your application to see preview"
  showControls={false}
/>

// Loading state
<AppPreview 
  url="http://localhost:3000"
  isLoading={true}
/>
```

### `ConnectedAppPreview`

A connected version that automatically integrates with the runner store to display the active running application.

#### Props

```typescript
interface ConnectedAppPreviewProps {
  // Props to pass through to AppPreview
  placeholder?: string;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}
```

#### Features

- **Automatic URL detection**: Reads URL from active runner process
- **State-aware placeholders**: Shows appropriate messages based on runner state
- **Real-time updates**: Updates automatically when runner state changes
- **Error handling**: Displays helpful messages when applications fail to start

#### Usage

```tsx
import { ConnectedAppPreview } from '@/design-system';

// Basic usage - automatically connects to runner store
<ConnectedAppPreview />

// With custom handlers
<ConnectedAppPreview 
  onLoad={() => console.log('Connected app loaded')}
  onError={(error) => console.error('App error:', error)}
/>

// Without controls
<ConnectedAppPreview showControls={false} />
```

## Integration with Runner Store

The components integrate with the runner store to automatically detect running applications:

1. **URL Detection**: Reads `serverInfo.serverUrl` from the active runner process
2. **Status Handling**: Responds to different process states:
   - `starting`: Shows loading state
   - `active`: Shows the application if URL is available
   - `error`: Shows error message
   - `stopped`: Shows stopped message

3. **Real-time Updates**: Automatically updates when:
   - Application starts/stops
   - URL becomes available
   - Process status changes

## States and Behaviors

### No URL State
- Shows placeholder message
- Dashed border styling
- No controls displayed (unless `showControls` is explicitly true)

### Loading State
- Shows loading overlay
- Spinner or loading message
- URL controls remain functional

### Active State
- Full iframe display
- URL controls with refresh and external link buttons
- Solid border styling

### Error State
- Error message overlay
- Option to retry
- Helpful troubleshooting text

## Styling

The components use the design system theme for consistent styling:

- **Colors**: Uses theme colors for borders, backgrounds, and text
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standard spacing units
- **Transitions**: Smooth hover and active states

### CSS Custom Properties

The components respect the following theme properties:

```typescript
colors: {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  // ... other theme colors
}
```

## Security Considerations

The iframe uses appropriate sandbox attributes for security:

```html
sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
```

This allows:
- Same-origin requests
- JavaScript execution
- Form submissions
- Popups and modals

But restricts:
- Top-level navigation
- Downloads
- Pointer lock

## Responsive Design

The components are fully responsive and will:
- Adapt to container size
- Maintain aspect ratio
- Handle small screens gracefully
- Keep controls accessible on mobile

## Accessibility

- **Keyboard navigation**: All controls are keyboard accessible
- **Screen readers**: Proper ARIA labels and semantic HTML
- **Focus management**: Clear focus indicators
- **Error messages**: Descriptive error messages for assistive technology

## Examples

### Basic Integration in a Layout

```tsx
import { ConnectedAppPreview, PreviewToolbar, PreviewType } from '@/design-system';
import { useState } from 'react';

function AppLayout() {
  const [activeType, setActiveType] = useState(PreviewType.APP);

  return (
    <div className="app-layout">
      <div className="sidebar">
        <PreviewToolbar 
          activeType={activeType}
          onTypeChange={setActiveType}
        />
      </div>
      <div className="main-content">
        {activeType === PreviewType.APP && (
          <ConnectedAppPreview />
        )}
        {/* Other preview types... */}
      </div>
    </div>
  );
}
```

### Custom URL Management

```tsx
import { AppPreview } from '@/design-system';
import { useState, useEffect } from 'react';

function CustomPreview() {
  const [url, setUrl] = useState<string>();
  const [loading, setLoading] = useState(false);

  const startApp = async () => {
    setLoading(true);
    try {
      // Your app starting logic
      const appUrl = await startMyApp();
      setUrl(appUrl);
    } catch (error) {
      console.error('Failed to start app:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={startApp}>Start App</button>
      <AppPreview 
        url={url}
        isLoading={loading}
        placeholder="Click 'Start App' to begin"
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Iframe not loading**
   - Check CORS headers on the target application
   - Ensure the URL is accessible
   - Check for X-Frame-Options headers

2. **Controls not showing**
   - Verify `showControls` prop is true
   - Check if URL is provided (controls only show with URL)

3. **Runner store not connecting**
   - Ensure runner service is running
   - Check WebSocket connection
   - Verify runner store is properly initialized

### Browser Compatibility

- Modern browsers (Chrome 80+, Firefox 74+, Safari 13+)
- WebSocket support required for runner store integration
- Iframe sandbox support required

## Performance Considerations

- Iframes are isolated and don't affect main application performance
- Loading states prevent layout shift
- Efficient re-rendering with React hooks
- Minimal bundle size impact