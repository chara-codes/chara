"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Send, Bot, User, X } from "lucide-react"
import { useTrpcChat } from "@/lib/trpc"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status, stop, error, reload } = useTrpcChat()

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">AI Chat (tRPC)</h1>
        </div>
        {error && (
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <h2 className="text-lg font-medium">How can I help you today?</h2>
            <p className="max-w-md">Ask me anything and I'll do my best to assist you.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3 max-w-3xl mx-auto", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("flex gap-3", message.role === "user" ? "order-2" : "order-1")}>
                <Avatar className={cn("h-8 w-8 rounded-full", message.role === "user" ? "bg-primary" : "bg-secondary")}>
                  {message.role === "user" ? (
                    <User className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Bot className="h-5 w-5 text-secondary-foreground" />
                  )}
                </Avatar>
              </div>

              <div
                className={cn(
                  "rounded-lg p-4 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground order-1"
                    : "bg-secondary text-secondary-foreground order-2",
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))
        )}

        {(status === "submitted" || status === "streaming") && (
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <Avatar className="h-8 w-8 rounded-full bg-secondary">
              <Bot className="h-5 w-5 text-secondary-foreground" />
            </Avatar>
            <div className="rounded-lg p-4 bg-secondary text-secondary-foreground">
              {status === "submitted" ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  <Button variant="ghost" size="sm" onClick={stop} className="h-7 px-2 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Stop generating
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={status !== "ready"}
            className="flex-1"
          />
          <Button type="submit" disabled={status !== "ready" || !input.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

