"use client"

import styled from "styled-components"
import type React from "react"
import { useState, useRef } from "react"

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  delay?: number
}

const TooltipContainer = styled.div`
  position: relative;
  display: inline-flex;
`

interface TooltipBubbleProps {
  $visible: boolean
  $position: "top" | "bottom" | "left" | "right"
}

const TooltipBubble = styled.div<TooltipBubbleProps>`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease-in-out;
  z-index: 1000;
  
  ${(props) => {
    switch (props.$position) {
      case "top":
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          
          &::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
          }
        `
      case "bottom":
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          
          &::after {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
          }
        `
      case "left":
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 100%;
            margin-top: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
          }
        `
      case "right":
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 100%;
            margin-top: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
          }
        `
      default:
        return ""
    }
  }}
`

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = "top", delay = 300 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  return (
    <TooltipContainer onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
      {children}
      <TooltipBubble $visible={isVisible} $position={position} role="tooltip" aria-hidden={!isVisible}>
        {text}
      </TooltipBubble>
    </TooltipContainer>
  )
}

export default Tooltip
