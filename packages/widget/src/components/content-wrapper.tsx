"use client"

import type React from "react"

import { useStore } from "@/lib/store"

interface ContentWrapperProps {
  children: React.ReactNode
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  const dockPosition = useStore((state) => state.dockPosition)
  const mainContentWidth = useStore((state) => state.mainContentWidth)
  const isOpen = useStore((state) => state.isOpen)

  // Determine if we should adjust the content width
  const shouldAdjustWidth = isOpen && dockPosition === "devtools"

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        width: shouldAdjustWidth ? mainContentWidth : "100%",
        // Remove the marginRight that was causing the gap
      }}
    >
      {children}
    </div>
  )
}
