"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FileTree } from "./file-tree"
import { useProject } from "@/contexts/project-context"

export function CodePreview() {
  const { files, changedFiles, selectedFile, selectFile } = useProject()
  const [isFileTreeVisible, setIsFileTreeVisible] = useState(true)
  const [fileContent, setFileContent] = useState<string>("")

  // If no file is selected but we have files, select the first one
  useEffect(() => {
    if (!selectedFile && files.length > 0) {
      const firstFile = files.find(f => f.type === "file")
      if (firstFile) {
        selectFile(firstFile.path)
      }
    }
  }, [files, selectedFile, selectFile])
  
  // Update file content when selected file changes
  useEffect(() => {
    if (selectedFile) {
      const file = files.find(f => f.path === selectedFile)
      setFileContent(file?.content || "// No content available")
    } else {
      setFileContent("// No file selected")
    }
  }, [selectedFile, files])

  const handleSelectFile = (path: string) => {
    selectFile(path)
  }

  return (
    <div className="flex flex-col h-full rounded-md overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 border-b border-gray-700">
        <div className="text-sm text-gray-300">Code Explorer</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFileTreeVisible(!isFileTreeVisible)}
          className="h-7 text-gray-300 hover:text-white"
        >
          {isFileTreeVisible ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {isFileTreeVisible && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300">
            <FileTree
              files={files.map(f => ({ path: f.path, type: f.type === "folder" ? "folder" : "file" }))}
              changedFiles={changedFiles}
              selectedFile={selectedFile || ""}
              onSelectFile={handleSelectFile}
            />
          </div>
        )}
        <div className="flex-1 bg-gray-900 text-gray-50 p-4 overflow-auto">
          <div className="flex items-center text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700">
            <span>{selectedFile || "No file selected"}</span>
          </div>
          <pre className="font-mono text-sm">
            <code>{fileContent}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

