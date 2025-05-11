"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useStore } from "@/lib/store"

export function DevtoolsDivider() {
  const setSize = useStore((state) => state.setSize)
  const size = useStore((state) => state.size)
  const dockPosition = useStore((state) => state.dockPosition)
  const setMainContentWidth = useStore((state) => state.setMainContentWidth)

  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = size.width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate the new width based on the mouse movement
      // For a panel on the right side, we need to calculate differently
      // When moving left, the panel should get wider
      const deltaX = e.clientX - startXRef.current
      const newWidth = Math.max(300, startWidthRef.current - deltaX)

      // Update the panel size
      setSize({ ...size, width: newWidth })

      // Update the main content width
      setMainContentWidth(`calc(100% - ${newWidth}px)`)

      // Update CSS variable for the main content
      document.documentElement.style.setProperty("--content-width", `calc(100% - ${newWidth}px)`)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, setMainContentWidth, setSize, size])

  // Only render the divider in devtools mode - AFTER all hooks have been called
  if (dockPosition !== "devtools") {
    return null
  }

  return <div className={`devtools-divider ${isDragging ? "dragging" : ""}`} onMouseDown={handleMouseDown} />
}
