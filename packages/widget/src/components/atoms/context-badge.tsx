"use client"

import { FileCode, Terminal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { ContextItem } from "@/types"

interface ContextBadgeProps {
  context: ContextItem
}

export function ContextBadge({ context }: ContextBadgeProps) {
  const removeContext = useStore((state) => state.removeContext)

  const getIcon = () => {
    switch (context.type) {
      case "Files":
        return <FileCode className="h-3 w-3 text-gray-600" />
      case "Documentation":
        return <FileCode className="h-3 w-3 text-blue-600" />
      case "Console":
        return <Terminal className="h-3 w-3 text-amber-600" />
      default:
        return <FileCode className="h-3 w-3 text-gray-600" />
    }
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 whitespace-nowrap">
      {getIcon()}
      <span>{context.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 text-gray-500 hover:bg-gray-200 p-0"
        onClick={() => removeContext(context.name)}
      >
        <X className="h-2 w-2" />
      </Button>
    </div>
  )
}
