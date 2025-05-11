"use client"

import { useRef, useCallback } from "react"
import { useStore } from "@/lib/store"
import { getDomElementInfo } from "@/lib/dom-utils"
import type { ContextItem } from "@/types"

interface ElementSelectorOptions {
  onElementSelected: (context: ContextItem) => void
}

export function useElementSelector({ onElementSelected }: ElementSelectorOptions) {
  const setIsOpen = useStore((state) => state.setIsOpen)
  const setIsElementSelecting = useStore((state) => state.setIsElementSelecting)

  const selectionModeRef = useRef<boolean>(false)
  const originalCursorRef = useRef<string>("")
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const highlighterRef = useRef<HTMLDivElement | null>(null)

  const exitSelectionMode = useCallback(() => {
    // Reset the global element selecting state
    setIsElementSelecting(false)

    // Remove notification and highlighter
    if (notificationRef.current) notificationRef.current.remove()
    if (highlighterRef.current) highlighterRef.current.remove()

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
  }, [setIsElementSelecting, setIsOpen])

  const handleElementClick = useCallback(
    (e: MouseEvent) => {
      if (!selectionModeRef.current) return

      // Prevent default behavior
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement

      // Skip if it's our notification or highlighter
      if (
        target === notificationRef.current ||
        target === highlighterRef.current ||
        target.tagName.toLowerCase() === "html" ||
        target.tagName.toLowerCase() === "body"
      )
        return

      // Get element info
      const elementInfo = getDomElementInfo(target)

      // Create context name
      const contextName = `${elementInfo.selector} (${elementInfo.componentName})`

      // Add to context with detailed information
      onElementSelected({
        type: "Elements",
        name: contextName,
        elementInfo: elementInfo as any, // Using type assertion to fix the type error
      })

      // Exit selection mode
      exitSelectionMode()
    },
    [exitSelectionMode, onElementSelected],
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectionModeRef.current) return

    const target = e.target as HTMLElement

    // Skip if it's our notification or highlighter
    if (
      target === notificationRef.current ||
      target === highlighterRef.current ||
      target.tagName.toLowerCase() === "html" ||
      target.tagName.toLowerCase() === "body"
    )
      return

    // Get element bounds
    const rect = target.getBoundingClientRect()

    // Update highlighter
    if (highlighterRef.current) {
      highlighterRef.current.style.top = `${window.scrollY + rect.top}px`
      highlighterRef.current.style.left = `${window.scrollX + rect.left}px`
      highlighterRef.current.style.width = `${rect.width}px`
      highlighterRef.current.style.height = `${rect.height}px`
      highlighterRef.current.style.display = "block"
    }

    // Update notification
    const tagName = target.tagName.toLowerCase()
    const id = target.id ? `#${target.id}` : ""
    if (notificationRef.current) {
      notificationRef.current.textContent = `Select: ${tagName}${id} (Click to select, ESC to cancel)`
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectionModeRef.current) {
        exitSelectionMode()
      }
    },
    [exitSelectionMode],
  )

  const startElementSelection = useCallback(() => {
    // Set the global element selecting state
    setIsElementSelecting(true)

    // Store original cursor
    originalCursorRef.current = document.body.style.cursor || "default"

    // Hide the chat panel
    setIsOpen(false)

    // Create a notification element
    notificationRef.current = document.createElement("div")
    notificationRef.current.id = "selection-notification"
    notificationRef.current.style.position = "fixed"
    notificationRef.current.style.top = "20px"
    notificationRef.current.style.left = "50%"
    notificationRef.current.style.transform = "translateX(-50%)"
    notificationRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
    notificationRef.current.style.color = "white"
    notificationRef.current.style.padding = "10px 20px"
    notificationRef.current.style.borderRadius = "5px"
    notificationRef.current.style.zIndex = "10000"
    notificationRef.current.style.fontFamily = "Arial, sans-serif"
    notificationRef.current.style.fontSize = "16px"
    notificationRef.current.textContent = "Click on any element to select it, or press ESC to cancel"
    document.body.appendChild(notificationRef.current)

    // Create a highlighter element
    highlighterRef.current = document.createElement("div")
    highlighterRef.current.id = "element-highlighter"
    highlighterRef.current.style.position = "absolute"
    highlighterRef.current.style.border = "3px solid red"
    highlighterRef.current.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
    highlighterRef.current.style.pointerEvents = "none"
    highlighterRef.current.style.zIndex = "9999"
    highlighterRef.current.style.display = "none"
    document.body.appendChild(highlighterRef.current)

    // Set selection mode flag
    selectionModeRef.current = true

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("click", handleElementClick, true)
    document.addEventListener("keydown", handleKeyDown)

    // Set cursor
    document.body.style.cursor = "crosshair"
  }, [handleElementClick, handleKeyDown, handleMouseMove, setIsElementSelecting, setIsOpen])

  return { startElementSelection }
}
