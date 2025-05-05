"use client"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { FileCode, Terminal, BookOpen, FileText, Copy } from "lucide-react"
import { CodeBlock } from "@/components/molecules/code-block"
import { MessageFeedback } from "@/components/molecules/message-feedback"
import { EditsSummary } from "@/components/molecules/edits-summary"
import { Button } from "@/components/ui/button"

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

  return (
    <div className="flex-1 overflow-y-auto p-0">
      {messages.map((message) => (
        <div key={message.id} className="mb-4">
          {message.type === "user" ? (
            <div className="px-4 py-3 bg-white border-y border-gray-200">
              <p className="text-sm text-gray-800">{message.content}</p>
              {message.files && message.files.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Attached contexts:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {message.files.map((file) => {
                      // Determine icon and color based on file type
                      let icon = <FileText className="h-3 w-3" />
                      let bgColor = "bg-gray-100"
                      let textColor = "text-gray-700"

                      if (file.endsWith(".md") || file.includes("README") || file.includes("Documentation")) {
                        icon = <BookOpen className="h-3 w-3" />
                        bgColor = "bg-blue-50"
                        textColor = "text-blue-700"
                      } else if (file.includes("Terminal") || file.includes("Console") || file.includes("logs")) {
                        icon = <Terminal className="h-3 w-3" />
                        bgColor = "bg-amber-50"
                        textColor = "text-amber-700"
                      } else {
                        icon = <FileCode className="h-3 w-3" />
                        bgColor = "bg-emerald-50"
                        textColor = "text-emerald-700"
                      }

                      return (
                        <Badge
                          key={file}
                          variant="outline"
                          className={`${bgColor} ${textColor} rounded-md flex items-center gap-1.5 text-xs py-1 px-2 border border-opacity-50`}
                        >
                          {icon}
                          {file}
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
