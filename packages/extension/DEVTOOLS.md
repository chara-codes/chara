# Chara DevTools Extension

This extension adds a custom developer tools panel to your browser, allowing you to inspect and interact with web pages using Chara's functionality.

## Installation & Setup

### Development Mode

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3-dev` folder from this project

3. **Access the DevTools panel:**
   - Open any website
   - Press `F12` or right-click and select "Inspect"
   - Look for the "Chara" tab in the DevTools panel

### Production Build

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load the production build:**
   - Follow the same steps as development mode
   - Select the `.output/chrome-mv3` folder instead

## Features

### Current Features

- **Tab Information Display**: Shows current tab ID, URL, and title
- **Script Execution**: Execute custom JavaScript in the inspected page
- **Element Inspection**: Quick inspection of page elements
- **Real-time Connection Status**: Visual indicator of DevTools connection

### Planned Features

- **🔍 Page Analysis**: Analyze page structure and content
- **🎨 Character Detection**: Detect and highlight character-related elements
- **⚡ Performance Monitoring**: Monitor page performance and optimization opportunities

## Usage

### Basic Operations

1. **View Tab Information**: The panel automatically displays information about the currently inspected tab
2. **Execute Test Script**: Click "Execute Test Script" to run a sample script in the page console
3. **Inspect Elements**: Click "Inspect Body Element" to focus on the page's body element

### Development

The DevTools panel is built with React and supports hot reloading during development. Any changes to the panel code will automatically refresh the DevTools interface.

### Browser Support

- ✅ Chrome (Manifest V3)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- 🚧 Firefox (coming soon with `npm run dev:firefox`)

## File Structure

```
entrypoints/
├── devtools.ts                    # DevTools entry point
├── devtools-panel/
│   ├── index.html                # Panel HTML template
│   ├── main.tsx                  # React entry point
│   ├── DevToolsPanel.tsx         # Main panel component
│   └── style.css                 # Panel styles
├── background.ts                 # Background script
├── content.ts                    # Content script
└── popup/                        # Extension popup
```

## API Reference

### Browser DevTools APIs Used

- `browser.devtools.panels.create()` - Creates the custom panel
- `browser.devtools.inspectedWindow.eval()` - Executes scripts in the inspected page
- `browser.devtools.inspectedWindow.tabId` - Gets the current tab ID
- `browser.devtools.network.onNavigated` - Listens for page navigation

### Custom Components

#### DevToolsPanel Component

Main React component that renders the DevTools interface.

**State:**
- `tabInfo`: Current tab information (id, url, title)
- `isConnected`: Connection status to the inspected page

**Methods:**
- `executeScript()`: Executes a test script in the page
- `inspectElement()`: Focuses on a specific page element

## Troubleshooting

### DevTools Panel Not Showing

1. Make sure the extension is loaded and enabled
2. Refresh the page you're inspecting
3. Close and reopen DevTools
4. Check the browser console for any error messages

### Script Execution Errors

- Ensure the target page allows script execution
- Check Content Security Policy (CSP) restrictions
- Verify the page is fully loaded before executing scripts

### Development Issues

- Make sure the development server is running (`npm run dev`)
- Check for TypeScript errors in the terminal
- Verify all dependencies are installed (`npm install`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes to the DevTools panel
4. Test in both development and production builds
5. Submit a pull request

## Security Considerations

The extension requires the following permissions:
- `tabs`: To access tab information
- `scripting`: To execute scripts in web pages
- Access to `devtools` APIs for panel functionality

These permissions are necessary for the DevTools functionality but should be used responsibly.