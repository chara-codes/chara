"use client";

import React, { useEffect } from "react";
import { FileExplorer } from "@/components/preview/file-explorer";
import { FilePreview } from "@/components/preview/file-preview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { usePreviewStore } from "@/store/preview-store";

export function PreviewPanel() {
  const { initialize, isInitialized } = usePreviewStore();
  
  // Initialize the preview store on first render
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);
  
  return (
    <div className="h-full border-l">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <FileExplorer />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <FilePreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
