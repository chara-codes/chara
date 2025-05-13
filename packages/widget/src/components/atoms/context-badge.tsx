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

  // Update the tooltip content to display the component framework once
  const formatElementInfo = () => {
    if (!context.elementInfo) return null

    return (
      <div className="text-xs max-w-xs">
        <div className="font-semibold mb-1 text-gray-100">Element Details:</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="font-medium text-gray-300">Component:</span>
          <span className="text-white">{context.elementInfo.componentName}</span>

          <span className="font-medium text-gray-300">Component Type:</span>
          <span className="text-white">{context.elementInfo.componentFramework || "Unknown"}</span>

          {context.elementInfo.relativePath && (
            <>
              <span className="font-medium text-gray-300">
                {context.elementInfo.componentFramework === "Unknown" ? "XPath:" : "Element Path:"}
              </span>
              <span className="font-mono text-xs bg-gray-700 text-gray-100 px-1 rounded">
                {context.elementInfo.relativePath}
              </span>
            </>
          )}

          <span className="font-medium text-gray-300">Size:</span>
          <span className="text-white">
            {context.elementInfo.size.width}×{context.elementInfo.size.height}px
          </span>

          <span className="font-medium text-gray-300">Position:</span>
          <span className="text-white">
            ({context.elementInfo.size.left}, {context.elementInfo.size.top})
          </span>
        </div>

        {context.elementInfo.componentPath && context.elementInfo.componentPath !== "No parent components detected" && (
          <div className="mt-2">
            <div className="font-medium text-gray-300">Component Path:</div>
            <div className="text-xs text-gray-100 bg-gray-700 p-1 rounded mt-1">
              {context.elementInfo.componentPath}
            </div>
          </div>
        )}

        {context.elementInfo.parentComponents && context.elementInfo.parentComponents.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-gray-300">Parent Components:</div>
            <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-white">
              {context.elementInfo.parentComponents.map((comp, idx) => (
                <li key={idx}>
                  <span className="font-semibold text-white">{comp.name}</span>
                  <span className="text-gray-400"> ({comp.selector})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Format the display name for the badge
  const getDisplayName = () => {
    if (!context.elementInfo) return context.name

    // If it's a direct component, just show its name
    if (context.elementInfo.isDirectComponent) {
      return context.name
    }

    // If it's an element inside a component, show "element in ComponentName"
    if (context.elementInfo.parentComponents && context.elementInfo.parentComponents.length > 0) {
      const elementType = context.name.split(" ")[0]
      return (
        <>
          {elementType} in <span className="font-medium">{context.elementInfo.componentName}</span>
        </>
      )
    }

    return context.name
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5 whitespace-nowrap">
      {context.elementInfo ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1">
                {getIcon()}
                <span>{getDisplayName()}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-gray-800 text-white p-3 shadow-lg border border-gray-700 rounded-md"
            >
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
