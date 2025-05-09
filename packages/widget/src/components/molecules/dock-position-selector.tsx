"use client"

import type React from "react"

import { useStore, type DockPosition } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Maximize2, PanelLeft, PanelRight, PanelBottom, PanelTop, Square } from "lucide-react"

export function DockPositionSelector() {
  const dockPosition = useStore((state) => state.dockPosition)
  const setDockPosition = useStore((state) => state.setDockPosition)

  const positions: { value: DockPosition; icon: React.ReactNode; label: string }[] = [
    { value: "float", icon: <Maximize2 className="h-4 w-4" />, label: "Float" },
    { value: "left", icon: <PanelLeft className="h-4 w-4" />, label: "Left" },
    { value: "right", icon: <PanelRight className="h-4 w-4" />, label: "Right" },
    { value: "bottom", icon: <PanelBottom className="h-4 w-4" />, label: "Bottom" },
    { value: "top", icon: <PanelTop className="h-4 w-4" />, label: "Top" },
    { value: "popup", icon: <Square className="h-4 w-4" />, label: "Popup" },
  ]

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-sm font-medium text-gray-700">Dock Position</span>
      <div className="flex space-x-2">
        {positions.map((pos) => (
          <Button
            key={pos.value}
            variant={dockPosition === pos.value ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setDockPosition(pos.value)}
            title={pos.label}
          >
            {pos.icon}
          </Button>
        ))}
      </div>
    </div>
  )
}
