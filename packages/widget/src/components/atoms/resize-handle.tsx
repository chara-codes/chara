"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import styled from "styled-components"
import { theme } from "../../styles/theme"

const HandleContainer = styled.div<{ $isDragging: boolean }>`
  position: absolute;
  top: 0;
  left: -6px;
  width: 12px;
  height: 100%;
  cursor: col-resize;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
`

const HandleBar = styled.div<{ $isDragging: boolean }>`
  width: 4px;
  height: 100px;
  background-color: ${({ $isDragging }) => ($isDragging ? theme.colors.primary : theme.colors.border)};
  border-radius: 2px;
  opacity: ${({ $isDragging }) => ($isDragging ? 0.8 : 0)};
  transition: opacity 0.2s ease, background-color 0.2s ease;

  ${HandleContainer}:hover & {
    opacity: 0.5;
  }
`

// Fix: Use $active instead of active for the styled-component prop
const ResizeOverlay = styled.div<{ $active: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  cursor: col-resize;
  display: ${({ $active }) => ($active ? "block" : "none")};
`

interface ResizeHandleProps {
  onResize: (newWidth: number) => void
  currentWidth: number
  minWidth: number
  maxWidth: number
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, currentWidth, minWidth, maxWidth }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const handleRef = useRef<HTMLDivElement>(null)

  // Handle mouse/touch down
  const handleStart = useCallback(
    (clientX: number) => {
      setIsDragging(true)
      setStartX(clientX)
      setStartWidth(currentWidth)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [currentWidth],
  )

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return

      const deltaX = startX - clientX
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))

      // Only update if the width has changed
      if (newWidth !== currentWidth) {
        onResize(newWidth)
      }
    },
    [isDragging, startX, startWidth, currentWidth, minWidth, maxWidth, onResize],
  )

  // Handle mouse/touch up
  const handleEnd = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientX)
    },
    [handleStart],
  )

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleStart(e.touches[0].clientX)
    },
    [handleStart],
  )

  // Set up event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchend", handleEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, handleMove, handleEnd])

  return (
    <>
      <HandleContainer
        ref={handleRef}
        $isDragging={isDragging}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-label="Resize panel"
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-valuenow={currentWidth}
      >
        <HandleBar $isDragging={isDragging} />
      </HandleContainer>
      {/* Fix: Use $active instead of active */}
      <ResizeOverlay $active={isDragging} />
    </>
  )
}

export default ResizeHandle
