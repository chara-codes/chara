import React from "react";
import { Lock, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface URLBarProps {
  url: string;
  onReload: () => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}

function URLBar({ url, onReload, onToggleFullScreen, isFullScreen }: URLBarProps) {
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

export interface PreviewBlockProps {
  url: string;
  onReload: () => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export function PreviewBlock({ 
  url, 
  onReload, 
  onToggleFullScreen, 
  isFullScreen 
}: PreviewBlockProps) {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <URLBar
        url={url}
        onReload={onReload}
        onToggleFullScreen={onToggleFullScreen}
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
  );
}