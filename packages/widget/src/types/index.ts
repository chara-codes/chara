import type React from "react"

export interface Message {
  id: string
  content: string
  type: "user" | "assistant"
  files?: string[]
  contexts?: ContextItem[] // Add contexts property to Message interface
  title?: string
  isGenerating?: boolean
  codeBlocks?: CodeBlock[]
}

export interface CodeBlock {
  id: string
  filename: string
  code: string
  language: string
}

export interface ContextCategory {
  name: string
  icon: React.ElementType
  options: { name: string; description?: string }[]
}

export interface Model {
  name: string
  provider: string
  imageKey: string
}

export interface ModelGroup {
  provider: string
  models: Model[]
}

// Add a new type for component frameworks
export type ComponentFramework = "React" | "Vue" | "Svelte" | "Angular" | "WebComponent" | "Unknown"

// Update the ContextItem interface to include component framework
export interface ContextItem {
  type: string
  name: string
  elementInfo?: {
    selector: string
    xpath: string
    componentName: string
    componentFramework?: ComponentFramework // Add component framework
    relativePath?: string // Add relative path from component root
    isDirectComponent?: boolean // Add flag to indicate if element is a component itself
    size: {
      width: number
      height: number
      top: number
      left: number
    }
    styles: Record<string, string>
    attributes: Record<string, string>
    textContent: string
    componentPath?: string
    parentComponents?: Array<{
      name: string
      selector: string
      framework?: ComponentFramework // Add framework to parent components
      isComponent?: boolean // Add flag to indicate if parent is a component
    }>
  }
}

export interface ChangedFile {
  name: string
  path: string
  changes: string
}
