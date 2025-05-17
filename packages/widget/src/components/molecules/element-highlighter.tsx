"use client"

import { useEffect, useRef } from "react"

interface ElementHighlighterProps {
  isActive: boolean
  onExit: () => void
}

export function ElementHighlighter({ isActive, onExit }: ElementHighlighterProps) {
  const highlighterRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, onExit])

  if (!isActive) return null

  return (
    <>
      <div
        ref={notificationRef}
        className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-5 py-2.5 rounded-md z-[10000]"
      >
        Click on any element to select it, or press ESC to cancel
      </div>
      <div
        ref={highlighterRef}
        className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none z-[9999] hidden"
      />
    </>
  )
}
