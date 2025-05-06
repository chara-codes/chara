"use client"

import { useRef, useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { ContextSelector } from "@/components/molecules/context-selector"
import { FileAttachmentButton } from "@/components/molecules/file-attachment-button"
import { ContextScrollButton } from "@/components/molecules/context-scroll-button"
import { ContextBadge } from "@/components/atoms/context-badge"
import { Button } from "@/components/ui/button"
import { Pointer } from "lucide-react"

export function ContextBar() {
  const activeContexts = useStore((state) => state.activeContexts)
  const contextScrollPosition = useStore((state) => state.contextScrollPosition)
  const hasContextOverflow = useStore((state) => state.hasContextOverflow)
  const setContextScrollPosition = useStore((state) => state.setContextScrollPosition)
  const setHasContextOverflow = useStore((state) => state.setHasContextOverflow)
  const setIsOpen = useStore((state) => state.setIsOpen)
  const addContext = useStore((state) => state.addContext)

  const [isSelecting, setIsSelecting] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const contextContainerRef = useRef<HTMLDivElement>(null)

  // Store original styles to restore them later
  const originalStyles = useRef<{ [key: string]: string }>({})

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

  // Handle element selection mode
  useEffect(() => {
    if (!isSelecting) return

    // Store original cursor
    const originalCursor = document.body.style.cursor

    // Change cursor to indicate selection mode
    document.body.style.cursor = "crosshair"

    // Function to handle element selection
    const handleElementSelect = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Get the clicked element
      const element = e.target as HTMLElement

      // Get element info
      const tagName = element.tagName.toLowerCase()
      const id = element.id ? `#${element.id}` : ""
      const classes =
        element.className && typeof element.className === "string" ? `.${element.className.split(" ")[0]}` : ""

      // Create a descriptive name for the element
      const elementName = `${tagName}${id}${classes}`

      // Add as context
      addContext({ type: "Elements", name: elementName })

      // Exit selection mode
      setIsSelecting(false)
      setIsOpen(true)

      // Remove highlight if any
      removeHighlight()

      // Clean up
      document.body.style.cursor = originalCursor
      document.removeEventListener("click", handleElementSelect, true)
      document.removeEventListener("keydown", handleEscapeKey)
      document.removeEventListener("mouseover", handleElementHover)
      document.removeEventListener("mouseout", handleElementLeave)
    }

    // Function to handle escape key press
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSelecting(false)
        setIsOpen(true)

        // Remove highlight if any
        removeHighlight()

        document.body.style.cursor = originalCursor
        document.removeEventListener("click", handleElementSelect, true)
        document.removeEventListener("keydown", handleEscapeKey)
        document.removeEventListener("mouseover", handleElementHover)
        document.removeEventListener("mouseout", handleElementLeave)
      }
    }

    // Function to handle element hover
    const handleElementHover = (e: MouseEvent) => {
      const element = e.target as HTMLElement

      // Skip if it's the same element or body/html
      if (
        element === highlightedElement ||
        element.tagName.toLowerCase() === "html" ||
        element.tagName.toLowerCase() === "body"
      ) {
        return
      }

      // Remove previous highlight
      removeHighlight()

      // Store original styles
      originalStyles.current = {
        outline: element.style.outline,
        outlineOffset: element.style.outlineOffset,
        transition: element.style.transition,
        position: element.style.position,
        zIndex: element.style.zIndex,
      }

      // Apply highlight styles
      element.style.outline = "2px dashed #3b82f6"
      element.style.outlineOffset = "2px"
      element.style.transition = "outline 0.2s ease"

      // Ensure the element is above others for better visibility
      if (element.style.position === "static") {
        element.style.position = "relative"
      }
      element.style.zIndex = "9999"

      // Update highlighted element reference
      setHighlightedElement(element)
    }

    // Function to handle element leave
    const handleElementLeave = (e: MouseEvent) => {
      // Only remove if we're not entering a child element
      if (!e.relatedTarget || !(e.relatedTarget as Node).contains(e.target as Node)) {
        removeHighlight()
      }
    }

    // Function to remove highlight
    const removeHighlight = () => {
      if (highlightedElement) {
        // Restore original styles
        Object.entries(originalStyles.current).forEach(([key, value]) => {
          // @ts-ignore - dynamic property assignment
          highlightedElement.style[key] = value
        })

        setHighlightedElement(null)
      }
    }

    // Add event listeners
    document.addEventListener("click", handleElementSelect, true)
    document.addEventListener("keydown", handleEscapeKey)
    document.addEventListener("mouseover", handleElementHover)
    document.addEventListener("mouseout", handleElementLeave)

    // Clean up on unmount or when selection mode ends
    return () => {
      document.body.style.cursor = originalCursor
      document.removeEventListener("click", handleElementSelect, true)
      document.removeEventListener("keydown", handleEscapeKey)
      document.removeEventListener("mouseover", handleElementHover)
      document.removeEventListener("mouseout", handleElementLeave)
      removeHighlight()
    }
  }, [isSelecting, highlightedElement, addContext, setIsOpen])

  const startElementSelection = () => {
    setIsSelecting(true)
    setIsOpen(false)
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
