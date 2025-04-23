"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChatPanel } from "../components/chat-panel"
import { PreviewPanel } from "../components/preview-panel"
import { initialMessages } from "../mocks/messages"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu } from "@radix-ui/react-dropdown-menu"
import StackCard from "@/components/stack-card"

const STACK_DESCRIPTION = `# React + Next.js + Tailwind CSS

This stack combines React, Next.js, and Tailwind CSS for a powerful and efficient frontend development experience.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
2. Run the development server:
   \`\`\`bash
   npm run dev
3. Open <http://localhost:3000> in your browser.
## Learn More

- [React Documentation](http://example.com)
- [Next.js Documentation](http://example.com)
- [Tailwind CSS Documentation](http://example.com)
`;

export default function SplitInterface() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(30) // Default 30%
  const [isResizing, setIsResizing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("https://example.com/preview")
  const containerRef = useRef<HTMLDivElement>(null)
  const initialX = useRef<number>(0)
  const initialWidth = useRef<number>(0)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    initialX.current = e.clientX
    initialWidth.current = leftPanelWidth
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const deltaX = e.clientX - initialX.current
      const deltaPercentage = (deltaX / containerWidth) * 100

      // Ensure the left panel is between 20% and 50% wide
      const newWidth = Math.min(Math.max(initialWidth.current + deltaPercentage, 20), 50)
      setLeftPanelWidth(newWidth)
    },
    [isResizing],
  )

  const stopResize = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", stopResize)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", stopResize)
    }
  }, [isResizing, handleMouseMove, stopResize])

  const regenerateMessage = (messageId: string) => {
    // This would need to be updated to use the AI SDK
    console.log("Regenerate message:", messageId)
  }

  const navigateRegeneration = (messageId: string, direction: "prev" | "next") => {
    // This would need to be updated to use the AI SDK
    console.log("Navigate regeneration:", messageId, direction)
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const handleReload = () => {
    setPreviewUrl("https://example.com/preview?" + Date.now())
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-screen bg-background"
      style={{ cursor: isResizing ? "col-resize" : "default" }}
    >
      {/* Chat Messages Section - Left Panel */}
      <div
        className={`w-full md:flex flex-col border-r border-border transition-all duration-300 ease-in-out ${
          isFullScreen ? "md:w-0 md:opacity-0" : ""
        }`}
        style={{ width: isFullScreen ? "0%" : `${leftPanelWidth}%` }}
      >
        <ChatPanel
          initialMessages={initialMessages}
          onRegenerate={regenerateMessage}
          onNavigateRegeneration={navigateRegeneration}
        />
      </div>

      {/* Resize Handle */}
      {!isFullScreen && (
        <div
          className="hidden md:block w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors"
          onMouseDown={startResize}
        />
      )}

      <div className="p-6">
        <StackCard stackName={'React + Next.js + Tailwind CSS'} technologies={[{
          name: 'React',
          docLink: 'https://reactjs.org/docs/getting-started.html',
          // React repo github link
          codeLink: 'https://github.com/facebook/react',
        }, {
          name: 'Next.js',
          docLink: 'https://nextjs.org/docs/getting-started',
          // Next.js repo github link
          codeLink: 'https://github.com/vercel/next.js/'
        }, {
          name: 'Tailwind CSS',
          docLink: 'https://tailwindcss.com/docs/installation',
          // Tailwind CSS repo github link
          codeLink: 'https://github.com/tailwindlabs/tailwindcss'
        }]}
        category="Frontend"
        description={STACK_DESCRIPTION}
        />
      </div>

      {/* Preview Block - Right Panel */}
      {/* <div
        className={`w-full md:flex flex-col transition-all duration-300 ease-in-out ${isFullScreen ? "md:w-full" : ""}`}
        style={{ width: isFullScreen ? "100%" : `${100 - leftPanelWidth}%` }}
      >
        <PreviewPanel
          previewUrl={previewUrl}
          onReload={handleReload}
          onToggleFullScreen={toggleFullScreen}
          isFullScreen={isFullScreen}
        />
      </div> */}
    </div>
  )
}

