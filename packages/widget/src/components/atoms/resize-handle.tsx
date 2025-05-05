"use client"

import type React from "react"

import { useStore } from "@/lib/store"

interface ResizeHandleProps {
  direction: string
  className: string
}

export function ResizeHandle({ direction, className }: ResizeHandleProps) {
  const setIsResizing = useStore((state) => state.setIsResizing)
  const setResizeDirection = useStore((state) => state.setResizeDirection)
  const setDragOffset = useStore((state) => state.setDragOffset)
  const position = useStore((state) => state.position)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  return <div className={className} onMouseDown={handleResizeStart} />
}
