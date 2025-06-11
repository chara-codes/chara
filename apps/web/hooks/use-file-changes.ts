"use client";

import { useState, useEffect, useRef } from "react";
import { FileSystemEntry } from "@/utils/file-system";

export type FileChangeType = "add" | "modify" | "delete";

export interface FileChange {
  path: string;
  type: FileChangeType;
}

/**
 * Hook to detect file changes between refreshes
 * @param files Current list of files
 * @param resetAfter Time in ms to automatically reset change status (0 to disable)
 * @returns List of changed files and reset function
 */
export function useFileChanges(
  files: FileSystemEntry[] | null,
  resetAfter: number = 10000
) {
  const [changedFiles, setChangedFiles] = useState<FileChange[]>([]);
  const previousFilesRef = useRef<FileSystemEntry[] | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to reset change indicators
  const resetChanges = () => {
    setChangedFiles([]);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Detect changes whenever files change
  useEffect(() => {
    // Skip initial render
    if (!previousFilesRef.current) {
      previousFilesRef.current = files;
      return;
    }

    // Skip if files are null
    if (!files) {
      previousFilesRef.current = null;
      setChangedFiles([]);
      return;
    }

    const prevFiles = previousFilesRef.current || [];
    const prevFilesMap = new Map<string, FileSystemEntry>();
    
    // Create a map of previous files by path for quick lookups
    prevFiles.forEach(file => {
      prevFilesMap.set(file.path, file);
    });

    const currentFilesMap = new Map<string, FileSystemEntry>();
    const newChanges: FileChange[] = [];
    
    // Find added and modified files
    files.forEach(file => {
      currentFilesMap.set(file.path, file);
      
      if (!prevFilesMap.has(file.path)) {
        // New file
        newChanges.push({ path: file.path, type: "add" });
      }
      // Note: We can't easily detect modifications without comparing content
      // This would require additional implementation
    });
    
    // Find deleted files
    prevFiles.forEach(file => {
      if (!currentFilesMap.has(file.path)) {
        newChanges.push({ path: file.path, type: "delete" });
      }
    });

    // Update changed files list by merging with existing changes
    // (keeping existing changes that haven't been reset yet)
    setChangedFiles(prev => {
      // Create a map of previous changes to preserve timestamps
      const prevChangesMap = new Map<string, FileChange>();
      prev.forEach(change => {
        prevChangesMap.set(change.path, change);
      });
      
      // Add new changes, overriding any existing ones
      newChanges.forEach(change => {
        prevChangesMap.set(change.path, change);
      });
      
      return Array.from(prevChangesMap.values());
    });

    // Update previous files reference
    previousFilesRef.current = files;

    // Set auto-reset timeout if enabled
    if (resetAfter > 0 && newChanges.length > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        resetChanges();
        timeoutRef.current = null;
      }, resetAfter);
    }
  }, [files, resetAfter]);

  return {
    changedFiles,
    resetChanges
  };
}