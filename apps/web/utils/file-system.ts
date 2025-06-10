"use client";

import { useState, useEffect } from "react";

// Type for file/folder entry from directory reading
export interface FileSystemEntry {
  path: string;
  type: "file" | "folder";
  name: string; // Just the filename/foldername without the path
  handle?: FileSystemHandle; // Optional handle reference for future operations
}

// Global storage for directory handles to maintain permission
type ProjectHandleStore = {
  [projectId: string]: FileSystemDirectoryHandle;
};

// Singleton to store directory handles across the application
class DirectoryHandleManager {
  private static instance: DirectoryHandleManager;
  private handleStore: ProjectHandleStore = {};

  private constructor() {}

  public static getInstance(): DirectoryHandleManager {
    if (!DirectoryHandleManager.instance) {
      DirectoryHandleManager.instance = new DirectoryHandleManager();
    }
    return DirectoryHandleManager.instance;
  }

  public setDirectoryHandle(projectId: string, handle: FileSystemDirectoryHandle): void {
    this.handleStore[projectId] = handle;
  }

  public getDirectoryHandle(projectId: string): FileSystemDirectoryHandle | undefined {
    return this.handleStore[projectId];
  }

  public hasDirectoryHandle(projectId: string): boolean {
    return !!this.handleStore[projectId];
  }

  public removeDirectoryHandle(projectId: string): void {
    delete this.handleStore[projectId];
  }
}

export const directoryManager = DirectoryHandleManager.getInstance();

/**
 * Gets the file system entries for a project directory
 * @param projectId The ID of the project
 * @returns Array of file system entries or null if no directory handle is available
 */
export async function getProjectFiles(projectId: string): Promise<FileSystemEntry[] | null> {
  const directoryHandle = directoryManager.getDirectoryHandle(projectId);
  
  if (!directoryHandle) {
    return null;
  }

  try {
    return await readDirectoryRecursive(directoryHandle);
  } catch (error) {
    console.error("Error reading project files:", error);
    return null;
  }
}

/**
 * Recursively reads the contents of a directory
 * @param directoryHandle Directory handle to read
 * @param basePath Base path for constructing relative paths
 * @returns Array of file system entries
 */
async function readDirectoryRecursive(
  directoryHandle: FileSystemDirectoryHandle,
  basePath: string = ""
): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];
  
  for await (const entry of directoryHandle.values()) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.kind === "file") {
      entries.push({
        path: entryPath,
        type: "file",
        name: entry.name,
        handle: entry,
      });
    } else if (entry.kind === "directory") {
      // Add the directory itself
      entries.push({
        path: entryPath,
        type: "folder",
        name: entry.name,
        handle: entry,
      });
      
      // Recursively get contents
      const childEntries = await readDirectoryRecursive(entry, entryPath);
      entries.push(...childEntries);
    }
  }
  
  return entries;
}

/**
 * Reads the content of a file from a project
 * @param projectId The ID of the project
 * @param filePath The path to the file within the project
 * @returns File content as string or null if unable to read
 */
export async function getFileContent(
  projectId: string,
  filePath: string
): Promise<string | null> {
  const directoryHandle = directoryManager.getDirectoryHandle(projectId);
  
  if (!directoryHandle) {
    return null;
  }
  
  try {
    // Split the path into parts to navigate the file system
    const pathParts = filePath.split("/");
    const fileName = pathParts.pop();
    
    if (!fileName) {
      throw new Error("Invalid file path");
    }
    
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;
    
    // Navigate to the directory containing the file
    for (const part of pathParts) {
      if (!part) continue; // Skip empty parts
      currentHandle = await currentHandle.getDirectoryHandle(part);
    }
    
    // Get the file
    const fileHandle = await currentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Hook to observe file system changes for a project
 * @param projectId The ID of the project
 * @param interval Polling interval in milliseconds
 * @returns Files array and a function to manually refresh
 */
export function useProjectFiles(
  projectId: string | undefined | null,
  interval: number = 5000
): {
  files: FileSystemEntry[] | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [files, setFiles] = useState<FileSystemEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchFiles = async () => {
    if (!projectId) {
      setFiles(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const projectFiles = await getProjectFiles(projectId);
      setFiles(projectFiles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load and interval refresh
  useEffect(() => {
    fetchFiles();
    
    // Set up polling interval
    const timer = setInterval(() => {
      fetchFiles();
    }, interval);
    
    return () => clearInterval(timer);
  }, [projectId, interval]);
  
  return { files, isLoading, error, refresh: fetchFiles };
}