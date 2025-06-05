import React from 'react';
import { getPreviewType, isPreviewableFile } from '../utils';
import type { PreviewPaneProps } from '../types';

/**
 * Component to preview file content
 */
export function PreviewPane({
  file,
  className,
}: PreviewPaneProps) {
  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center text-muted-foreground">
          <p>No file selected</p>
          <p className="text-sm">Select a file from the explorer to preview</p>
        </div>
      </div>
    );
  }

  if (!isPreviewableFile(file.name)) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center text-muted-foreground">
          <p>Preview not available</p>
          <p className="text-sm">This file type cannot be previewed</p>
        </div>
      </div>
    );
  }

  const previewType = getPreviewType(file.name);

  // Render preview based on file type
  switch (previewType) {
    case 'image':
      return (
        <div className={`flex items-center justify-center h-full p-4 ${className || ''}`}>
          <div className="border rounded-md overflow-hidden shadow-sm max-w-full max-h-full">
            {/* For a real app, this would be a real image URL or data URL */}
            <img
              src={`data:image/png;base64,${btoa(file.content)}`}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Fallback if the image data is invalid
                (e.currentTarget as any).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlIFByZXZpZXcgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
        </div>
      );

    case 'markdown':
      return (
        <div className={`p-4 overflow-auto ${className || ''}`}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {/* For a real app, this would use a markdown renderer like react-markdown */}
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(file.content) }} />
          </div>
        </div>
      );

    case 'html':
      return (
        <div className={`h-full ${className || ''}`}>
          <iframe
            title={file.name}
            srcDoc={file.content}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      );

    case 'pdf':
      return (
        <div className={`flex items-center justify-center h-full ${className || ''}`}>
          <div className="text-center text-muted-foreground">
            <p>PDF Preview</p>
            <p className="text-sm">PDF preview requires additional plugins</p>
          </div>
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center h-full ${className || ''}`}>
          <div className="text-center text-muted-foreground">
            <p>Preview not available</p>
            <p className="text-sm">This file type cannot be previewed</p>
          </div>
        </div>
      );
  }
}

/**
 * Simple markdown renderer (placeholder for a real markdown library)
 */
function renderMarkdown(content: string): string {
  // This is a very basic placeholder - in a real app, use a proper markdown library
  let html = content
    // Convert headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Convert bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Convert lists
    .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
    // Convert paragraphs
    .replace(/^(?!<[h|p|u|l])(.*$)/gm, '<p>$1</p>');

  // Wrap lists
  html = html.replace(/<li>([\s\S]*?)<\/li>/g, '<ul>$&</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return html;
}
