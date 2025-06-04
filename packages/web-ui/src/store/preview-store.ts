"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PreviewFile, PreviewFolder } from "@frontend/core";

interface PreviewState {
  // Data
  files: PreviewFile[];
  folders: PreviewFolder[];
  activeFileId: string | null;
  
  // UI state
  isInitialized: boolean;
  
  // Computed properties
  activeFile: PreviewFile | null;
  
  // Actions
  initialize: () => void;
  setFiles: (files: PreviewFile[]) => void;
  setFolders: (folders: PreviewFolder[]) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  applyFileDiffs: (diffs: any[]) => void; // TODO: Define proper diff type
  toggleFolderOpen: (folderId: string) => void;
  reset: () => void;
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => ({
      // Initial state
      files: [],
      folders: [],
      activeFileId: null,
      isInitialized: false,
      
      // Computed property getter
      get activeFile() {
        const { files, activeFileId } = get();
        return files.find(file => file.id === activeFileId) || null;
      },
      
      // Actions
      initialize: () => {
        if (get().isInitialized) return;
        
        // Create default file structure if empty
        if (get().files.length === 0) {
          const defaultFiles: PreviewFile[] = [
            {
              id: "file-1",
              name: "README.md",
              content: "# AI Chat & Preview\n\nThis application combines AI chat with code preview capabilities.\n\n## Features\n\n- Interactive chat with AI assistant\n- Real-time code preview\n- File explorer\n- Split view modes\n",
              type: "md",
              path: "/README.md",
              isActive: true
            },
            {
              id: "file-2",
              name: "example.js",
              content: "// Example JavaScript file\n\nfunction helloWorld() {\n  console.log(\"Hello, world!\");\n  return \"Hello, world!\";\n}\n\n// Export the function\nmodule.exports = {\n  helloWorld\n};\n",
              type: "js",
              path: "/example.js",
              isActive: false
            }
          ];
          
          const defaultFolders: PreviewFolder[] = [
            {
              id: "folder-1",
              name: "src",
              path: "/src",
              children: [],
              isOpen: true
            }
          ];
          
          set({
            files: defaultFiles,
            folders: defaultFolders,
            activeFileId: "file-1",
            isInitialized: true
          });
        } else {
          set({ isInitialized: true });
        }
      },
      
      setFiles: (files) => set({ files }),
      
      setFolders: (folders) => set({ folders }),
      
      setActiveFile: (fileId) => {
        set((state) => ({
          activeFileId: fileId,
          files: state.files.map(file => ({
            ...file,
            isActive: file.id === fileId
          }))
        }));
      },
      
      updateFileContent: (fileId, content) => {
        set((state) => ({
          files: state.files.map(file => 
            file.id === fileId ? { ...file, content } : file
          )
        }));
      },
      
      applyFileDiffs: (diffs) => {
        // Only process valid diffs
        const validDiffs = diffs.filter(diff => 
          diff.status === "kept" || diff.status === "pending"
        );
        
        set((state) => {
          const updatedFiles = [...state.files];
          
          for (const diff of validDiffs) {
            // Find existing file or create a new one
            const existingFileIndex = updatedFiles.findIndex(
              file => file.path === diff.filePath
            );
            
            if (existingFileIndex >= 0) {
              // Update existing file
              updatedFiles[existingFileIndex] = {
                ...updatedFiles[existingFileIndex],
                content: diff.afterContent
              };
            } else {
              // Create new file
              const fileExtension = diff.fileName.split(".").pop() || "";
              const newFile: PreviewFile = {
                id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: diff.fileName,
                content: diff.afterContent,
                type: fileExtension,
                path: diff.filePath,
                isActive: false
              };
              updatedFiles.push(newFile);
            }
          }
          
          return { files: updatedFiles };
        });
      },
      
      toggleFolderOpen: (folderId) => {
        set((state) => ({
          folders: state.folders.map(folder => 
            folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder
          )
        }));
      },
      
      reset: () => {
        set({
          files: [],
          folders: [],
          activeFileId: null,
          isInitialized: false
        });
      }
    }),
    {
      name: "chat-preview-files-storage",
      partialize: (state) => ({
        files: state.files,
        folders: state.folders,
        activeFileId: state.activeFileId
      })
    }
  )
);
