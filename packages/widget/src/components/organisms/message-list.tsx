"use client"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { FileCode, Terminal, BookOpen, FileText } from "lucide-react"
import { CodeBlock } from "@/components/molecules/code-block"
import { MessageFeedback } from "@/components/molecules/message-feedback"
import { EditsSummary } from "@/components/molecules/edits-summary"

export function MessageList() {
  const messages = useStore((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
              <div className="text-sm text-gray-800 whitespace-pre-line">{message.content}</div>

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
