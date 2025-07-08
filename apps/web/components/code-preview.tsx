"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { FileTree } from "./file-tree";
import { useProject } from "@/contexts/project-context";
import {
  useProjectFiles,
  getFileContent,
  FileSystemEntry,
} from "@/utils/file-system";
import { useFileChanges } from "@/hooks/use-file-changes";
import { trpc } from "@/utils";
import { myLogger } from "@apk/server/src/utils/logger";

export function CodePreview() {
  const { selectedProject } = useProject();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isFileTreeVisible, setIsFileTreeVisible] = useState(true);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<Array<FileSystemEntry>>([]);

  const {
    isLoading: filesLoading,
    error: filesError,
    refresh: refreshFiles,
  } = useProjectFiles(selectedProject?.id);

  // Track file changes
  const { changedFiles, resetChanges } = useFileChanges(files);
  const {
    data,
    error,
    refetch: getProjectContents,
  } = trpc.files.getProjectContents.useQuery({
    projectName: selectedProject?.name,
  });

  useEffect(() => {
    myLogger.info("Received project data", data);
    myLogger.error("Error during getting project files", error?.message);
    if (data) {
      setFiles(data);
    }
  }, [data, error]);

  const { data: fileChanges } = trpc.files.watchFileChanges.useSubscription(
    { projectName: selectedProject?.name || "Project007" },
    {
      onData: (change) => {
        console.log(
          `Change in ${selectedProject && selectedProject.name} project:`,
          change,
        );
      },
    },
  );

  useEffect(() => {
    getProjectContents();
  }, [fileChanges]);

  const {
    data: fileData,
    error: fileError,
    refetch: refetchFile,
    isLoading: fileLoading,
  } = trpc.files.getFileContent.useQuery(
    {
      relativePath: selectedFile,
      projectName: selectedProject?.name || "",
    },
    {
      enabled: !!selectedFile && !!selectedProject?.name,
    },
  );

  useEffect(() => {
    if (fileData !== undefined || fileData !== null) {
      setFileContent(fileData);
    }
  }, [fileData]);

  useEffect(() => {
    myLogger.error(
      fileError?.message || "Something went wrong reading:",
      selectedFile,
    );
  }, [fileError]);

  useEffect(() => {
    setIsLoading(fileLoading);
  }, [fileLoading]);

  useEffect(() => {
    if (selectedFile) {
      refetchFile();
    }
  }, [selectedFile, refetchFile]);

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
  };

  return (
    <div className="flex flex-col h-full rounded-md overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 border-b border-gray-700">
        <div className="text-sm text-gray-300">
          {selectedProject
            ? `Code Explorer: ${selectedProject.name}`
            : "Code Explorer"}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshFiles}
            title="Refresh files"
            className="h-7 text-gray-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFileTreeVisible(!isFileTreeVisible)}
            className="h-7 text-gray-300 hover:text-white"
          >
            {isFileTreeVisible ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {isFileTreeVisible && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300">
            {!selectedProject ? (
              <div className="p-4 text-gray-400 text-sm">
                No project selected. Please select a project to view files.
              </div>
            ) : filesLoading ? (
              <div className="flex items-center justify-center p-4 text-gray-400">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading files...</span>
              </div>
            ) : filesError ? (
              <div className="p-4 text-red-400 text-sm">
                Error loading files: {filesError.message}
              </div>
            ) : !files || files.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm">
                This project appears to be empty.
              </div>
            ) : (
              <FileTree
                files={files}
                changedFiles={changedFiles}
                selectedFile={selectedFile || ""}
                onSelectFile={handleSelectFile}
              />
            )}
          </div>
        )}
        <div className="flex-1 bg-gray-900 text-gray-50 p-4 overflow-auto">
          {!selectedProject ? (
            <div className="text-gray-400">Select a project to view files</div>
          ) : !selectedFile ? (
            <div className="text-gray-400">
              Select a file to view its content
            </div>
          ) : isLoading ? (
            <div className="flex items-center text-gray-400">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Loading file content...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700">
                <span>{selectedFile}</span>
              </div>
              <pre className="font-mono text-sm">
                <code>{fileContent || "Unable to load file content"}</code>
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
