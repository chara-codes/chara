"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FileTree } from "./file-tree"
import { files, changedFiles } from "../mocks/files"
import { sampleCode, codeSamples } from "../mocks/code-samples"

export function CodePreview() {
  const [selectedFile, setSelectedFile] = useState("src/components/Counter.tsx")
  const [isFileTreeVisible, setIsFileTreeVisible] = useState(true)

  const handleSelectFile = (path: string) => {
    setSelectedFile(path)
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
              files={files}
              changedFiles={changedFiles}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        )}
        <div className="flex-1 bg-gray-900 text-gray-50 p-4 overflow-auto">
          <div className="flex items-center text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700">
            <span>{selectedFile}</span>
          </div>
          <pre className="font-mono text-sm">
            <code>{codeSamples[selectedFile] || sampleCode}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

