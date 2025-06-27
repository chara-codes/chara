# agents

Agent tools for the Chara AI system, including web fetching with llms.txt support.

## Features

- **Web Fetching**: Fetch and process web content with automatic HTML to Markdown conversion
- **llms.txt Support**: Automatic detection and preference for [llms.txt](https://llmstxt.org/) files when available
- **File System Operations**: Complete file and directory management
- **Terminal Commands**: Execute shell commands safely
- **Code Analysis**: TypeScript and ESLint diagnostics

## Installation

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

## llms.txt Support

The fetch tool now includes support for the [llms.txt standard](https://llmstxt.org/), which provides structured information specifically designed for Large Language Models. When fetching a URL, the tool will automatically check for and prefer llms.txt content when available, providing more relevant and structured information.

See `src/tools/FETCH_LLMSTXT.md` for detailed documentation and examples.

This project was created using `bun init` in bun v1.2.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
