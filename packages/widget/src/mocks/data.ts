import { FileCode, Terminal } from "lucide-react"
import type { ContextCategory, ModelGroup, ChangedFile } from "@/types"

export const contextCategories: ContextCategory[] = [
  {
    name: "Files",
    icon: FileCode,
    options: [
      { name: "app.tsx", description: "Main application file" },
      { name: "index.ts", description: "Entry point" },
      { name: "types.ts", description: "Type definitions" },
      { name: "utils.ts", description: "Utility functions" },
      { name: "constants.ts", description: "Constants and configuration" },
      { name: "components/button.tsx", description: "Button component" },
      { name: "components/input.tsx", description: "Input component" },
      { name: "components/card.tsx", description: "Card component" },
      { name: "hooks/use-form.ts", description: "Form hook" },
      { name: "hooks/use-auth.ts", description: "Authentication hook" },
      { name: "styles/globals.css", description: "Global styles" },
    ],
  },
  {
    name: "Documentation",
    icon: FileCode,
    options: [
      { name: "README.md", description: "Project overview" },
      { name: "API.md", description: "API documentation" },
      { name: "CONTRIBUTING.md", description: "Contribution guidelines" },
      { name: "CHANGELOG.md", description: "Version history" },
      { name: "SECURITY.md", description: "Security policies" },
      { name: "docs/getting-started.md", description: "Getting started guide" },
      { name: "docs/advanced-usage.md", description: "Advanced usage guide" },
      { name: "docs/troubleshooting.md", description: "Troubleshooting guide" },
    ],
  },
  {
    name: "Console",
    icon: Terminal,
    options: [
      { name: "Terminal output", description: "Recent terminal logs" },
      { name: "Build logs", description: "Latest build information" },
      { name: "Error logs", description: "Recent errors" },
      { name: "Network logs", description: "Network requests and responses" },
      { name: "Performance metrics", description: "Application performance data" },
    ],
  },
]

export const modelGroups: ModelGroup[] = [
  {
    provider: "Anthropic",
    models: [
      { name: "Claude 3.7 Sonnet", provider: "Anthropic", imageKey: "xrrvx" },
      { name: "Claude 3.7 Opus", provider: "Anthropic", imageKey: "xrrvx" },
      { name: "Claude 3.5 Sonnet", provider: "Anthropic", imageKey: "xrrvx" },
      { name: "Claude 3 Haiku", provider: "Anthropic", imageKey: "xrrvx" },
    ],
  },
  {
    provider: "OpenAI",
    models: [
      { name: "GPT-4o", provider: "OpenAI", imageKey: "gpt4o" },
      { name: "GPT-4o mini", provider: "OpenAI", imageKey: "gpt4o" },
      { name: "GPT-4 Turbo", provider: "OpenAI", imageKey: "gpt4o" },
      { name: "GPT-3.5 Turbo", provider: "OpenAI", imageKey: "gpt4o" },
    ],
  },
  {
    provider: "Meta",
    models: [
      { name: "Llama 3 70B", provider: "Meta", imageKey: "llama3" },
      { name: "Llama 3 8B", provider: "Meta", imageKey: "llama3" },
    ],
  },
  {
    provider: "Mistral",
    models: [
      { name: "Mistral Large", provider: "Mistral", imageKey: "mistral" },
      { name: "Mistral Medium", provider: "Mistral", imageKey: "mistral" },
      { name: "Mistral Small", provider: "Mistral", imageKey: "mistral" },
    ],
  },
  {
    provider: "Ollama",
    models: [
      { name: "Llama 3", provider: "Ollama", imageKey: "ollama" },
      { name: "Mistral", provider: "Ollama", imageKey: "ollama" },
      { name: "Phi-3", provider: "Ollama", imageKey: "ollama" },
    ],
  },
]

// Flatten model groups for search functionality
export const allModels = modelGroups.flatMap((group) => group.models)

export const changedFiles: ChangedFile[] = [
  { name: "logger.ts", path: "chara/packages/cli/src/utils/logger.ts", changes: "+15, -8" },
  { name: "index.ts", path: "chara/packages/cli/src/utils/index.ts", changes: "+2, -0" },
  { name: "types.ts", path: "chara/packages/cli/src/types.ts", changes: "+5, -3" },
]
