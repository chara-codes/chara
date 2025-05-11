"use client"

import { FileCode, Terminal, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import type { ContextItem, ComponentFramework } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ContextBadgeProps {
  context: ContextItem
}

// Define a more specific type for elementInfo to help TypeScript
interface ElementInfo {
  selector: string
  xpath: string
  componentName: string
  componentFramework?: ComponentFramework
  relativePath?: string
  isDirectComponent?: boolean
  size: {
    width: number
    height: number
    top: number
    left: number
  }
  styles: Record<string, string>
  attributes: Record<string, string>
  textContent: string
  componentPath?: string
  parentComponents?: Array<{
    name: string
    selector: string
    framework?: ComponentFramework
    isComponent?: boolean
  }>
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

  // Add a function to get context styling
  const getContextStyling = () => {
    // Default styling
    let icon = <FileCode className="h-3 w-3 text-gray-600" />
    let bgColor = "bg-gray-100"
    let textColor = "text-gray-700"
    let borderColor = "border-gray-200"
    let accentColor = "text-gray-900"
    let lightColor = "text-gray-500"
    let codeBg = "bg-gray-50"

    // Style based on context type
    switch (context.type) {
      case "Files":
        icon = <FileCode className="h-3 w-3 text-gray-600" />
        bgColor = "bg-gray-100"
        textColor = "text-gray-700"
        borderColor = "border-gray-200"
        accentColor = "text-gray-900"
        lightColor = "text-gray-500"
        codeBg = "bg-gray-50"
        break
      case "Documentation":
        icon = <FileCode className="h-3 w-3 text-blue-600" />
        bgColor = "bg-blue-50"
        textColor = "text-blue-700"
        borderColor = "border-blue-200"
        accentColor = "text-blue-900"
        lightColor = "text-blue-500"
        codeBg = "bg-blue-50/50"
        break
      case "Console":
        icon = <Terminal className="h-3 w-3 text-amber-600" />
        bgColor = "bg-amber-50"
        textColor = "text-amber-700"
        borderColor = "border-amber-200"
        accentColor = "text-amber-900"
        lightColor = "text-amber-500"
        codeBg = "bg-amber-50/50"
        break
      case "Elements":
        icon = <Info className="h-3 w-3 text-purple-600" />
        bgColor = "bg-purple-50"
        textColor = "text-purple-700"
        borderColor = "border-purple-200"
        accentColor = "text-purple-900"
        lightColor = "text-purple-500"
        codeBg = "bg-purple-50/50"
        break
      default:
        icon = <FileCode className="h-3 w-3 text-gray-600" />
        bgColor = "bg-gray-100"
        textColor = "text-gray-700"
        borderColor = "border-gray-200"
        accentColor = "text-gray-900"
        lightColor = "text-gray-500"
        codeBg = "bg-gray-50"
        break
    }

    return { icon, bgColor, textColor, borderColor, accentColor, lightColor, codeBg }
  }

  // Update the tooltip content to display the component framework once
  const formatElementInfo = () => {
    if (!context.elementInfo) return null

    // Cast elementInfo to our more specific type
    const elementInfo = context.elementInfo as ElementInfo

    // Get the styling colors for the context type
    const { textColor, accentColor, lightColor, codeBg } = getContextStyling()

    return (
      <div className="text-xs max-w-xs">
        <div className={`font-semibold mb-1 ${textColor}`}>Element Details:</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className={`font-medium ${textColor}`}>Component:</span>
          <span className={accentColor}>{elementInfo.componentName}</span>

          <span className={`font-medium ${textColor}`}>Component Type:</span>
          <span className={accentColor}>{elementInfo.componentFramework || "Unknown"}</span>

          {elementInfo.relativePath && (
            <>
              <span className={`font-medium ${textColor}`}>
                {elementInfo.componentFramework === "Unknown" ? "XPath:" : "Element Path:"}
              </span>
              <span className={`font-mono text-xs ${codeBg} px-1 rounded ${accentColor}`}>
                {elementInfo.relativePath}
              </span>
            </>
          )}

          <span className={`font-medium ${textColor}`}>Size:</span>
          <span className={accentColor}>
            <span className={lightColor}>W:</span> {elementInfo.size.width}px <span className={lightColor}>H:</span>{" "}
            {elementInfo.size.height}px
          </span>

          <span className={`font-medium ${textColor}`}>Position:</span>
          <span className={accentColor}>
            <span className={lightColor}>X:</span> {elementInfo.size.left} <span className={lightColor}>Y:</span>{" "}
            {elementInfo.size.top}
          </span>
        </div>

        {elementInfo.componentPath && elementInfo.componentPath !== "No parent components detected" && (
          <div className="mt-2">
            <div className={`font-medium ${textColor}`}>Component Path:</div>
            <div className={`text-xs ${accentColor} ${codeBg} p-1 rounded mt-1`}>
              {elementInfo.componentPath.split(" → ").map((comp, idx, arr) => (
                <span key={idx}>
                  <span className={accentColor}>{comp}</span>
                  {idx < arr.length - 1 && <span className={lightColor}> → </span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {elementInfo.parentComponents && elementInfo.parentComponents.length > 0 && (
          <div className="mt-2">
            <div className={`font-medium ${textColor}`}>Parent Components:</div>
            <ul className="list-disc list-inside text-xs mt-1 space-y-1">
              {elementInfo.parentComponents.map((comp, idx) => (
                <li key={idx}>
                  <span className={`font-semibold ${accentColor}`}>{comp.name}</span>
                  <span className={lightColor}> ({comp.selector})</span>
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

    // Cast elementInfo to our more specific type
    const elementInfo = context.elementInfo as ElementInfo

    // If it's a direct component, just show its name
    if (elementInfo.isDirectComponent) {
      return context.name
    }

    // If it's an element inside a component, show "element in ComponentName"
    if (elementInfo.parentComponents && elementInfo.parentComponents.length > 0) {
      const elementType = context.name.split(" ")[0]
      return (
        <>
          {elementType} in <span className="font-medium">{elementInfo.componentName}</span>
        </>
      )
    }

    return context.name
  }

  // Update the return statement to use the getContextStyling function
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
              className="bg-white p-0 shadow-lg border border-gray-200 rounded-md overflow-hidden"
            >
              {(() => {
                const { bgColor, textColor, borderColor, accentColor } = getContextStyling()
                // Cast elementInfo to our more specific type
                const elementInfo = context.elementInfo as ElementInfo
                return (
                  <>
                    <div className={`${bgColor} ${textColor} px-3 py-1.5 font-medium border-b ${borderColor}`}>
                      <span className={accentColor}>{elementInfo.componentName || "Element Details"}</span>
                      {elementInfo.componentFramework && elementInfo.componentFramework !== "Unknown" && (
                        <span className="text-xs ml-1.5 opacity-80">({elementInfo.componentFramework})</span>
                      )}
                    </div>
                    <div className="p-3">{formatElementInfo()}</div>
                  </>
                )
              })()}
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
