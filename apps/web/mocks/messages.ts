import type { Message } from "../types"
import { contactFormFileChanges, earlierFormFileChanges } from "./file-changes"
import { reactTypeScriptCommands } from "./commands"

export const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! How can I help you today?",
    sender: "assistant",
    timestamp: new Date(),
    regenerations: [],
    currentRegenerationIndex: 0,
  },
  {
    id: "2",
    content: "I need to update my React component to add form validation.",
    sender: "user",
    timestamp: new Date(),
  },
  {
    id: "3",
    content:
      "I've analyzed your request and here are the changes I suggest to implement form validation in your React component:",
    sender: "assistant",
    timestamp: new Date(),
    regenerations: [],
    currentRegenerationIndex: 0,
    fileChanges: contactFormFileChanges,
  },
  {
    id: "4",
    content: "How do I set up a new React project with TypeScript?",
    sender: "user",
    timestamp: new Date(),
  },
  {
    id: "5",
    content:
      "To set up a new React project with TypeScript, you can use Create React App with the TypeScript template. Here are the commands you need to run:",
    sender: "assistant",
    timestamp: new Date(),
    regenerations: [],
    currentRegenerationIndex: 0,
    commands: reactTypeScriptCommands,
  },
  {
    id: "6",
    content: "Here's an earlier version of the form validation implementation:",
    sender: "assistant",
    timestamp: new Date(),
    regenerations: [],
    currentRegenerationIndex: 0,
    fileChanges: earlierFormFileChanges,
  },
]

