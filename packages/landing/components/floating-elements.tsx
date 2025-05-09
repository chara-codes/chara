"use client"

import { useEffect, useRef } from "react"

export function FloatingElements() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create floating elements
    const elements = []
    const shapes = ["circle", "triangle", "square", "star"]
    const colors = ["purple", "amber", "navy"]

    for (let i = 0; i < 15; i++) {
      const element = document.createElement("div")
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = Math.random() * 30 + 10

      element.className = `floating-element ${shape} ${color}`
      element.style.width = `${size}px`
      element.style.height = `${size}px`
      element.style.left = `${Math.random() * 100}%`
      element.style.top = `${Math.random() * 100}%`

      // Random animation duration between 10-20s
      const duration = Math.random() * 10 + 10
      element.style.animation = `float ${duration}s ease-in-out infinite`
      element.style.animationDelay = `${Math.random() * 5}s`

      container.appendChild(element)
      elements.push(element)
    }

    return () => {
      elements.forEach((element) => element.remove())
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}
