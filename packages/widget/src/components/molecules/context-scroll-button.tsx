"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContextScrollButtonProps {
  direction: "left" | "right"
  onClick: () => void
  className?: string
}

export function ContextScrollButton({ direction, onClick, className = "" }: ContextScrollButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-6 w-6 text-gray-500 z-10 bg-gray-50/80 hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {direction === "left" ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
    </Button>
  )
}
