"use client"

import { Plus, Clock, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"

export function ChatHeader() {
  const toggleChat = useStore((state) => state.toggleChat)

  return (
    <div className="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-900 drag-handle cursor-move border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading Summary...</span>
      </div>
      <div className="flex items-center space-x-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Stacks</DropdownMenuItem>
            <DropdownMenuItem>User Settings</DropdownMenuItem>
            <DropdownMenuItem>Theme</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
          <Clock className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={toggleChat}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
