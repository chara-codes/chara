"use client"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { FileCode, Terminal, BookOpen, FileText, Copy, Pointer, Database } from "lucide-react"
import { CodeBlock } from "@/components/molecules/code-block"
import { MessageFeedback } from "@/components/molecules/message-feedback"
import { EditsSummary } from "@/components/molecules/edits-summary"
import { Button } from "@/components/ui/button"
import type { ContextItem } from "@/types"

export function MessageList() {
  const messages = useStore((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to format message content and extract command blocks
  const formatMessageWithCommands = (content: string) => {
    if (!content) return null

    // Split content by command block patterns
    // Looking for patterns like:
    // $ command
    // > command
    // \`\`\`bash
    // command
    // \`\`\`
    const parts = content.split(/(\$\s+.*?$|>\s+.*?$|```(bash|sh|cmd|powershell|terminal)[\s\S]*?```)/gm)

    if (parts.length <= 1) {
      return <div className="text-sm text-gray-800 whitespace-pre-line">{content}</div>
    }

    return (
      <div className="text-sm text-gray-800">
        {parts.map((part, index) => {
          // Check if this part is a command
          if (
            part?.trim().startsWith("$ ") ||
            part?.trim().startsWith("> ") ||
            part?.trim().match(/^```(bash|sh|cmd|powershell|terminal)/)
          ) {
            // Clean up the command text
            let commandText = part
            if (commandText.match(/^```(bash|sh|cmd|powershell|terminal)/)) {
              commandText = commandText
                .replace(/^```(bash|sh|cmd|powershell|terminal)/, "")
                .replace(/```$/, "")
                .trim()
            }

            return (
              <div
                key={index}
                className="my-2 bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm overflow-x-auto"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Terminal className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold">Command</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => {
                      navigator.clipboard.writeText(commandText.replace(/^\$\s+|>\s+/, ""))
                    }}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="whitespace-pre">{commandText}</div>
              </div>
            )
          }

          // Regular text
          return (
            <div key={index} className="whitespace-pre-line">
              {part}
            </div>
          )
        })}
      </div>
    )
  }

  // Function to get context type, icon, and styling
  const getContextStyling = (context: ContextItem) => {
    // Default styling
    let icon = <FileText className="h-3 w-3" />
    let bgColor = "bg-gray-100"
    let textColor = "text-gray-700"
    let borderColor = "border-gray-200"

    // Use the context type if available, otherwise infer from name
    const contextType = context.type || "File"
    const contextName = context.name

    // Style based on context type
    switch (contextType) {
      case "Documentation":
        icon = <BookOpen className="h-3 w-3" />
        bgColor = "bg-blue-50"
        textColor = "text-blue-700"
        borderColor = "border-blue-200"
        break

      case "Console":
        icon = <Terminal className="h-3 w-3" />
        bgColor = "bg-amber-50"
        textColor = "text-amber-700"
        borderColor = "border-amber-200"
        break

      case "Elements":
        icon = <Pointer className="h-3 w-3" />
        bgColor = "bg-purple-50"
        textColor = "text-purple-700"
        borderColor = "border-purple-200"
        break

      case "Files":
        // Further categorize files based on extension
        if (
          contextName.endsWith(".js") ||
          contextName.endsWith(".ts") ||
          contextName.endsWith(".jsx") ||
          contextName.endsWith(".tsx") ||
          contextName.endsWith(".py") ||
          contextName.endsWith(".java") ||
          contextName.endsWith(".html") ||
          contextName.endsWith(".css") ||
          contextName.endsWith(".json")
        ) {
          icon = <FileCode className="h-3 w-3" />
          bgColor = "bg-emerald-50"
          textColor = "text-emerald-700"
          borderColor = "border-emerald-200"
        } else if (contextName.endsWith(".sql") || contextName.includes("database") || contextName.includes("DB")) {
          icon = <Database className="h-3 w-3" />
          bgColor = "bg-green-50"
          textColor = "text-green-700"
          borderColor = "border-green-200"
        } else if (
          contextName.endsWith(".md") ||
          contextName.includes("README") ||
          contextName.includes("Documentation")
        ) {
          icon = <BookOpen className="h-3 w-3" />
          bgColor = "bg-blue-50"
          textColor = "text-blue-700"
          borderColor = "border-blue-200"
        } else {
          icon = <FileText className="h-3 w-3" />
          bgColor = "bg-gray-100"
          textColor = "text-gray-700"
          borderColor = "border-gray-200"
        }
        break

      default:
        // Keep default styling
        break
    }

    return { icon, bgColor, textColor, borderColor, contextType }
  }

  return (
    <div className="flex-1 overflow-y-auto p-0">
      {messages.map((message) => (
        <div key={message.id} className="mb-4">
          {message.type === "user" ? (
            <div className="px-4 py-3 bg-white border-y border-gray-200">
              <p className="text-sm text-gray-800">{message.content}</p>

              {message.contexts && message.contexts.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-1.5">Attached contexts:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {message.contexts.map((context: ContextItem) => {
                      const { icon, bgColor, textColor, borderColor, contextType } = getContextStyling(context)

                      // Create a more detailed display for Elements type contexts
                      let contextDisplay = context.name
                      if (context.type === "Elements" && context.elementInfo) {
                        contextDisplay = `${context.name} (${context.elementInfo.size.width}×${context.elementInfo.size.height}px)`
                      }

                      return (
                        <Badge
                          key={`${context.type}-${context.name}`}
                          variant="outline"
                          className={`${bgColor} ${textColor} rounded-md flex items-center gap-1.5 text-xs py-1 px-2 border ${borderColor}`}
                        >
                          <span className="flex items-center gap-1">
                            {icon}
                            <span className="text-xs font-medium opacity-70">{context.type || contextType}:</span>
                          </span>
                          <span>{contextDisplay}</span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-3">
              {formatMessageWithCommands(message.content)}

              {message.codeBlocks &&
                message.codeBlocks.map((codeBlock) => <CodeBlock key={codeBlock.id} codeBlock={codeBlock} />)}

              {message.isGenerating && <div className="text-xs text-gray-500 mt-2">Generating...</div>}
            </div>
          )}
        </div>
      ))}

      <MessageFeedback />
      <EditsSummary />
      <div ref={messagesEndRef} />
    </div>
  )
}
