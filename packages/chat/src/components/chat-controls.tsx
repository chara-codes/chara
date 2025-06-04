import React from 'react';
import { Button } from '@frontend/design-system';
import { Trash2, Download, RefreshCw } from 'lucide-react';
import type { ChatControlsProps } from '../types';

/**
 * Controls for managing the chat
 */
export function ChatControls({
  onClearChat,
  onExportChat,
  isResponding = false,
  className,
}: ChatControlsProps) {
  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          disabled={isResponding}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
        
        {onExportChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportChat}
            disabled={isResponding}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}
      </div>
      
      {isResponding && (
        <div className="flex items-center text-sm text-muted-foreground">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          AI is responding...
        </div>
      )}
    </div>
  );
}
