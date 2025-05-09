"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "system"
  timestamp: Date
}

interface FloatingChatProps {
  position?: "left" | "right"
  title?: string
}

export function FloatingChat({ position = "right", title = "Chat Support" }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "system",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate response after a short delay
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thanks for your message! This is a demo response to: "${inputValue}"`,
        sender: "system",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="fixed bottom-4 z-50" style={{ [position]: "20px" }}>
      {/* Trigger Button */}
      <button
        onClick={toggleChat}
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-105",
          isOpen ? "bg-gray-600" : "bg-gray-800",
        )}
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col absolute bottom-14",
            position === "left" ? "left-0" : "right-0",
          )}
        >
          {/* Header */}
          <div className="bg-gray-800 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">{title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[80%] p-3 rounded-lg",
                  message.sender === "user" ? "bg-gray-100 ml-auto rounded-br-none" : "bg-blue-100 rounded-bl-none",
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={inputValue.trim() === ""}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
