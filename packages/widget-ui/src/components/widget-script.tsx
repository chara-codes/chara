'use client';

import React, { useState, useEffect } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useWidgetStore } from '@/store/widget-store';
import { generateEmbedScript } from '@/lib/utils';

export function WidgetScript() {
  const [copied, setCopied] = useState(false);
  const [scriptCode, setScriptCode] = useState('');
  const { config } = useWidgetStore();

  // Generate the embed script when config changes
  useEffect(() => {
    setScriptCode(generateEmbedScript(config));
  }, [config]);

  // Copy the script to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Embed this widget on your website</h3>
      <p className="text-sm text-muted-foreground">
        Copy the code below and add it to your website to embed the chat widget.
      </p>

      <div className="relative">
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
          {scriptCode}
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Replace the domain with your actual domain where the widget is hosted.
      </p>
    </div>
  );
}
