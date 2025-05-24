"use client"

import type { Chat, Model } from "../store/types"

// Direct mock data that can be used if fetch fails
export const mockChats: Chat[] = [
  {
    id: "1",
    title: "GitHub Actions Docker Container Deployment",
    timestamp: "10.05.2025 07:06",
    messages: [],
  },
  {
    id: "2",
    title: "Fixing Deploy Script Bash Errors",
    timestamp: "08.05.2025 14:26",
    messages: [],
  },
]

export const mockModels: Model[] = [
  {
    id: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet Thinking",
    provider: "Anthropic",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
  },
]

export const mockResponse = {
  content:
    "I've analyzed your request and made the necessary changes to the codebase. Here's a summary of the key changes:",
  filesToChange: [
    "src/components/Header.tsx",
    "src/styles/theme.ts",
    "package.json",
    "src/components/Button.tsx",
    "src/utils/helpers.ts",
  ],
  commandsToExecute: [
    "npm install @headlessui/react",
    "npm run build",
    "git commit -am 'Update components and add new features'",
  ],
  fileStructure: {
    name: "project",
    path: "/",
    type: "directory" as const,
    children: [
      {
        name: "src",
        path: "/src",
        type: "directory" as const,
        children: [
          {
            name: "components",
            path: "/src/components",
            type: "directory" as const,
            children: [
              {
                name: "Header.tsx",
                path: "/src/components/Header.tsx",
                type: "file" as const,
                language: "typescript",
                hasChanges: true
              },
              {
                name: "Button.tsx",
                path: "/src/components/Button.tsx",
                type: "file" as const,
                language: "typescript",
                hasChanges: true
              }
            ]
          },
          {
            name: "styles",
            path: "/src/styles",
            type: "directory" as const,
            children: [
              {
                name: "theme.ts",
                path: "/src/styles/theme.ts",
                type: "file" as const,
                language: "typescript",
                hasChanges: true
              }
            ]
          },
          {
            name: "utils",
            path: "/src/utils",
            type: "directory" as const,
            children: [
              {
                name: "helpers.ts",
                path: "/src/utils/helpers.ts",
                type: "file" as const,
                language: "typescript",
                hasChanges: true
              }
            ]
          }
        ]
      },
      {
        name: "package.json",
        path: "/package.json",
        type: "file" as const,
        language: "json",
        hasChanges: true
      }
    ]
  },
  executedCommands: [
    {
      id: "cmd-1",
      command: "npm install @headlessui/react",
      output: "+ @headlessui/react@1.7.15\nAdded 1 package in 2.5s",
      status: "success",
      timestamp: "12:30 PM",
    },
    {
      id: "cmd-2",
      command: "npm run build",
      output: "> project@1.0.0 build\n> next build\n\nCompiling...\nCompiled successfully!",
      status: "success",
      timestamp: "12:31 PM",
    },
    {
      id: "cmd-3",
      command: "git commit -am 'Update components and add new features'",
      output:
        "[main a1b2c3d] Update components and add new features\n 5 files changed, 87 insertions(+), 24 deletions(-)",
      status: "success",
      timestamp: "12:32 PM",
    },
  ],
  fileDiffs: [
    // 1. Modified file - Header.tsx (significant changes)
    {
      id: "diff-1",
      filePath: "/src/components/Header.tsx",
      fileName: "Header.tsx",
      language: "typescript",
      status: "pending" as const,
      originalContent:
        'import React from \'react\';\n\nconst Header = () => {\nreturn (\n  <header className="bg-gray-100 p-4">\n    <div className="container mx-auto">\n      <h1 className="text-xl font-bold">My App</h1>\n      <nav>\n        <ul className="flex space-x-4">\n          <li><a href="/">Home</a></li>\n          <li><a href="/about">About</a></li>\n          <li><a href="/contact">Contact</a></li>\n        </ul>\n      </nav>\n    </div>\n  </header>\n);\n};\n\nexport default Header;',
      newContent:
        'import React, { useState } from \'react\';\nimport { Menu } from \'@headlessui/react\';\n\nconst Header = () => {\nconst [isOpen, setIsOpen] = useState(false);\n\nreturn (\n  <header className="bg-blue-600 text-white p-4">\n    <div className="container mx-auto flex justify-between items-center">\n      <h1 className="text-2xl font-bold">My App</h1>\n      \n      {/* Mobile menu button */}\n      <button \n        className="md:hidden"\n        onClick={() => setIsOpen(!isOpen)}\n      >\n        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n          {isOpen ? (\n            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />\n          ) : (\n            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />\n          )}\n        </svg>\n      </button>\n      \n      {/* Desktop navigation */}\n      <nav className="hidden md:block">\n        <ul className="flex space-x-6">\n          <li><a href="/" className="hover:underline">Home</a></li>\n          <li><a href="/about" className="hover:underline">About</a></li>\n          <li><a href="/contact" className="hover:underline">Contact</a></li>\n          <li>\n            <Menu as="div" className="relative">\n              <Menu.Button className="hover:underline">More</Menu.Button>\n              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg p-2">\n                <Menu.Item>\n                  {({ active }) => (\n                    <a\n                      href="/settings"\n                      className={`block px-4 py-2 rounded ${active ? \'bg-blue-100\' : \'\'}`}\n                    >\n                      Settings\n                    </a>\n                  )}\n                </Menu.Item>\n                <Menu.Item>\n                  {({ active }) => (\n                    <a\n                      href="/profile"\n                      className={`block px-4 py-2 rounded ${active ? \'bg-blue-100\' : \'\'}`}\n                    >\n                      Profile\n                    </a>\n                  )}\n                </Menu.Item>\n              </Menu.Items>\n            </Menu>\n          </li>\n        </ul>\n      </nav>\n    </div>\n    \n    {/* Mobile navigation */}\n    {isOpen && (\n      <nav className="md:hidden mt-4">\n        <ul className="flex flex-col space-y-2">\n          <li><a href="/" className="block py-2 hover:bg-blue-700 px-2 rounded">Home</a></li>\n          <li><a href="/about" className="block py-2 hover:bg-blue-700 px-2 rounded">About</a></li>\n          <li><a href="/contact" className="block py-2 hover:bg-blue-700 px-2 rounded">Contact</a></li>\n          <li><a href="/settings" className="block py-2 hover:bg-blue-700 px-2 rounded">Settings</a></li>\n          <li><a href="/profile" className="block py-2 hover:bg-blue-700 px-2 rounded">Profile</a></li>\n        </ul>\n      </nav>\n    )}\n  </header>\n);\n};\n\nexport default Header;',
      hunks: [
        {
          id: "hunk-1",
          header: "@@ -1,18 +1,70 @@",
          startLine: 1,
          endLine: 70,
          changes: [
            {
              type: "context",
              content: "import React from 'react';",
              oldLineNumber: 1,
              newLineNumber: 1,
            },
            {
              type: "addition",
              content: "import { useState } from 'react';",
              newLineNumber: 2,
            },
            {
              type: "addition",
              content: "import { Menu } from '@headlessui/react';",
              newLineNumber: 3,
            },
            {
              type: "context",
              content: "",
              oldLineNumber: 2,
              newLineNumber: 4,
            },
            {
              type: "context",
              content: "const Header = () => {",
              oldLineNumber: 3,
              newLineNumber: 5,
            },
            {
              type: "addition",
              content: "  const [isOpen, setIsOpen] = useState(false);",
              newLineNumber: 6,
            },
            {
              type: "addition",
              content: "  ",
              newLineNumber: 7,
            },
            {
              type: "context",
              content: "  return (",
              oldLineNumber: 4,
              newLineNumber: 8,
            },
            {
              type: "deletion",
              content: '    <header className="bg-gray-100 p-4">',
              oldLineNumber: 5,
            },
            {
              type: "addition",
              content: '    <header className="bg-blue-600 text-white p-4">',
              newLineNumber: 9,
            },
            {
              type: "deletion",
              content: '      <div className="container mx-auto">',
              oldLineNumber: 6,
              newLineNumber: 10,
            },
            {
              type: "addition",
              content: '      <div className="container mx-auto flex justify-between items-center">',
              newLineNumber: 10,
            },
            {
              type: "deletion",
              content: '        <h1 className="text-xl font-bold">My App</h1>',
              oldLineNumber: 7,
              newLineNumber: 11,
            },
            {
              type: "addition",
              content: '        <h1 className="text-2xl font-bold">My App</h1>',
              newLineNumber: 11,
            },
            {
              type: "addition",
              content: "        ",
              newLineNumber: 12,
            },
            {
              type: "addition",
              content: "        {/* Mobile menu button */}",
              newLineNumber: 13,
            },
            {
              type: "addition",
              content: "        <button ",
              newLineNumber: 14,
            },
            {
              type: "addition",
              content: '          className="md:hidden"',
              newLineNumber: 15,
            },
            {
              type: "addition",
              content: "          onClick={() => setIsOpen(!isOpen)}",
              newLineNumber: 16,
            },
            {
              type: "addition",
              content: "        >",
              newLineNumber: 17,
            },
          ],
        },
      ],
    },
    // 2. New file - utils/helpers.ts (addition)
    {
      id: "diff-2",
      filePath: "/src/utils/helpers.ts",
      fileName: "helpers.ts",
      language: "typescript",
      status: "pending" as const,
      originalContent: "",
      newContent:
        "/**\n * Utility functions for the application\n */\n\n/**\n * Format a date to a readable string\n * @param date The date to format\n * @returns Formatted date string\n */\nexport function formatDate(date: Date): string {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric',\n    month: 'long',\n    day: 'numeric'\n  }).format(date);\n}\n\n/**\n * Truncate a string to a maximum length\n * @param str The string to truncate\n * @param maxLength Maximum length of the string\n * @returns Truncated string with ellipsis if needed\n */\nexport function truncateString(str: string, maxLength: number): string {\n  if (str.length <= maxLength) return str;\n  return str.slice(0, maxLength) + '...';\n}\n\n/**\n * Debounce a function call\n * @param func The function to debounce\n * @param wait Wait time in milliseconds\n * @returns Debounced function\n */\nexport function debounce<T extends (...args: any[]) => any>(\n  func: T,\n  wait: number\n): (...args: Parameters<T>) => void {\n  let timeout: NodeJS.Timeout | null = null;\n  \n  return function(...args: Parameters<T>) {\n    const later = () => {\n      timeout = null;\n      func(...args);\n    };\n    \n    if (timeout) clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n}",
      hunks: [
        {
          id: "hunk-2",
          header: "@@ -0,0 +1,45 @@",
          startLine: 1,
          endLine: 45,
          changes: [
            {
              type: "addition",
              content: "/**",
              newLineNumber: 1,
            },
            {
              type: "addition",
              content: " * Utility functions for the application",
              newLineNumber: 2,
            },
            {
              type: "addition",
              content: " */",
              newLineNumber: 3,
            },
            {
              type: "addition",
              content: "",
              newLineNumber: 4,
            },
            {
              type: "addition",
              content: "/**",
              newLineNumber: 5,
            },
            {
              type: "addition",
              content: " * Format a date to a readable string",
              newLineNumber: 6,
            },
            {
              type: "addition",
              content: " * @param date The date to format",
              newLineNumber: 7,
            },
            {
              type: "addition",
              content: " * @returns Formatted date string",
              newLineNumber: 8,
            },
            {
              type: "addition",
              content: " */",
              newLineNumber: 9,
            },
            {
              type: "addition",
              content: "export function formatDate(date: Date): string {",
              newLineNumber: 10,
            },
            {
              type: "addition",
              content: "  return new Intl.DateTimeFormat('en-US', {",
              newLineNumber: 11,
            },
            {
              type: "addition",
              content: "    year: 'numeric',",
              newLineNumber: 12,
            },
            {
              type: "addition",
              content: "    month: 'long',",
              newLineNumber: 13,
            },
            {
              type: "addition",
              content: "    day: 'numeric'",
              newLineNumber: 14,
            },
            {
              type: "addition",
              content: "  }).format(date);",
              newLineNumber: 15,
            },
            {
              type: "addition",
              content: "}",
              newLineNumber: 16,
            },
          ],
        },
      ],
    },
    // 3. Deleted file - utils/deprecated.ts (deletion)
    {
      id: "diff-3",
      filePath: "/src/utils/deprecated.ts",
      fileName: "deprecated.ts",
      language: "typescript",
      status: "pending" as const,
      originalContent:
        "/**\n * @deprecated Use formatDate from helpers.ts instead\n */\nexport function formatDateString(dateStr: string): string {\n  const date = new Date(dateStr);\n  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;\n}\n\n/**\n * @deprecated Use truncateString from helpers.ts instead\n */\nexport function shortenText(text: string, length: number): string {\n  if (text.length <= length) return text;\n  return text.substring(0, length) + '...';\n}\n\n/**\n * @deprecated No longer needed with new API\n */\nexport function convertLegacyFormat(data: any): any {\n  // Convert legacy data format to new format\n  return {\n    id: data.id || data._id,\n    name: data.name || data.title,\n    description: data.description || data.desc || '',\n    createdAt: data.createdAt || data.created_at || new Date().toISOString()\n  };\n}",
      newContent: "",
      hunks: [
        {
          id: "hunk-3",
          header: "@@ -1,29 +0,0 @@",
          startLine: 1,
          endLine: 0,
          changes: [
            {
              type: "deletion",
              content: "/**",
              oldLineNumber: 1,
            },
            {
              type: "deletion",
              content: " * @deprecated Use formatDate from helpers.ts instead",
              oldLineNumber: 2,
            },
            {
              type: "deletion",
              content: " */",
              oldLineNumber: 3,
            },
            {
              type: "deletion",
              content: "export function formatDateString(dateStr: string): string {",
              oldLineNumber: 4,
            },
            {
              type: "deletion",
              content: "  const date = new Date(dateStr);",
              oldLineNumber: 5,
            },
            {
              type: "deletion",
              content: "  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;",
              oldLineNumber: 6,
            },
            {
              type: "deletion",
              content: "}",
              oldLineNumber: 7,
            },
            {
              type: "deletion",
              content: "",
              oldLineNumber: 8,
            },
            {
              type: "deletion",
              content: "/**",
              oldLineNumber: 9,
            },
            {
              type: "deletion",
              content: " * @deprecated Use truncateString from helpers.ts instead",
              oldLineNumber: 10,
            },
            {
              type: "deletion",
              content: " */",
              oldLineNumber: 11,
            },
            {
              type: "deletion",
              content: "export function shortenText(text: string, length: number): string {",
              oldLineNumber: 12,
            },
            {
              type: "deletion",
              content: "  if (text.length <= length) return text;",
              oldLineNumber: 13,
            },
            {
              type: "deletion",
              content: "  return text.substring(0, length) + '...';",
              oldLineNumber: 14,
            },
            {
              type: "deletion",
              content: "}",
              oldLineNumber: 15,
            },
          ],
        },
      ],
    },
    // 4. Small modification - package.json (dependency addition)
    {
      id: "diff-4",
      filePath: "/package.json",
      fileName: "package.json",
      language: "json",
      status: "pending" as const,
      originalContent:
        '{\n  "name": "project",\n  "version": "1.0.0",\n  "description": "A sample project",\n  "main": "index.js",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "^13.4.7",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "typescript": "^5.1.3",\n    "tailwindcss": "^3.3.2"\n  }\n}',
      newContent:
        '{\n  "name": "project",\n  "version": "1.0.0",\n  "description": "A sample project",\n  "main": "index.js",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "@headlessui/react": "^1.7.15",\n    "next": "^13.4.7",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "typescript": "^5.1.3",\n    "tailwindcss": "^3.3.2"\n  }\n}',
      hunks: [
        {
          id: "hunk-4",
          header: "@@ -10,6 +10,7 @@",
          startLine: 10,
          endLine: 17,
          changes: [
            {
              type: "context",
              content: "  },",
              oldLineNumber: 10,
              newLineNumber: 10,
            },
            {
              type: "context",
              content: '  "dependencies": {',
              oldLineNumber: 11,
              newLineNumber: 11,
            },
            {
              type: "addition",
              content: '    "@headlessui/react": "^1.7.15",',
              newLineNumber: 12,
            },
            {
              type: "context",
              content: '    "next": "^13.4.7",',
              oldLineNumber: 12,
              newLineNumber: 13,
            },
            {
              type: "context",
              content: '    "react": "^18.2.0",',
              oldLineNumber: 13,
              newLineNumber: 14,
            },
            {
              type: "context",
              content: '    "react-dom": "^18.2.0"',
              oldLineNumber: 14,
              newLineNumber: 15,
            },
          ],
        },
      ],
    },
    // 5. Medium modification - theme.ts (color changes)
    {
      id: "diff-5",
      filePath: "/src/styles/theme.ts",
      fileName: "theme.ts",
      language: "typescript",
      status: "pending" as const,
      originalContent:
        'export const theme = {\ncolors: {\n  primary: "#3b82f6",\n  secondary: "#64748b",\n  background: "#ffffff",\n  text: "#1e293b",\n},\nfonts: {\n  body: "system-ui, sans-serif",\n  heading: "system-ui, sans-serif",\n},\nfontSizes: {\n  small: "0.875rem",\n  medium: "1rem",\n  large: "1.25rem",\n  xlarge: "1.5rem",\n},\n};\n\nexport default theme;',
      newContent:
        'export const theme = {\ncolors: {\n  primary: "#2563eb", // Changed to blue-600\n  secondary: "#64748b",\n  background: "#ffffff",\n  text: "#1e293b",\n  accent: "#3b82f6", // Added accent color\n  success: "#10b981", // Added success color\n  error: "#ef4444", // Added error color\n},\nfonts: {\n  body: "system-ui, sans-serif",\n  heading: "system-ui, sans-serif",\n},\nfontSizes: {\n  small: "0.875rem",\n  medium: "1rem",\n  large: "1.25rem",\n  xlarge: "1.5rem",\n  xxlarge: "2rem", // Added xxlarge size\n},\nbreakpoints: {\n  sm: "640px",\n  md: "768px",\n  lg: "1024px",\n  xl: "1280px",\n},\n};\n\nexport default theme;',
      hunks: [
        {
          id: "hunk-5",
          header: "@@ -1,17 +1,28 @@",
          startLine: 1,
          endLine: 28,
          changes: [
            {
              type: "context",
              content: "export const theme = {",
              oldLineNumber: 1,
              newLineNumber: 1,
            },
            {
              type: "context",
              content: "colors: {",
              oldLineNumber: 2,
              newLineNumber: 2,
            },
            {
              type: "deletion",
              content: '  primary: "#3b82f6",',
              oldLineNumber: 3,
            },
            {
              type: "addition",
              content: '  primary: "#2563eb", // Changed to blue-600',
              newLineNumber: 3,
            },
            {
              type: "context",
              content: '  secondary: "#64748b",',
              oldLineNumber: 4,
              newLineNumber: 4,
            },
            {
              type: "context",
              content: '  background: "#ffffff",',
              oldLineNumber: 5,
              newLineNumber: 5,
            },
            {
              type: "context",
              content: '  text: "#1e293b",',
              oldLineNumber: 6,
              newLineNumber: 6,
            },
            {
              type: "addition",
              content: '  accent: "#3b82f6", // Added accent color',
              newLineNumber: 7,
            },
            {
              type: "addition",
              content: '  success: "#10b981", // Added success color',
              newLineNumber: 8,
            },
            {
              type: "addition",
              content: '  error: "#ef4444", // Added error color',
              newLineNumber: 9,
            },
            {
              type: "context",
              content: "},",
              oldLineNumber: 7,
              newLineNumber: 10,
            },
            {
              type: "context",
              content: "fonts: {",
              oldLineNumber: 8,
              newLineNumber: 11,
            },
          ],
        },
      ],
    },
  ],
}
