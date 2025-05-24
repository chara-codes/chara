import type React from "react"
import type { ContextItem } from "../../../store/types"

/**
 * Generates preview content for a context item based on its type and data
 */
export const getPreviewContent = (item: ContextItem): React.ReactNode => {
  const lowerType = item.type.toLowerCase()

  // If the item has data, use it for the preview
  if (item.data) {
    if (typeof item.data === "string") {
      return item.data
    }

    try {
      // Try to stringify the data for display
      return JSON.stringify(item.data, null, 2)
    } catch {
      // Fallback if data can't be stringified
      return `[Complex data structure]`
    }
  }

  // Otherwise generate mock preview based on type
  switch (lowerType) {
    case "file":
      if (item.name.endsWith(".json")) {
        return `{
  "name": "project-name",
  "version": "1.0.0",
  "description": "Project description",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  }
}`
      } else if (item.name.endsWith(".md")) {
        return `# ${item.name}
        
## Introduction
This is a sample markdown file.

## Features
- Feature 1
- Feature 2
- Feature 3`
      } else {
        return `// Sample code
function example() {
  console.log("This is a preview of ${item.name}");
  return true;
}`
      }
    case "documentation":
      return `# ${item.name}

This documentation explains how to use the API.

## Getting Started
1. Install dependencies
2. Configure settings
3. Run the application`
    case "terminal":
      return `$ npm install
+ react@18.2.0
+ react-dom@18.2.0
+ styled-components@6.1.1
added 1298 packages in 32s`
    case "link":
      return `URL: ${item.name}
      
This link points to an external resource that provides additional context for the conversation.`
    case "text":
      return item.name
    default:
      return `Content preview for ${item.name}`
  }
}
