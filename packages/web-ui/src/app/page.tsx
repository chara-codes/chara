"use client";

import React, { useEffect } from "react";
import { Layout } from "@/components/layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { AppControls } from "@/components/app-controls";
import { useAppStore } from "@/store/app-store";
import { useChatStore } from "@frontend/core";
import { usePreviewStore } from "@/store/preview-store";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function HomePage() {
  const { showPreview, previewSize, setPreviewSize, syncWithChat } = useAppStore();
  const { messages } = useChatStore();
  const { applyFileDiffs } = usePreviewStore();
  
  // Sync file diffs with preview when messages change
  useEffect(() => {
    if (!syncWithChat) return;
    
    // Find the last AI message with file diffs
    const lastAiMessage = [...messages]
      .reverse()
      .find(msg => !msg.isUser && msg.fileDiffs && msg.fileDiffs.length > 0);
    
    if (lastAiMessage?.fileDiffs) {
      applyFileDiffs(lastAiMessage.fileDiffs);
    }
  }, [messages, syncWithChat, applyFileDiffs]);
  
  // Handle panel resize
  const handleResize = (sizes: number[]) => {
    if (sizes[0]) {
      setPreviewSize(100 - sizes[0]);
    }
  };
  
  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)]">
        {showPreview ? (
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={handleResize}
            className="h-full"
          >
            <ResizablePanel defaultSize={100 - previewSize} minSize={30}>
              <ChatPanel />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={previewSize} minSize={30}>
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ChatPanel />
        )}
        
        <AppControls />
      </div>
    </Layout>
  );
}
