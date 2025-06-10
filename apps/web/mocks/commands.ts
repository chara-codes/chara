import type { Command } from "../types"

export const reactTypeScriptCommands: Command[] = [
  {
    id: "cmd1",
    command: "npx create-react-app my-app --template typescript",
    description: "Create a new React app with TypeScript template",
  },
  {
    id: "cmd2",
    command: "cd my-app",
    description: "Navigate to the project directory",
  },
  {
    id: "cmd3",
    command: "npm start",
    description: "Start the development server",
  },
  {
    id: "cmd4",
    command: "npm install @types/react @types/react-dom --save-dev",
    description: "Install React TypeScript type definitions (if needed)",
  },
]

