"use client";

import type { Chat, Model } from "../types";

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
];

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
];

export const mockResponse = {
  content:
    "I've analyzed your request and made the necessary changes to the codebase. Here's a summary of the key changes:",
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
                hasChanges: true,
              },
              {
                name: "Button.tsx",
                path: "/src/components/Button.tsx",
                type: "file" as const,
                language: "typescript",
                hasChanges: true,
              },
            ],
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
                hasChanges: true,
              },
            ],
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
                hasChanges: true,
              },
            ],
          },
        ],
      },
      {
        name: "package.json",
        path: "/package.json",
        type: "file" as const,
        language: "json",
        hasChanges: true,
      },
    ],
  },
};
