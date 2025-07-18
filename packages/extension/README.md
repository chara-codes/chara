# Chara Browser Extension

A powerful browser extension built with WXT and React that adds custom developer tools for character analysis and web page inspection.

## Features

- 🎭 **Custom DevTools Panel**: Integrated browser developer tools with Chara-specific functionality
- 🔍 **Page Analysis**: Real-time analysis of web page structure and content
- ⚡ **Script Execution**: Execute custom JavaScript in inspected pages
- 🎨 **Character Detection**: Detect and highlight character-related elements (coming soon)
- 📊 **Performance Monitoring**: Monitor page performance and optimization opportunities (coming soon)

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Load extension in browser:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select `.output/chrome-mv3-dev`

4. **Access DevTools panel:**
   - Open any webpage
   - Press F12 to open DevTools
   - Look for the "Chara" tab

### Production Build

```bash
npm run build
npm run zip  # Creates installable .zip file
```

## Browser Support

- ✅ Chrome (Manifest V3)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- 🚧 Firefox support: `npm run dev:firefox` / `npm run build:firefox`

## Extension Components

### DevTools Panel
Custom developer tools panel accessible via F12 → Chara tab
- View current tab information
- Execute scripts in the inspected page
- Real-time connection status
- Element inspection tools

### Background Script
Handles extension lifecycle and inter-component communication

### Content Script
Runs on Google.com pages for content analysis and interaction

### Popup
Quick access interface via the extension icon

## Development Commands

```bash
npm run dev          # Start development server (Chrome)
npm run dev:firefox  # Start development server (Firefox)
npm run build        # Build for production (Chrome)
npm run build:firefox # Build for production (Firefox)
npm run zip          # Create installable .zip
npm run compile      # TypeScript type checking
```

## File Structure

```
entrypoints/
├── devtools.ts              # DevTools entry point
├── devtools-panel/          # Custom DevTools panel
│   ├── index.html
│   ├── main.tsx
│   ├── DevToolsPanel.tsx
│   └── style.css
├── background.ts            # Background service worker
├── content.ts              # Content script
└── popup/                  # Extension popup
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    └── style.css
```

## Permissions

The extension requires these permissions:
- `tabs`: Access tab information
- `scripting`: Execute scripts in web pages
- `devtools`: Create custom developer tools panels

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test in both Chrome and Firefox if applicable
5. Submit a pull request

## Documentation

- [DevTools Usage Guide](./DEVTOOLS.md) - Detailed guide for using the DevTools panel
- [WXT Documentation](https://wxt.dev) - Framework documentation
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser API reference

## Tech Stack

- **Framework**: [WXT](https://wxt.dev) - Modern web extension framework
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Manifest**: V3 (latest Chrome extension standard)

## License

See the [LICENSE](../../LICENSE) file for details.