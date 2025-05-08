"use client"

import { useState } from "react"
import { Folder, ChevronDown, ChevronRight, FileText } from "lucide-react"

interface FileTreeProps {
  files: Array<{ path: string; type: string }>
  changedFiles: Array<{ path: string; type: "add" | "modify" | "delete" }>
  selectedFile: string
  onSelectFile: (path: string) => void
}

export function FileTree({ files, changedFiles, selectedFile, onSelectFile }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/components": true,
    "src/utils": true,
    "src/styles": true,
  })

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }))
  }

  const getFileChangeType = (filePath: string) => {
    const changedFile = changedFiles.find((file) => file.path === filePath)
    return changedFile ? changedFile.type : null
  }
  
  // Check if there are any files to display
  const hasFiles = Object.keys(filesByFolder).length > 0

  // Group files by their parent folders
  const filesByFolder: Record<string, Array<{ path: string; type: string }>> = {}
  
  // Ensure all parent folders exist for proper nesting
  const ensureParentFolders = (filePath: string) => {
    const parts = filePath.split("/")
    
    // Create virtual folder entries for each parent level
    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parts.slice(0, i + 1).join("/")
      const parentPath = i === 0 ? "" : parts.slice(0, i).join("/")
      
      // Add this folder to its parent's children if not already there
      if (!filesByFolder[parentPath]) {
        filesByFolder[parentPath] = []
      }
      
      const folderExists = filesByFolder[parentPath].some(
        item => item.path === folderPath && item.type === "folder"
      )
      
      if (!folderExists) {
        filesByFolder[parentPath].push({ path: folderPath, type: "folder" })
      }
    }
  }

  files.forEach((file) => {
    const parts = file.path.split("/")
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ""

    // Ensure all parent folders exist
    ensureParentFolders(file.path)
    
    if (!filesByFolder[parentPath]) {
      filesByFolder[parentPath] = []
    }

    filesByFolder[parentPath].push(file)
  })

  const renderFolder = (folderPath = "") => {
    const items = filesByFolder[folderPath] || []

    return items.map((item) => {
      const isExpanded = expandedFolders[item.path] || false
      const depth = folderPath ? folderPath.split("/").length : 0
      const paddingLeft = `${depth * 1.5}rem`

      if (item.type === "folder") {
        const hasChildren = filesByFolder[item.path] && filesByFolder[item.path].length > 0

        return (
          <div key={item.path}>
            <div
              className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer`}
              style={{ paddingLeft }}
              onClick={() => toggleFolder(item.path)}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )
              ) : (
                <span className="w-4 mr-1" />
              )}
              <Folder className="h-4 w-4 mr-2 text-blue-400" />
              <span>{item.path.split("/").pop()}</span>
            </div>

            {isExpanded && hasChildren && renderFolder(item.path)}
          </div>
        )
      } else {
        const fileName = item.path.split("/").pop() || ""
        const isSelected = selectedFile === item.path
        const changeType = getFileChangeType(item.path)

        let statusColor = ""
        let statusText = ""
        let iconColor = "text-gray-400"

        if (changeType === "modify") {
          statusColor = "bg-amber-900/50 text-amber-400"
          statusText = "modified"
          iconColor = "text-amber-400"
        } else if (changeType === "add") {
          statusColor = "bg-green-900/50 text-green-400"
          statusText = "new"
          iconColor = "text-green-400"
        } else if (changeType === "delete") {
          statusColor = "bg-red-900/50 text-red-400"
          statusText = "deleted"
          iconColor = "text-red-400"
        }

        return (
          <div
            key={item.path}
            className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer ${
              isSelected ? "bg-gray-700 text-blue-400" : ""
            } ${changeType ? (changeType === "add" ? "text-green-400" : changeType === "modify" ? "text-amber-400" : changeType === "delete" ? "text-red-400" : "") : ""}`}
            style={{ paddingLeft: `calc(${paddingLeft} + 1.5rem)` }}
            onClick={() => onSelectFile(item.path)}
          >
            <FileText className={`h-4 w-4 mr-2 ${iconColor}`} />
            <span>{fileName}</span>
            {changeType && (
              <>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
                {fileName.endsWith('/') && <span className="ml-1 text-gray-500">(empty)</span>}
              </>
            )}
          </div>
        )
      }
    })
  }

  return (
    <div className="text-sm text-gray-200">
      {hasFiles ? (
        renderFolder()
      ) : (
        <div className="p-4 text-gray-400 italic">
          No files in project
        </div>
      )}
    </div>
  )
}

