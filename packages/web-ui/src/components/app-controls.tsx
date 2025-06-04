"use client";

import React from "react";
import { useAppStore } from "@/store/app-store";
import { Maximize2, Minimize2, SplitSquareHorizontal, Link, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppControls() {
  const { showPreview, togglePreview, syncWithChat, toggleSyncWithChat } = useAppStore();
  
  return (
    <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
      <Button
        onClick={toggleSyncWithChat}
        variant="default"
        size="icon"
        className="rounded-full shadow-md"
        title={syncWithChat ? "Disable sync with chat" : "Enable sync with chat"}
      >
        {syncWithChat ? <Link className="h-5 w-5" /> : <Link2Off className="h-5 w-5" />}
      </Button>
      
      <Button
        onClick={togglePreview}
        variant="default"
        size="icon"
        className="rounded-full shadow-md"
        title={showPreview ? "Hide preview" : "Show preview"}
      >
        {showPreview ? <Minimize2 className="h-5 w-5" /> : <SplitSquareHorizontal className="h-5 w-5" />}
      </Button>
    </div>
  );
}
