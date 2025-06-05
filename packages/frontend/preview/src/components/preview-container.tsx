import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { usePreview } from '../hooks/use-preview';
import { FileExplorer } from './file-explorer';
import { Editor } from './editor';
import { PreviewPane } from './preview-pane';
import { generateDefaultProjectStructure, isPreviewableFile } from '../utils';
import type { PreviewContainerProps } from '../types';

/**
 * Main preview container component with file explorer, editor, and preview
 */
export function PreviewContainer({
  files: initialFiles,
  folders: initialFolders,
  initialActiveFileId,
  initialMode = 'editor',
  readOnly = false,
  onFileChange,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  className = '',
  showToolbar = true,
  theme = 'light',
}: PreviewContainerProps) {
  // Use default project structure if no files/folders provided
  const defaultStructure = generateDefaultProjectStructure();

  // Initialize preview state
  const {
    files,
    folders,
    activeFileId,
    activeFile,
    mode,
    setActiveFile,
    setMode,
    toggleFolder,
    updateFileContent,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder
  } = usePreview({
    initialFiles: initialFiles || defaultStructure.files,
    initialFolders: initialFolders || defaultStructure.folders,
    initialActiveFileId,
    initialMode
  });

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setActiveFile(fileId);
    if (onFileSelect) {
      onFileSelect(fileId);
    }
  };

  // Handle file content change
  const handleFileContentChange = (content: string) => {
    if (!activeFileId) return;

    updateFileContent(activeFileId, content);

    if (onFileChange && activeFile) {
      onFileChange({
        ...activeFile,
        content
      });
    }
  };

  // Handle new file creation
  const handleCreateFile = async (path: string, name: string) => {
    if (onCreateFile) {
      const newFile = await onCreateFile(path, name);
      if (newFile) {
        setActiveFile(newFile.id);
        return;
      }
    }

    const file = createFile(path, name);
    setActiveFile(file.id);
  };

  // Handle new folder creation
  const handleCreateFolder = async (path: string, name: string) => {
    if (onCreateFolder) {
      await onCreateFolder(path, name);
      return;
    }

    createFolder(path, name);
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    if (onDeleteFile) {
      const success = await onDeleteFile(fileId);
      if (success) {
        deleteFile(fileId);
      }
      return;
    }

    deleteFile(fileId);
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId: string) => {
    if (onDeleteFolder) {
      const success = await onDeleteFolder(folderId);
      if (success) {
        deleteFolder(folderId);
      }
      return;
    }

    deleteFolder(folderId);
  };

  // Default layout with editor only
  if (mode === 'editor') {
    return (
      <div className={`flex h-full border rounded-md overflow-hidden ${className}`}>
        <div className="w-64 h-full border-r overflow-auto bg-muted/20">
          <FileExplorer
            folders={folders}
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleFileSelect}
            onToggleFolder={toggleFolder}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        <div className="flex-1 h-full flex flex-col">
          {showToolbar && (
            <div className="p-2 border-b flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {activeFile ? activeFile.path : 'No file selected'}
              </div>

              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'editor' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('editor')}
                >
                  Editor
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('preview')}
                  disabled={!activeFile || !isPreviewableFile(activeFile.name)}
                >
                  Preview
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('split')}
                  disabled={!activeFile || !isPreviewableFile(activeFile.name)}
                >
                  Split
                </button>
              </div>
            </div>
          )}

          <div className="flex-1">
            <Editor
              file={activeFile}
              readOnly={readOnly}
              onChange={handleFileContentChange}
              theme={theme}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Preview mode only
  if (mode === 'preview') {
    return (
      <div className={`flex h-full border rounded-md overflow-hidden ${className}`}>
        <div className="w-64 h-full border-r overflow-auto bg-muted/20">
          <FileExplorer
            folders={folders}
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleFileSelect}
            onToggleFolder={toggleFolder}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        <div className="flex-1 h-full flex flex-col">
          {showToolbar && (
            <div className="p-2 border-b flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {activeFile ? activeFile.path : 'No file selected'}
              </div>

              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'editor' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('editor')}
                >
                  Editor
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('preview')}
                  disabled={!activeFile || !isPreviewableFile(activeFile.name)}
                >
                  Preview
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded ${mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => setMode('split')}
                  disabled={!activeFile || !isPreviewableFile(activeFile.name)}
                >
                  Split
                </button>
              </div>
            </div>
          )}

          <div className="flex-1">
            <PreviewPane
              file={activeFile}
              className="h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Split mode (editor and preview)
  return (
    <div className={`flex h-full border rounded-md overflow-hidden ${className}`}>
      <div className="w-64 h-full border-r overflow-auto bg-muted/20">
        <FileExplorer
          folders={folders}
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleFileSelect}
          onToggleFolder={toggleFolder}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>

      <div className="flex-1 h-full flex flex-col">
        {showToolbar && (
          <div className="p-2 border-b flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {activeFile ? activeFile.path : 'No file selected'}
            </div>

            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-xs rounded ${mode === 'editor' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setMode('editor')}
              >
                Editor
              </button>
              <button
                className={`px-3 py-1 text-xs rounded ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setMode('preview')}
                disabled={!activeFile || !isPreviewableFile(activeFile.name)}
              >
                Preview
              </button>
              <button
                className={`px-3 py-1 text-xs rounded ${mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setMode('split')}
                disabled={!activeFile || !isPreviewableFile(activeFile.name)}
              >
                Split
              </button>
            </div>
          </div>
        )}

        <div className="flex-1">
          <PanelGroup direction="horizontal">
            <Panel
              // defaultSize={50}
              // minSize={20}
              >
              <Editor
                file={activeFile}
                readOnly={readOnly}
                onChange={handleFileContentChange}
                theme={theme}
                className="h-full"
              />
            </Panel>

            <PanelResizeHandle className="w-1 bg-muted hover:bg-muted-foreground/20 transition-colors" />

            <Panel
              // defaultSize={50}
              // minSize={20}
              >
              <PreviewPane
                file={activeFile}
                className="h-full"
              />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
