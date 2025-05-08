"use client"

import { FileCode, Terminal, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { ContextItem } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      case "Elements":
        return <Info className="h-3 w-3 text-purple-600" />
      default:
        return <FileCode className="h-3 w-3 text-gray-600" />
    }
  }

  // Format element info for display
  const formatElementInfo = () => {
    if (!context.elementInfo) return null

    return (
      <div className="text-xs max-w-xs">
        <div className="font-semibold mb-1">Element Details:</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="font-medium">Component:</span>
          <span>{context.elementInfo.componentName}</span>

          <span className="font-medium">Size:</span>
          <span>
            {context.elementInfo.size.width}×{context.elementInfo.size.height}px
          </span>

          <span className="font-medium">Position:</span>
          <span>
            ({context.elementInfo.size.left}, {context.elementInfo.size.top})
          </span>

          <span className="font-medium">XPath:</span>
          <span className="truncate">{context.elementInfo.xpath}</span>
        </div>

        {context.elementInfo.textContent && (
          <>
            <div className="font-medium mt-1">Content:</div>
            <div className="truncate">{context.elementInfo.textContent}</div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 whitespace-nowrap">
      {context.elementInfo ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1">
                {getIcon()}
                <span>{context.name}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-white p-3 shadow-lg border border-gray-200 rounded-md">
              {formatElementInfo()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <>
          {getIcon()}
          <span>{context.name}</span>
        </>
      )}
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
