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

export interface ContextItem {
  type: string
  name: string
}

export interface ChangedFile {
  name: string
  path: string
  changes: string
}
