"use client"

import { Pencil, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"

export function ChatTypeSelector() {
  const chatType = useStore((state) => state.chatType)
  const setChatType = useStore((state) => state.setChatType)

  // Determine which icon to show based on the selected chat type
  const getIconForChatType = () => {
    switch (chatType) {
      case "Ask":
        return <MessageSquare className="h-3 w-3" />
      case "Write":
      default:
        return <Pencil className="h-3 w-3" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-gray-500 h-8">
          {getIconForChatType()}
          <span className="ml-1">{chatType}</span>
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-24">
        <DropdownMenuItem onClick={() => setChatType("Write")}>
          <Pencil className="h-3 w-3 mr-2" />
          Write
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setChatType("Ask")}>
          <MessageSquare className="h-3 w-3 mr-2" />
          Ask
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
