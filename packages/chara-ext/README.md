# Chara Extension - Side Panel Browser Extension

A modern browser extension built with WXT, React, and TypeScript that provides a convenient side panel interface accessible by clicking the extension icon.

## Features

- **Side Panel Interface**: Clean, modern side panel that slides in from the right
- **Cross-Browser Support**: Works in Chrome, Edge, and other Chromium-based browsers
- **Fallback Implementation**: Graceful fallback for browsers without native side panel API
- **Responsive Design**: Adapts to different screen sizes and supports dark mode
- **Multiple Tabs**: Home, Settings, and About sections
- **Keyboard Navigation**: Supports Escape key to close panel
- **Smooth Animations**: Polished slide-in/slide-out transitions

## How It Works

When you click the extension icon:

1. **Modern Browsers (Chrome 114+)**: Uses the native `chrome.sidePanel` API for optimal performance
2. **Fallback Mode**: Injects a content script that creates an iframe-based side panel for broader compatibility

## Installation

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` folder

### Production Build

```bash
npm run build
npm run zip
```

## Project Structure

```
chara-ext/
├── entrypoints/
│   ├── background.ts          # Service worker handling extension logic
│   ├── content.ts            # Content script for fallback implementation
│   └── sidepanel/            # Side panel React application
│       ├── App.tsx           # Main side panel component
│       ├── App.css           # Component-specific styles
│       ├── style.css         # Global side panel styles
│       ├── main.tsx          # React entry point
│       └── index.html        # Side panel HTML template
├── assets/                   # Static assets
├── public/                   # Public assets
└── wxt.config.ts            # WXT configuration
```

## Configuration

The extension is configured in `wxt.config.ts` with:

- **Permissions**: `activeTab`, `scripting`, `sidePanel`
- **Side Panel**: Default path to `sidepanel.html`
- **Web Accessible Resources**: Side panel assets
- **Content Scripts**: Injected on all URLs for fallback support

## Usage

1. Click the extension icon in the browser toolbar
2. The side panel will slide in from the right
3. Navigate between tabs using the navigation buttons
4. Close the panel by:
   - Clicking the ✕ button
   - Pressing the Escape key
   - Clicking the extension icon again (in fallback mode)

## Browser Compatibility

- **Chrome 114+**: Full native side panel support
- **Chrome 88-113**: Fallback iframe implementation
- **Edge**: Full support (Chromium-based)
- **Firefox**: Content script fallback (experimental)

## Development Commands

- `npm run dev` - Start development server
- `npm run dev:firefox` - Development for Firefox
- `npm run build` - Production build
- `npm run build:firefox` - Production build for Firefox
- `npm run zip` - Create distribution zip
- `npm run compile` - TypeScript compilation check

## Customization

### Adding New Tabs

1. Add tab configuration in `sidepanel/App.tsx`:
   ```tsx
   const tabs = [
     // ... existing tabs
     { id: 'newtab', label: 'New Tab', icon: '🆕' },
   ];
   ```

2. Add tab content in the render section:
   ```tsx
   {activeTab === 'newtab' && (
     <div className="tab-content">
       <h3>New Tab Content</h3>
       {/* Your content here */}
     </div>
   )}
   ```

### Styling

- Modify `sidepanel/style.css` for global side panel styles
- Edit `sidepanel/App.css` for component-specific styles
- Dark mode styles are included and activated automatically

### Adding Functionality

- Extend the background script (`background.ts`) for new browser API interactions
- Add message handling in both content script and side panel for communication
- Use Chrome extension APIs through the `chrome` global object

## Technical Details

### Side Panel API

The extension uses Chrome's Side Panel API when available:

```typescript
chrome.sidePanel.open({ tabId: tab.id });
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

### Fallback Implementation

For browsers without native support, the extension:

1. Injects a content script on all pages
2. Creates a positioned iframe with the side panel content
3. Handles messaging between iframe and parent page
4. Manages animations and user interactions

### Security

- All resources are properly declared in `web_accessible_resources`
- Content Security Policy compatible
- No eval() or unsafe JavaScript execution
- Secure message passing between contexts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in multiple browsers
5. Submit a pull request

## License

MIT License - see LICENSE file for details