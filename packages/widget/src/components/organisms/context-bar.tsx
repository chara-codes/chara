"use client"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { ContextSelector } from "@/components/molecules/context-selector"
import { FileAttachmentButton } from "@/components/molecules/file-attachment-button"
import { ContextScrollButton } from "@/components/molecules/context-scroll-button"
import { ContextBadge } from "@/components/atoms/context-badge"
import { Button } from "@/components/ui/button"
import { Pointer } from "lucide-react"

// Function to get XPath of an element
const getXPath = (element: HTMLElement): string => {
  if (!element) return ""
  if (element === document.body) return "/html/body"

  let xpath = ""
  const parent = element.parentElement

  if (!parent) return ""

  // Get the tag name and position among siblings of the same type
  const tagName = element.tagName.toLowerCase()
  const siblings = Array.from(parent.children).filter((child) => child.tagName.toLowerCase() === tagName)

  const position = siblings.indexOf(element) + 1

  // Build the XPath segment
  xpath = `/${tagName}[${position}]`

  // Recursively build the full XPath
  const parentXPath = getXPath(parent)
  return parentXPath + xpath
}

// Function to get computed styles summary
const getStylesSummary = (element: HTMLElement): Record<string, string> => {
  const computedStyle = window.getComputedStyle(element)
  return {
    width: computedStyle.width,
    height: computedStyle.height,
    color: computedStyle.color,
    backgroundColor: computedStyle.backgroundColor,
    display: computedStyle.display,
    position: computedStyle.position,
    fontSize: computedStyle.fontSize,
  }
}

// Function to get element attributes
const getElementAttributes = (element: HTMLElement): Record<string, string> => {
  const attributes: Record<string, string> = {}

  Array.from(element.attributes).forEach((attr) => {
    attributes[attr.name] = attr.value
  })

  return attributes
}

// Function to get React component name (if possible)
const getReactComponentName = (element: HTMLElement): string => {
  // Look for React-specific attributes
  const reactAttributes = ["data-reactroot", "data-reactid", "data-react-checksum", "data-component", "data-testid"]

  for (const attr of reactAttributes) {
    if (element.hasAttribute(attr)) {
      return element.getAttribute(attr) || "React Component"
    }
  }

  // Check for className patterns that might indicate component names
  const className = element.className
  if (typeof className === "string" && className) {
    // Look for PascalCase class names which might indicate component names
    const matches = className.match(/[A-Z][a-z]+(?:[A-Z][a-z]+)*/)
    if (matches && matches.length > 0) {
      return matches[0]
    }
  }

  return "Unknown Component"
}

