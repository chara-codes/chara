"use client";

import React from "react";
import { Folder, File, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreviewStore } from "@/store/preview-store";

interface FileItemProps {
  id: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

function FileItem({ id, name, isActive, onClick }: FileItemProps) {
  // Get file extension
  const extension = name.split('.').pop() || '';
  
  return (
    <div
      className={cn(
        "flex items-center px-2 py-1 text-sm cursor-pointer rounded-md",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      <File className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </div>
  );
}

interface FolderItemProps {
  id: string;
  name: string;
  isOpen: boolean;
  children: React.ReactNode;
  onToggle: () => void;
}

function FolderItem({ id, name, isOpen, children, onToggle }: FolderItemProps) {
  return (
    <div className="select-none">
      <div
        className="flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded-md"
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
        )}
        <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="truncate">{name}</span>
      </div>
      
      {isOpen && (
        <div className="ml-4 pl-2 border-l border-border">{children}</div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { files, folders, activeFileId, setActiveFile, toggleFolderOpen } = usePreviewStore();
  
  const handleFileClick = (fileId: string) => {
    setActiveFile(fileId);
  };
  
  const handleFolderToggle = (folderId: string) => {
    toggleFolderOpen(folderId);
  };
  
  return (
    <div className="p-2 overflow-auto h-full">
      <div className="mb-2 px-2 py-1 text-sm font-medium">Files</div>
      
      {/* Root files */}
      {files
        .filter(file => !file.path.includes('/') || file.path.startsWith('/'))
        .map(file => (
          <FileItem
            key={file.id}
            id={file.id}
            name={file.name}
            isActive={file.id === activeFileId}
            onClick={() => handleFileClick(file.id)}
          />
        ))}
      
      {/* Folders */}
      {folders.map(folder => (
        <FolderItem
          key={folder.id}
          id={folder.id}
          name={folder.name}
          isOpen={folder.isOpen}
          onToggle={() => handleFolderToggle(folder.id)}
        >
          {/* Files in this folder */}
          {files
            .filter(file => file.path.startsWith(folder.path + '/'))
            .map(file => (
              <FileItem
                key={file.id}
                id={file.id}
                name={file.name}
                isActive={file.id === activeFileId}
                onClick={() => handleFileClick(file.id)}
              />
            ))}
          
          {/* Nested folders would go here if implemented */}
        </FolderItem>
      ))}
      
      {files.length === 0 && folders.length === 0 && (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
          No files yet. Start a chat to create files.
        </div>
      )}
    </div>
  );
}
