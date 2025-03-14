"use client"

import { Button } from "@/components/ui/button"
import { Lock, RefreshCw, Maximize2, Minimize2 } from "lucide-react"

interface URLBarProps {
  url: string
  onReload: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
}

export function URLBar({ url, onReload, onToggleFullScreen, isFullScreen }: URLBarProps) {
  return (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4">
      <div className="flex items-center flex-grow mr-2">
        <Lock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate">{url}</span>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onReload} className="flex-shrink-0 mr-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleFullScreen} className="flex-shrink-0">
          {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