export function ContextBar() {
  const activeContexts = useStore((state) => state.activeContexts)
  const contextScrollPosition = useStore((state) => state.contextScrollPosition)
  const hasContextOverflow = useStore((state) => state.hasContextOverflow)
  const setContextScrollPosition = useStore((state) => state.setContextScrollPosition)
  const setHasContextOverflow = useStore((state) => state.setHasContextOverflow)
  const setIsOpen = useStore((state) => state.setIsOpen)
  const addContext = useStore((state) => state.addContext)
  const clearContexts = useStore((state) => state.clearContexts)
  const isGenerating = useStore((state) => state.isGenerating)
  const messages = useStore((state) => state.messages)
  const setIsElementSelecting = useStore((state) => state.setIsElementSelecting)

  const contextContainerRef = useRef<HTMLDivElement>(null)
  const selectionModeRef = useRef<boolean>(false)
  const originalCursorRef = useRef<string>("")

  // Clear contexts at the start of communication
  useEffect(() => {
    if (messages.length === 0) {
      clearContexts()
    }
  }, [messages, clearContexts])

  // Clear contexts after a message is sent (when generation starts)
  useEffect(() => {
    if (isGenerating) {
      clearContexts()
    }
  }, [isGenerating, clearContexts])

  // Check for context overflow
  useEffect(() => {
    const checkForOverflow = () => {
      if (contextContainerRef.current) {
        const { scrollWidth, clientWidth } = contextContainerRef.current
        setHasContextOverflow(scrollWidth > clientWidth)
      }
    }

    checkForOverflow()

    // Re-check when contexts change
    window.addEventListener("resize", checkForOverflow)
    return () => window.removeEventListener("resize", checkForOverflow)
  }, [activeContexts, setHasContextOverflow])

  // Simple function to start element selection
  const startElementSelection = () => {
    console.log("Starting element selection mode")

    // Set the global element selecting state
    setIsElementSelecting(true)

    // Store original cursor
    originalCursorRef.current = document.body.style.cursor || "default"

    // Hide the chat panel
    setIsOpen(false)

    // Create a notification element
    const notification = document.createElement("div")
    notification.id = "selection-notification"
    notification.style.position = "fixed"
    notification.style.top = "20px"
    notification.style.left = "50%"
    notification.style.transform = "translateX(-50%)"
    notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
    notification.style.color = "white"
    notification.style.padding = "10px 20px"
    notification.style.borderRadius = "5px"
    notification.style.zIndex = "10000"
    notification.style.fontFamily = "Arial, sans-serif"
    notification.style.fontSize = "16px"
    notification.textContent = "Click on any element to select it, or press ESC to cancel"
    document.body.appendChild(notification)

    // Create a highlighter element
    const highlighter = document.createElement("div")
    highlighter.id = "element-highlighter"
    highlighter.style.position = "absolute"
    highlighter.style.border = "3px solid red"
    highlighter.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
    highlighter.style.pointerEvents = "none"
    highlighter.style.zIndex = "9999"
    highlighter.style.display = "none"
    document.body.appendChild(highlighter)

    // Set selection mode flag
    selectionModeRef.current = true

    // Function to handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectionModeRef.current) return

      const target = e.target as HTMLElement

      // Skip if it's our notification or highlighter
      if (target === notification || target === highlighter) return

      // Skip if it's the html or body
      if (target.tagName.toLowerCase() === "html" || target.tagName.toLowerCase() === "body") return

      // Get element bounds
      const rect = target.getBoundingClientRect()

      // Update highlighter
      highlighter.style.top = `${window.scrollY + rect.top}px`
      highlighter.style.left = `${window.scrollX + rect.left}px`
      highlighter.style.width = `${rect.width}px`
      highlighter.style.height = `${rect.height}px`
      highlighter.style.display = "block"

      // Update notification
      const tagName = target.tagName.toLowerCase()
      const id = target.id ? `#${target.id}` : ""
      notification.textContent = `Select: ${tagName}${id} (Click to select, ESC to cancel)`
    }

    // Function to handle element selection
    const handleElementClick = (e: MouseEvent) => {
      if (!selectionModeRef.current) return

      // Prevent default behavior
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement

      // Skip if it's our notification or highlighter
      if (target === notification || target === highlighter) return

      // Get element info
      const tagName = target.tagName.toLowerCase()
      const id = target.id ? `#${target.id}` : ""
      const elementName = `${tagName}${id}`

      // Get additional information
      const xpath = getXPath(target)
      const rect = target.getBoundingClientRect()
      const size = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      }
      const styles = getStylesSummary(target)
      const attributes = getElementAttributes(target)
      const componentName = getReactComponentName(target)

      // Create a detailed element info object
      const elementInfo = {
        selector: elementName,
        xpath,
        componentName,
        size,
        styles,
        attributes,
        textContent: target.textContent?.slice(0, 100) || "",
      }

      console.log("Element selected:", elementInfo)

      // Add to context with detailed information
      const contextName = `${elementName} (${componentName})`
      const contextDescription = JSON.stringify(elementInfo, null, 2)

      // Add to context with more detailed information
      addContext({
        type: "Elements",
        name: contextName,
        // Store the detailed info in a property that can be accessed later
        elementInfo: elementInfo,
      })

      // Exit selection mode
      exitSelectionMode()
    }

    // Function to handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectionModeRef.current) {
        console.log("Selection cancelled with ESC key")
        exitSelectionMode()
      }
    }

    // Function to exit selection mode
    const exitSelectionMode = () => {
      console.log("Exiting selection mode")

      // Reset the global element selecting state
      setIsElementSelecting(false)

      // Remove notification and highlighter
      const notificationEl = document.getElementById("selection-notification")
      const highlighterEl = document.getElementById("element-highlighter")

      if (notificationEl) notificationEl.remove()
      if (highlighterEl) highlighterEl.remove()

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("click", handleElementClick, true)
      document.removeEventListener("keydown", handleKeyDown)

      // Reset selection mode flag
      selectionModeRef.current = false

      // Restore original cursor
      document.body.style.cursor = originalCursorRef.current

      // Show chat panel again
      setIsOpen(true)
    }

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("click", handleElementClick, true)
    document.addEventListener("keydown", handleKeyDown)

    // Set cursor
    document.body.style.cursor = "crosshair"
  }

  const scrollContexts = (direction: "left" | "right") => {
    if (contextContainerRef.current) {
      const container = contextContainerRef.current
      const scrollAmount = direction === "left" ? -100 : 100
      container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      setContextScrollPosition(container.scrollLeft + scrollAmount)
    }
  }

  const handleContextScroll = () => {
    if (contextContainerRef.current) {
      setContextScrollPosition(contextContainerRef.current.scrollLeft)
    }
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-t bg-gray-50 text-xs relative">
      <ContextSelector />
      <FileAttachmentButton />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-gray-500"
        title="Select element on page"
        onClick={startElementSelection}
      >
        <Pointer className="h-3 w-3" />
      </Button>

      {hasContextOverflow && contextScrollPosition > 0 && (
        <ContextScrollButton direction="left" onClick={() => scrollContexts("left")} />
      )}

      <div
        ref={contextContainerRef}
        className="flex items-center gap-1 overflow-x-auto flex-1 px-1 no-scrollbar"
        onScroll={handleContextScroll}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {activeContexts.map((context) => (
          <ContextBadge key={`${context.type}-${context.name}`} context={context} />
        ))}
      </div>

      {hasContextOverflow &&
        contextContainerRef.current &&
        contextScrollPosition <
          contextContainerRef.current.scrollWidth - contextContainerRef.current.clientWidth - 10 && (
          <ContextScrollButton direction="right" onClick={() => scrollContexts("right")} className="ml-auto" />
        )}
    </div>
  )
}
