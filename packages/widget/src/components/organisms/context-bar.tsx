"use client"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { ContextSelector } from "@/components/molecules/context-selector"
import { FileAttachmentButton } from "@/components/molecules/file-attachment-button"
import { ContextScrollButton } from "@/components/molecules/context-scroll-button"
import { ContextBadge } from "@/components/atoms/context-badge"
import { Button } from "@/components/ui/button"
import { Pointer } from "lucide-react"
import { useElementSelector } from "@/hooks/use-element-selector"

export function ContextBar() {
  const activeContexts = useStore((state) => state.activeContexts)
  const contextScrollPosition = useStore((state) => state.contextScrollPosition)
  const hasContextOverflow = useStore((state) => state.hasContextOverflow)
  const setContextScrollPosition = useStore((state) => state.setContextScrollPosition)
  const setHasContextOverflow = useStore((state) => state.setHasContextOverflow)
  const isGenerating = useStore((state) => state.isGenerating)
  const messages = useStore((state) => state.messages)
  const clearContexts = useStore((state) => state.clearContexts)
  const addContext = useStore((state) => state.addContext)

  const contextContainerRef = useRef<HTMLDivElement>(null)
  const { startElementSelection } = useElementSelector({ onElementSelected: addContext })

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
