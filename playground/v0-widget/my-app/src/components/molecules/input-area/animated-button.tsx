"use client"

import type React from "react"
import { useState, useEffect } from "react"
import styled, { keyframes, css } from "styled-components"

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
`

interface AnimatedWrapperProps {
  $isVisible: boolean
  $isExiting: boolean
}

const AnimatedWrapper = styled.div<AnimatedWrapperProps>`
  display: inline-flex;
  ${({ $isVisible, $isExiting }) => {
    if ($isVisible && !$isExiting) {
      return css`
        animation: ${fadeInScale} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      `
    }
    if ($isExiting) {
      return css`
        animation: ${fadeOut} 0.2s ease-in-out forwards;
      `
    }
    return ""
  }}
`

interface AnimatedButtonProps {
  isVisible: boolean
  children: React.ReactNode
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ isVisible, children }) => {
  const [shouldRender, setShouldRender] = useState(isVisible)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      setIsExiting(false)
    } else if (shouldRender) {
      setIsExiting(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 200) // Match this to the fadeOut animation duration
      return () => clearTimeout(timer)
    }
  }, [isVisible, shouldRender])

  if (!shouldRender) {
    return null
  }

  return (
    <AnimatedWrapper $isVisible={isVisible} $isExiting={isExiting}>
      {children}
    </AnimatedWrapper>
  )
}

export default AnimatedButton
