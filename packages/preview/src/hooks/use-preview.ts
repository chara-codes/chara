import { useState, useCallback, useMemo } from 'react';
import type {
  UsePreviewOptions,
  UsePreviewResult
} from '../types';
import { PreviewFile, PreviewFolder, PreviewMode } from '@frontend/core/src';

/**
 * Hook for managing file preview state
 */
export function usePreview({
  initialFiles = [],
  initialFolders = [],
  initialActiveFileId = null,
  initialMode = 'editor'
}: UsePreviewOptions = {}): UsePreviewResult {
  // State for files, folders, active file, and mode
  const [files, setFiles] = useState<PreviewFile[]>(initialFiles);
  const [folders, setFolders] = useState<PreviewFolder[]>(initialFolders);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialActiveFileId);
  const [mode, setMode] = useState<PreviewMode>(initialMode);

  // Get the currently active file
  const activeFile = useMemo(() => {
    if (!activeFileId) return null;
    return files.find(file => file.id === activeFileId) || null;
  }, [files, activeFileId]);

  // Set active file by ID
  const setActiveFile = useCallback((fileId: string) => {
    // Update previous active file
    setFiles(prevFiles =>
      prevFiles.map(file => ({
        ...file,
        isActive: file.id === fileId
      }))
    );
    setActiveFileId(fileId);
  }, []);

  // Toggle folder open/closed state
  const toggleFolder = useCallback((folderId: string) => {
    setFolders(prevFolders =>
      prevFolders.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, isOpen: !folder.isOpen };
        }
        return folder;
      })
    );
  }, []);

  // Update a file's content
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file => {
        if (file.id === fileId) {
          return { ...file, content };
        }
        return file;
      })
    );
  }, []);

  // Create a new file
  const createFile = useCallback((path: string, name: string, content: string = '') => {
    const newFile: PreviewFile = {
      id: `file-${Date.now()}`,
      name,
      content,
      type: name.split('.').pop() || 'txt',
      path: `${path}/${name}`.replace(/\/+/g, '/'),
      isActive: false
    };

    setFiles(prevFiles => [...prevFiles, newFile]);
    return newFile;
  }, []);

  // Create a new folder
  const createFolder = useCallback((path: string, name: string) => {
    const newFolder: PreviewFolder = {
      id: `folder-${Date.now()}`,
      name,
      children: [],
      path: `${path}/${name}`.replace(/\/+/g, '/'),
      isOpen: true
    };

    setFolders(prevFolders => [...prevFolders, newFolder]);
    return newFolder;
  }, []);

  // Delete a file
  const deleteFile = useCallback((fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

    // If the deleted file was active, clear active file
    if (activeFileId === fileId) {
      setActiveFileId(null);
    }
  }, [activeFileId]);

  // Delete a folder
  const deleteFolder = useCallback((folderId: string) => {
    const folderToDelete = folders.find(folder => folder.id === folderId);

    if (!folderToDelete) return;

    // Delete folder and all files inside it
    setFolders(prevFolders => prevFolders.filter(folder => folder.id !== folderId));

    // Delete all files with paths starting with the folder path
    const folderPath = folderToDelete.path;
    setFiles(prevFiles =>
      prevFiles.filter(file => !file.path.startsWith(folderPath))
    );
  }, [folders]);

  return {
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
  };
}
