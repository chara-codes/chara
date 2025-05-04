"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { ScrollbarHideStyles } from "@/components/atoms/scroll-hide-style"
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

  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
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

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col bg-gray-50 overflow-hidden rounded-lg shadow-xl border border-gray-200"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: position.x || "auto",
        right: position.x ? "auto" : "1rem",
        top: position.y || "auto",
        bottom: position.y ? "auto" : "1rem",
      }}
      onMouseDown={handleMouseDown}
    >
      <ScrollbarHideStyles />

      {/* Resize handles */}
      <ResizeHandle direction="nw" className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" />
      <ResizeHandle direction="ne" className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" />
      <ResizeHandle direction="sw" className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" />
      <ResizeHandle direction="se" className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" />
      <ResizeHandle direction="n" className="absolute top-0 left-3 right-3 h-3 cursor-n-resize z-50" />
      <ResizeHandle direction="s" className="absolute bottom-0 left-3 right-3 h-3 cursor-s-resize z-50" />
      <ResizeHandle direction="w" className="absolute left-0 top-3 bottom-3 w-3 cursor-w-resize z-50" />
      <ResizeHandle direction="e" className="absolute right-0 top-3 bottom-3 w-3 cursor-e-resize z-50" />

      <ChatHeader />
      <MessageList />
      <ContextBar />
      <ChatInput />
    </div>
  )
}
