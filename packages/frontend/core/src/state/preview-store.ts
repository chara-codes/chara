"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { PreviewFile, PreviewFolder, PreviewMode, PreviewState } from "../types";

interface PreviewStoreState extends PreviewState {
  mode: PreviewMode;
  
  // Actions
  setActiveFile: (fileId: string | null) => void;
  addFile: (file: Omit<PreviewFile, "id" | "isActive">) => void;
  updateFile: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => void;
  toggleFolder: (folderId: string) => void;
  setMode: (mode: PreviewMode) => void;
  createFolder: (path: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveFile: (fileId: string, targetFolderId: string) => void;
}

export const usePreviewStore = create<PreviewStoreState>()(
  devtools(
    persist(
      (set) => ({
        files: [],
        folders: [],
        activeFileId: null,
        mode: "split" as PreviewMode,

        setActiveFile: (fileId) => {
          set((state) => ({
            activeFileId: fileId,
            files: state.files.map((file) => ({
              ...file,
              isActive: file.id === fileId,
            })),
          }));
        },

        addFile: (file) => {
          const newFile: PreviewFile = {
            id: Date.now().toString(),
            isActive: false,
            ...file,
          };
          set((state) => ({
            files: [...state.files, newFile],
          }));
        },

        updateFile: (fileId, content) => {
          set((state) => ({
            files: state.files.map((file) =>
              file.id === fileId ? { ...file, content } : file
            ),
          }));
        },

        deleteFile: (fileId) => {
          set((state) => ({
            files: state.files.filter((file) => file.id !== fileId),
            activeFileId:
              state.activeFileId === fileId ? null : state.activeFileId,
          }));
        },

        toggleFolder: (folderId) => {
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === folderId
                ? { ...folder, isOpen: !folder.isOpen }
                : folder
            ),
          }));
        },

        setMode: (mode) => set({ mode }),

        createFolder: (path, name) => {
          const newFolder: PreviewFolder = {
            id: Date.now().toString(),
            name,
            path,
            children: [],
            isOpen: true,
          };
          set((state) => ({
            folders: [...state.folders, newFolder],
          }));
        },

        deleteFolder: (folderId) => {
          set((state) => {
            // Find the folder to delete
            const folderToDelete = state.folders.find(
              (folder) => folder.id === folderId
            );
            if (!folderToDelete) return {};

            // Get the path of the folder to delete
            const folderPath = folderToDelete.path + "/" + folderToDelete.name;

            // Filter out the folder and any files within it
            const updatedFolders = state.folders.filter(
              (folder) => folder.id !== folderId && !folder.path.startsWith(folderPath)
            );
            const updatedFiles = state.files.filter(
              (file) => !file.path.startsWith(folderPath)
            );

            // If the active file is within the deleted folder, reset activeFileId
            const shouldResetActiveFile = state.files.some(
              (file) =>
                file.id === state.activeFileId && file.path.startsWith(folderPath)
            );

            return {
              folders: updatedFolders,
              files: updatedFiles,
              activeFileId: shouldResetActiveFile ? null : state.activeFileId,
            };
          });
        },

        moveFile: (fileId, targetFolderId) => {
          set((state) => {
            // Find the target folder
            const targetFolder = state.folders.find(
              (folder) => folder.id === targetFolderId
            );
            if (!targetFolder) return {};

            // Update the file's path
            const updatedFiles = state.files.map((file) => {
              if (file.id === fileId) {
                return {
                  ...file,
                  path: targetFolder.path + "/" + targetFolder.name,
                };
              }
              return file;
            });

            return { files: updatedFiles };
          });
        },
      }),
      {
        name: "preview-storage-v1",
        partialize: (state) => ({
          files: state.files,
          folders: state.folders,
          mode: state.mode,
        }),
      }
    )
  )
);
