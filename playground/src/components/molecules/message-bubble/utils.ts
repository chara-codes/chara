import type React from "react"
import type { ContextItem } from "../../../store/types"
import type { TooltipPosition } from "./types"

/**
 * Calculates the optimal position for a tooltip based on the anchor element
 * and the container element.
 */
export const calculateTooltipPosition = (
  anchorElement: HTMLElement,
  containerRef: React.RefObject<HTMLElement | null>,
): TooltipPosition => {
  const anchorRect = anchorElement.getBoundingClientRect()

  // Get viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Get container dimensions if available
  let containerRect = {
    top: 0,
    right: viewportWidth,
    bottom: viewportHeight,
    left: 0,
    width: viewportWidth,
    height: viewportHeight,
  }

  if (containerRef?.current) {
    const rect = containerRef.current.getBoundingClientRect()
    containerRect = {
      top: Math.max(0, rect.top),
      right: Math.min(viewportWidth, rect.right),
      bottom: Math.min(viewportHeight, rect.bottom),
      left: Math.max(0, rect.left),
      width: rect.width,
      height: rect.height,
    }
  }

  // Tooltip dimensions (estimated)
  const tooltipWidth = 300
  const tooltipHeight = 200

  // Calculate available space in each direction
  const spaceRight = containerRect.right - anchorRect.right - 10
  const spaceLeft = anchorRect.left - containerRect.left - 10
  const spaceBelow = containerRect.bottom - anchorRect.bottom - 10

  // Determine the best position based on available space
  let position: "top" | "right" | "bottom" | "left" = "right" // Default
  let top = 0
  let left = 0

  // Prefer right if there's enough space
  if (spaceRight >= tooltipWidth) {
    position = "right"
    top = anchorRect.top
    left = anchorRect.right + 10
  }
  // Otherwise try left
  else if (spaceLeft >= tooltipWidth) {
    position = "left"
    top = anchorRect.top
    left = anchorRect.left - tooltipWidth - 10
  }
  // Otherwise try below
  else if (spaceBelow >= tooltipHeight) {
    position = "bottom"
    top = anchorRect.bottom + 10
    left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2
  }
  // Last resort: above
  else {
    position = "top"
    top = anchorRect.top - tooltipHeight - 10
    left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2
  }

  // Adjust if tooltip would go outside viewport
  if (left < 10) left = 10
  if (top < 10) top = 10
  if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10
  if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10

  return { top, left, position }
}

/**
 * Generates preview content for a context item based on its type and data
 */
export const getPreviewContent = (item: ContextItem): string => {
  const lowerType = item.type.toLowerCase()

  // If the item has data, use it for the preview
  if (item.data) {
    if (typeof item.data === "string") {
      return item.data
    }

    try {
      // Try to stringify the data for display
      return JSON.stringify(item.data, null, 2)
    } catch (e) {
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
