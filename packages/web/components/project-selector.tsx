"use client";

import { useState, useEffect } from "react";
import { FolderOpen, RefreshCw } from "lucide-react";
import { generateStringHash } from "@/lib/hash-string";
import { directoryManager } from "@/utils/file-system";

interface ProjectSelectorProps {
  onProjectSelect: (projectId: number, projectName: string) => void;
  selectedProject?: { id: number; name: string } | null;
}

export function ProjectSelector({
  onProjectSelect,
  selectedProject,
}: ProjectSelectorProps) {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if the File System Access API is supported
    setIsSupported("showDirectoryPicker" in window);
  }, []);

  const selectProject = async () => {
    try {
      // Show directory picker
      const directoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents", // Optional, starts in the "documents" directory
      });

      const projectName = directoryHandle.name;

      const projectId = parseInt(
        generateStringHash(directoryHandle.name).substring(0, 8),
        16
      );

      // Request read/write permission
      const permissionStatus = await directoryHandle.requestPermission({ mode: "readwrite" });
      
      if (permissionStatus !== "granted") {
        throw new Error("Permission denied for directory access");
      }

      // Store the directory handle for future access
      directoryManager.setDirectoryHandle(projectId, directoryHandle);

      // Update the selected project in the parent component
      onProjectSelect(projectId, projectName);
    } catch (err) {
      console.error("Error selecting directory:", err);
      // Handle errors or user cancellation
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-sm text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 p-2 rounded-md">
        <span>
          Your browser doesn't support file system access. Please use Chrome,
          Edge, or another compatible browser.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {!selectedProject ? (
        <button
          onClick={selectProject}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Select Project</span>
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Project:</span>
          <div
            className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md flex items-center"
            title={`Project ID: ${selectedProject.id}`}
          >
            <span className="mr-2">{selectedProject.name}</span>
            <button
              onClick={selectProject}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-full"
              title="Change project"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
