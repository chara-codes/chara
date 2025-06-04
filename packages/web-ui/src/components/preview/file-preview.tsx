"use client";

import React from "react";
import { usePreviewStore } from "@/store/preview-store";

export function FilePreview() {
  const { activeFile, updateFileContent } = usePreviewStore();
  
  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-center">Select a file to preview</p>
      </div>
    );
  }
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFileContent(activeFile.id, e.target.value);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-4 py-2 flex items-center">
        <span className="text-sm font-medium">{activeFile.name}</span>
      </div>
      
      <div className="flex-1 overflow-auto">
        <textarea
          value={activeFile.content}
          onChange={handleContentChange}
          className="w-full h-full p-4 font-mono text-sm bg-background focus:outline-none resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
