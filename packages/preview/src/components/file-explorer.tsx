import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  FileText,
  Code,
  FileJson,
  Image,
  FileCode
} from 'lucide-react';
import { getFileExtension } from '../utils';
import type { FileExplorerProps } from '../types';
import { PreviewFile, PreviewFolder } from '@frontend/core/src';

/**
 * Component to render file and folder tree
 */
export function FileExplorer({
  folders,
  files,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  className,
}: FileExplorerProps) {
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number, path: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null);
  const [newItemPath, setNewItemPath] = useState('');

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY,
      path
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenuPos(null);
  };

  // Start creating a new file
  const startCreateFile = (path: string) => {
    setNewItemType('file');
    setNewItemPath(path);
    setNewItemName('');
    closeContextMenu();
  };

  // Start creating a new folder
  const startCreateFolder = (path: string) => {
    setNewItemType('folder');
    setNewItemPath(path);
    setNewItemName('');
    closeContextMenu();
  };

  // Handle new item creation
  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    if (newItemType === 'file') {
      onCreateFile?.(newItemPath, newItemName);
    } else if (newItemType === 'folder') {
      onCreateFolder?.(newItemPath, newItemName);
    }

    setNewItemType(null);
    setNewItemName('');
  };

  // Handle item delete confirmation
  const handleDeleteItem = (itemId: string, isFolder: boolean) => {
    if (confirm(`Are you sure you want to delete this ${isFolder ? 'folder' : 'file'}?`)) {
      if (isFolder) {
        onDeleteFolder?.(itemId);
      } else {
        onDeleteFile?.(itemId);
      }
    }
  };

  // Get icon for file based on extension
  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename).toLowerCase();

    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-amber-500" />;
      case 'html':
      case 'xml':
      case 'svg':
        return <FileCode className="h-4 w-4 text-orange-500" />;
      case 'css':
      case 'scss':
      case 'less':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'md':
      case 'markdown':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return <Image className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Recursively render folder structure
  const renderFolderStructure = (items: (PreviewFile | PreviewFolder)[], indent = 0) => {
    return items.map(item => {
      // Handle folder
      if ('children' in item) {
        return (
          <div key={item.id}>
            <div
              className="flex items-center py-1 hover:bg-muted/50 cursor-pointer group"
              style={{ paddingLeft: `${indent * 12}px` }}
              onClick={() => onToggleFolder(item.id)}
              onContextMenu={(e) => handleContextMenu(e, item.path)}
            >
              <button
                className="mr-1 p-1 rounded-sm hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFolder(item.id);
                }}
              >
                {item.isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>

              {item.isOpen ? (
                <FolderOpen className="h-4 w-4 text-amber-500 mr-1" />
              ) : (
                <Folder className="h-4 w-4 text-amber-500 mr-1" />
              )}

              <span className="text-sm">{item.name}</span>

              {onDeleteFolder && (
                <button
                  className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id, true);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {item.isOpen && renderFolderStructure(item.children, indent + 1)}

            {/* New file/folder input */}
            {newItemType && newItemPath === item.path && item.isOpen && (
              <div
                className="flex items-center py-1"
                style={{ paddingLeft: `${(indent + 1) * 12}px` }}
              >
                {newItemType === 'file' ? (
                  <File className="h-4 w-4 mr-1" />
                ) : (
                  <Folder className="h-4 w-4 mr-1" />
                )}

                <input
                  type="text"
                  className="text-sm bg-transparent border-b border-primary px-1 py-0 focus:outline-none"
                  value={newItemName}
                  onChange={(e) => setNewItemName((e.target as any).value)}
                  placeholder={`New ${newItemType}...`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateItem();
                    } else if (e.key === 'Escape') {
                      setNewItemType(null);
                    }
                  }}
                  onBlur={() => setNewItemType(null)}
                />
              </div>
            )}
          </div>
        );
      }

      // Handle file
      return (
        <div
          key={item.id}
          className={`
            flex items-center py-1 hover:bg-muted/50 cursor-pointer group
            ${activeFileId === item.id ? 'bg-primary/10 text-primary' : ''}
          `}
          style={{ paddingLeft: `${indent * 12 + 20}px` }}
          onClick={() => onSelectFile(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.path)}
        >
          {getFileIcon(item.name)}
          <span className="text-sm ml-1">{item.name}</span>

          {onDeleteFile && (
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(item.id, false);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`h-full relative ${className || ''}`} onClick={closeContextMenu}>
      {/* Root actions for creating new files/folders */}
      {(onCreateFile || onCreateFolder) && (
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Explorer</span>

          <div className="flex">
            {onCreateFile && (
              <button
                className="p-1 rounded-sm hover:bg-muted"
                onClick={() => startCreateFile('/')}
                title="New File"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* File tree */}
      <div className="p-2 overflow-auto">
        {folders.length > 0 ? (
          folders.map(folder => {
            if (folder.id === 'root') {
              return renderFolderStructure(folder.children);
            }
            return null;
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center p-4">
            No files found
          </div>
        )}

        {/* Root-level new file/folder input */}
        {newItemType && newItemPath === '/' && (
          <div className="flex items-center py-1 pl-2">
            {newItemType === 'file' ? (
              <File className="h-4 w-4 mr-1" />
            ) : (
              <Folder className="h-4 w-4 mr-1" />
            )}

            <input
              type="text"
              className="text-sm bg-transparent border-b border-primary px-1 py-0 focus:outline-none"
              value={newItemName}
              onChange={(e) => setNewItemName((e.target as any).value)}
              placeholder={`New ${newItemType}...`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateItem();
                } else if (e.key === 'Escape') {
                  setNewItemType(null);
                }
              }}
              onBlur={() => setNewItemType(null)}
            />
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenuPos && (
        <div
          className="absolute bg-popover text-popover-foreground shadow-md border rounded-md py-1 min-w-[160px] z-50"
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onCreateFile && (
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => startCreateFile(contextMenuPos.path)}
            >
              New File
            </button>
          )}

          {onCreateFolder && (
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => startCreateFolder(contextMenuPos.path)}
            >
              New Folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}
