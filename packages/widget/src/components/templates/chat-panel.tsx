"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { ResizeHandle } from "@/components/atoms/resize-handle"
import { ChatHeader } from "@/components/molecules/chat-header"
import { MessageList } from "@/components/organisms/message-list"
import { ContextBar } from "@/components/organisms/context-bar"
import { ChatInput } from "@/components/molecules/chat-input"

export function ChatPanel() {
  const position = useStore((state) => state.position)
  const size = useStore((state) => state.size)
  const isDragging = useStore((state) => state.isDragging)
  const setIsDragging = useStore((state) => state.setIsDragging)
  const setDragOffset = useStore((state) => state.setDragOffset)
  const dockPosition = useStore((state) => state.dockPosition)

  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging in float mode
    if (dockPosition !== "float") return

    if (panelRef.current && e.target === panelRef.current.querySelector(".drag-handle")) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position - follow mouse movement exactly without constraints
        const newX = e.clientX - useStore.getState().dragOffset.x
        const newY = e.clientY - useStore.getState().dragOffset.y

        // Set position without any snapping or sticking behavior
        useStore.getState().setPosition({ x: newX, y: newY })
      }

      if (useStore.getState().isResizing && useStore.getState().resizeDirection) {
        e.preventDefault()
        const resizeDirection = useStore.getState().resizeDirection
        const position = useStore.getState().position
        const size = useStore.getState().size
        const dragOffset = useStore.getState().dragOffset

        const newSize = { ...size }

        if (resizeDirection?.includes("e")) {
          newSize.width = Math.max(350, e.clientX - position.x)
        }
        if (resizeDirection?.includes("s")) {
          newSize.height = Math.max(400, e.clientY - position.y)
        }
        if (resizeDirection?.includes("w")) {
          const deltaX = e.clientX - (position.x + dragOffset.x)
          newSize.width = Math.max(350, size.width - deltaX)
          useStore.getState().setPosition({ ...position, x: position.x + deltaX })
        }
        if (resizeDirection?.includes("n")) {
          const deltaY = e.clientY - (position.y + dragOffset.x)
          newSize.height = Math.max(400, size.height - deltaY)
          useStore.getState().setPosition({ ...position, y: position.y + deltaY })
        }

        useStore.getState().setSize(newSize)
      }
    }

    const handleMouseUp = () => {
      useStore.getState().setIsDragging(false)
      useStore.getState().setIsResizing(false)
      useStore.getState().setResizeDirection(null)
    }

    if (isDragging || useStore.getState().isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Get panel styles based on dock position
  const getPanelStyles = () => {
    // Base styles
    const styles: React.CSSProperties = {
      width: `${size.width}px`,
      height: `${size.height}px`,
    }

    // Apply styles based on dock position
    switch (dockPosition) {
      case "float":
        styles.width = `${size.width}px`
        styles.height = `${size.height}px`
        styles.left = position.x || "auto"
        styles.right = position.x ? "auto" : "1rem"
        styles.top = position.y || "auto"
        styles.bottom = position.y ? "auto" : "1rem"
        break
      case "left":
        styles.width = "350px"
        styles.height = "100vh"
        styles.left = 0
        styles.top = 0
        styles.bottom = 0
        styles.right = "auto"
        styles.borderRadius = "0"
        styles.borderLeft = "none"
        styles.borderTop = "none"
        styles.borderBottom = "none"
        break
      case "right":
        styles.width = "350px"
        styles.height = "100vh"
        styles.right = 0
        styles.top = 0
        styles.bottom = 0
        styles.left = "auto"
        styles.borderRadius = "0"
        styles.borderRight = "none"
        styles.borderTop = "none"
        styles.borderBottom = "none"
        break
      case "bottom":
        styles.width = "100vw"
        styles.height = "300px"
        styles.bottom = 0
        styles.left = 0
        styles.right = 0
        styles.top = "auto"
        styles.borderRadius = "0"
        styles.borderLeft = "none"
        styles.borderRight = "none"
        styles.borderBottom = "none"
        break
      case "top":
        styles.width = "100vw"
        styles.height = "300px"
        styles.top = 0
        styles.left = 0
        styles.right = 0
        styles.bottom = "auto"
        styles.borderRadius = "0"
        styles.borderLeft = "none"
        styles.borderRight = "none"
        styles.borderTop = "none"
        break
      case "popup":
        // Center in the middle of the screen with a fixed size
        styles.width = "600px"
        styles.height = "500px"
        styles.top = "50%"
        styles.left = "50%"
        styles.transform = "translate(-50%, -50%)"
        styles.borderRadius = "8px"
        // Add a backdrop shadow for popup mode
        styles.boxShadow = "0 0 0 100vmax rgba(0, 0, 0, 0.3)"
        break
    }

    return styles
  }

  // Determine if resize handles should be shown
  const showResizeHandles = dockPosition === "float"

  // Add overlay for popup mode
  const renderOverlay = () => {
    if (dockPosition === "popup") {
      return (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => useStore.getState().setDockPosition("float")}
        />
      )
    }
    return null
  }

  return (
    <>
      {renderOverlay()}
      <div
        ref={panelRef}
        className="fixed z-50 flex flex-col bg-gray-50 overflow-hidden shadow-xl border border-gray-200"
        style={getPanelStyles()}
        onMouseDown={handleMouseDown}
      >
        {/* Resize handles - only show in float mode */}
        {showResizeHandles && (
          <>
            <ResizeHandle direction="nw" className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" />
            <ResizeHandle direction="ne" className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" />
            <ResizeHandle direction="sw" className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" />
            <ResizeHandle direction="se" className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" />
            <ResizeHandle direction="n" className="absolute top-0 left-3 right-3 h-3 cursor-n-resize z-50" />
            <ResizeHandle direction="s" className="absolute bottom-0 left-3 right-3 h-3 cursor-s-resize z-50" />
            <ResizeHandle direction="w" className="absolute left-0 top-3 bottom-3 w-3 cursor-w-resize z-50" />
            <ResizeHandle direction="e" className="absolute right-0 top-3 bottom-3 w-3 cursor-e-resize z-50" />
          </>
        )}

        <ChatHeader />
        <MessageList />
        <ContextBar />
        <ChatInput />
      </div>
    </>
  )
}
