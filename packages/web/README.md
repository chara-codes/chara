# Chara Web

This package contains the web interface for the Chara AI chat application. It's built with Next.js, React, and Tailwind CSS, providing a modern and responsive UI for interacting with AI assistants.

## Features

- Split interface with chat panel and preview panel
- Markdown rendering for AI responses
- Code highlighting
- File tree navigation
- File change previews
- Command execution interface
- Regeneration and navigation of AI responses
- File attachment support
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- bun

### Installation

```bash
# Install dependencies from the root of the workspace
bun install
```

### Development

```bash
# Start the development server
bun dev
```

This will start the Next.js development server on http://localhost:3000.

### Building for Production

```bash
# Build the application
bun build

# Start the production server
bun start
```

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - React components
  - `ui/` - Shadcn UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and helpers
- `mocks/` - Mock data for development
- `public/` - Static assets
- `styles/` - Global CSS styles
- `types/` - TypeScript type definitions

## Key Components

### Chat Panel

The chat panel displays the conversation between the user and the AI assistant. It supports:

- Message history
- Message regeneration
- File attachments
- Code highlighting
- Markdown rendering

### Preview Panel

The preview panel shows:

- Code previews
- File changes
- Visual previews of content

### Split Interface

The interface can be resized by dragging the divider between the chat and preview panels. The preview panel can also be expanded to full screen.

## Development Notes

- The application uses the Vercel AI SDK for streaming responses
- UI components are built with Shadcn UI and styled with Tailwind CSS
- TypeScript is used throughout for type safety
- The app uses React Server Components where appropriate

## Related Packages

This web package is designed to work with the following packages in the Chara workspace:

- `@chara/server` - Backend server that powers the AI interactions

## License

MIT License

Copyright (c) 2025 Chara Codes

This project is licensed under the MIT License - see the main [LICENSE](../../LICENSE) file for details.
