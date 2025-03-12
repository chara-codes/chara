"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTrpcChat } from "@/lib/trpc";
import { MemoizedMarkdown } from "./components/memoized-markdown";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  regenerations?: string[];
  currentRegenerationIndex?: number;
}

function URLBar({
  url,
  onReload,
  onToggleFullScreen,
  isFullScreen,
}: {
  url: string;
  onReload: () => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded px-3 py-2 mb-4">
      <div className="flex items-center flex-grow mr-2">
        <Lock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate">{url}</span>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReload}
          className="flex-shrink-0 mr-2"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullScreen}
          className="flex-shrink-0"
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SplitInterface() {
  const {
    messages,
    input,
    navigateRegeneration,
    regenerateMessage,
    handleInputChange,
    handleSubmit,
  } = useTrpcChat();

  const [leftPanelWidth, setLeftPanelWidth] = useState(30); // Default 30%
  const [isResizing, setIsResizing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("https://example.com/preview");
  const containerRef = useRef<HTMLDivElement>(null);
  const initialX = useRef<number>(0);
  const initialWidth = useRef<number>(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    initialX.current = e.clientX;
    initialWidth.current = leftPanelWidth;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - initialX.current;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      // Ensure the left panel is between 20% and 50% wide
      const newWidth = Math.min(
        Math.max(initialWidth.current + deltaPercentage, 20),
        50,
      );
      setLeftPanelWidth(newWidth);
    },
    [isResizing],
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResize);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing, handleMouseMove, stopResize]);

  const copyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleReload = () => {
    setPreviewUrl(`https://example.com/preview?${Date.now()}`);
  };

  // Handle keyboard events for input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  // Handle button click
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-screen bg-background"
      style={{ cursor: isResizing ? "col-resize" : "default" }}
    >
      {/* Chat Messages Section - Left Panel */}
      <div
        className={`w-full md:flex flex-col border-r border-border transition-all duration-300 ease-in-out ${
          isFullScreen ? "md:w-0 md:opacity-0" : ""
        }`}
        style={{ width: isFullScreen ? "0%" : `${leftPanelWidth}%` }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col items-start gap-2 max-w-[80%]">
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage
                        src="/placeholder.svg?height=32&width=32"
                        alt="Chara"
                      />
                      <AvatarFallback>Chara</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {/* {message.content} */}
                    <MemoizedMarkdown
                      id={message.id}
                      content={message.content}
                    />
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage
                        src="/placeholder.svg?height=32&width=32"
                        alt="User"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TooltipProvider>
                      <Tooltip open={copiedMessageId === message.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyMessage(message.content, message.id)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copied!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => regenerateMessage(message.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {(message.regenerations?.length ?? 0) > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigateRegeneration(message.id, "prev")
                          }
                          disabled={message.currentRegenerationIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>{`${(message.currentRegenerationIndex ?? 0) + 1}/${(message.regenerations?.length ?? 0) + 1}`}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigateRegeneration(message.id, "next")
                          }
                          disabled={
                            message.currentRegenerationIndex ===
                            message.regenerations?.length
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              onKeyDown={handleKeyDown}
            />
            <Button size="icon" onClick={handleButtonClick}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      {!isFullScreen && (
        <div
          className="hidden md:block w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors"
          onMouseDown={startResize}
        />
      )}

      {/* Preview Block - Right Panel */}
      <div
        className={`w-full md:flex flex-col transition-all duration-300 ease-in-out ${isFullScreen ? "md:w-full" : ""}`}
        style={{ width: isFullScreen ? "100%" : `${100 - leftPanelWidth}%` }}
      >
        <div className="flex-1 p-6 overflow-auto">
          <URLBar
            url={previewUrl}
            onReload={handleReload}
            onToggleFullScreen={toggleFullScreen}
            isFullScreen={isFullScreen}
          />
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Preview content will appear here
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Section 1</p>
                  </div>
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Section 2</p>
                  </div>
                </div>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Additional content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
