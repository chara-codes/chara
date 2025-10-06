# Chara Codes - AI-Powered Development Assistant

A Chrome extension built with WXT, React, and TypeScript that helps frontend developers analyze and understand web page elements. Select any element on a webpage and instantly extract its HTML structure, CSS styles, and content with AI-powered assistance.

## Features

- **Visual Element Selection**: Click to select any element on any webpage with visual highlighting
- **HTML/CSS Extraction**: Instantly extract complete HTML structure and applied CSS styles
- **AI-Powered Assistant**: Ask questions and get help with selected elements
- **Side Panel Interface**: Non-intrusive side panel that doesn't block your work
- **Dark Mode Support**: Comfortable coding interface with theme support
- **Privacy First**: All data processing happens locally - nothing leaves your browser
- **Developer Tools**: Built specifically for frontend developers and learners

## How It Works

1. Click the Chara Codes extension icon to open the side panel
2. Click "Select Element" to activate the element picker
3. Hover over any element on the webpage (it will be highlighted)
4. Click the element to extract its HTML, CSS, and content
5. View extracted data in the side panel and interact with AI assistant

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