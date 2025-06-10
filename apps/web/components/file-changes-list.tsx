"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileCode, Plus, Minus, Edit, RotateCcw } from "lucide-react"
import type { FileChange } from "../types"
import { DiffViewer } from "./diff-viewer"

interface FileChangesListProps {
  changes: FileChange[]
}

export function FileChangesList({ changes }: FileChangesListProps) {
  const [selectedFile, setSelectedFile] = useState<FileChange | null>(null)

  const getIconForChangeType = (type: string) => {
    switch (type) {
      case "add":
        return <Plus className="h-4 w-4 text-green-500" />
      case "delete":
        return <Minus className="h-4 w-4 text-red-500" />
      case "modify":
        return <Edit className="h-4 w-4 text-blue-500" />
      default:
        return <FileCode className="h-4 w-4 text-gray-500" />
    }
  }

  const getColorForChangeType = (type: string) => {
    switch (type) {
      case "add":
        return "text-green-700 bg-green-50 border-green-200"
      case "delete":
        return "text-red-700 bg-red-50 border-red-200"
      case "modify":
        return "text-blue-700 bg-blue-50 border-blue-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  // Get the version number (if any)
  const version = changes.length > 0 && changes[0].version !== undefined ? changes[0].version : null

  const handleRollback = () => {
    // In a real app, this would trigger an API call to rollback changes
    if (version) {
      alert(`Rolling back to version ${version}`)
    }
  }

  return (
    <div className="mt-3 border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b font-medium flex items-center justify-between">
        <div className="flex items-center">
          <FileCode className="h-4 w-4 mr-2" />
          File Changes
          {version !== null && <span className="ml-2 text-xs text-gray-500">(Version {version})</span>}
        </div>
        {version !== null && version !== 0 && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRollback}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Rollback
          </Button>
        )}
      </div>
      <div className="divide-y">
        {changes.map((change) => (
          <Dialog key={change.id}>
            <DialogTrigger asChild>
              <div
                className="px-4 py-3 flex items-start hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedFile(change)}
              >
                <div className="mr-3 mt-0.5">{getIconForChangeType(change.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-mono text-sm font-medium">{change.filename}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getColorForChangeType(change.type)}`}>
                      {change.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                </div>
              </div>
            </DialogTrigger>
            {change.diff && (
              <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <FileCode className="h-4 w-4 mr-2" />
                    {change.filename}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getColorForChangeType(change.type)}`}>
                      {change.type}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden h-full">
                  <DiffViewer diff={change.diff} />
                </div>
              </DialogContent>
            )}
          </Dialog>
        ))}
      </div>
    </div>
  )
}

