import React, { useEffect, useRef, useState } from 'react';
import { detectLanguage } from '../utils';
import type { EditorProps } from '../types';

/**
 * Code editor component based on Monaco Editor
 */
export function Editor({
  file,
  readOnly = false,
  onChange,
  theme = 'light',
  className,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);

  // Load Monaco Editor
  useEffect(() => {
    let monaco: any;

    const loadMonaco = async () => {
      try {
        // Dynamic import for Monaco Editor
        const monacoModule = await import('monaco-editor');
        monaco = monacoModule;

        setIsMonacoLoaded(true);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    loadMonaco();

    return () => {
      // Cleanup Monaco instances
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, []);

  // Initialize editor when Monaco is loaded and file changes
  useEffect(() => {
    if (!isMonacoLoaded || !editorRef.current || !file) return;

    // Cleanup previous instance
    if (editorInstance) {
      editorInstance.dispose();
    }

    try {
      // Import monaco from window if available (loaded by previous effect)
      // @ts-ignore
      const monaco = (window as any).monaco;

      if (!monaco) {
        console.error('Monaco editor not loaded');
        return;
      }

      // Set editor theme
      const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs';

      // Create editor instance
      const editor = monaco.editor.create(editorRef.current, {
        value: file.content || '',
        language: detectLanguage(file.name),
        theme: editorTheme,
        readOnly: readOnly,
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        lineNumbers: 'on',
        folding: true,
        wordWrap: 'on',
      });

      // Set editor instance
      setEditorInstance(editor);

      // Handle content changes
      if (!readOnly && onChange) {
        const disposable = editor.onDidChangeModelContent(() => {
          const value = editor.getValue();
          onChange(value);
        });

        return () => {
          disposable.dispose();
        };
      }
    } catch (error) {
      console.error('Error initializing Monaco editor:', error);
    }
  }, [isMonacoLoaded, file, readOnly, onChange, theme]);

  // If no file is selected, show placeholder
  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-center text-muted-foreground">
          <p>No file selected</p>
          <p className="text-sm">Select a file from the explorer to view or edit</p>
        </div>
      </div>
    );
  }

  // If Monaco failed to load, show fallback editor
  if (!isMonacoLoaded) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted p-2 text-xs font-mono border-b">
            {file.name}
          </div>
          <textarea
            className="w-full h-[400px] p-4 font-mono text-sm bg-background resize-none focus:outline-none"
            value={file.content}
            onChange={(e) => onChange?.((e.target as any).value)}
            readOnly={readOnly}
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={`w-full h-full ${className || ''}`}
      data-file-type={file.type}
    />
  );
}
