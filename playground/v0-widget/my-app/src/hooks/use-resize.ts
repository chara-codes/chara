"use client"

import { useState, useCallback, useEffect } from "react"

interface UseResizeOptions {
  minWidth: number
  maxWidth: number
  initialWidth: number
  onWidthChange?: (width: number) => void
}

export function useResize({ minWidth, maxWidth, initialWidth, onWidthChange }: UseResizeOptions) {
  const [width, setWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)

  const handleResize = useCallback(
    (newWidth: number) => {
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setWidth(constrainedWidth)
      setIsResizing(true)

      if (onWidthChange) {
        onWidthChange(constrainedWidth)
      }

      // Clear the resize state after a short delay
      if (window.resizeTimeout) {
        clearTimeout(window.resizeTimeout)
      }

      window.resizeTimeout = setTimeout(() => {
        setIsResizing(false)
      }, 100)
    },
    [minWidth, maxWidth, onWidthChange],
  )

  // Update width if initialWidth changes
  useEffect(() => {
    setWidth(initialWidth)
  }, [initialWidth])

  return {
    width,
    isResizing,
    handleResize,
  }
}
