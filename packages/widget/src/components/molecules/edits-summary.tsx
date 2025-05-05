"use client"

import { ChevronDown, ChevronRight, FileCode } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { changedFiles } from "@/mocks/data"

export function EditsSummary() {
  const isEditsSummaryExpanded = useStore((state) => state.isEditsSummaryExpanded)
  const toggleEditsSummary = useStore((state) => state.toggleEditsSummary)

  return (
    <div className="sticky bottom-0 border-t bg-gray-50 z-10 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
      <div className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={toggleEditsSummary}>
        <div className="flex items-center gap-2">
          {isEditsSummaryExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-700">Edits • {changedFiles.length} files</span>
        </div>
      </div>

      {isEditsSummaryExpanded && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-200 bg-white">
          {changedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">{file.path}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs bg-gray-50">
                  <span className="text-green-600">{file.changes.split(",")[0]}</span>
                  <span className="text-red-600">{file.changes.split(",")[1]}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
