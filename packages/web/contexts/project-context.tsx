"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

export interface ProjectInformation {
  id: string;
  name: string;
  path?: string;
}

export interface FileInfo {
  path: string;
  type: "file" | "folder";
  content?: string;
}

export interface FileChange {
  path: string;
  type: "add" | "modify" | "delete";
  content?: string;
  isDirectory: boolean;
  timestamp: number;
}

interface ProjectContextType {
  selectedProject: ProjectInformation | null;
  setSelectedProject: (project: ProjectInformation | null) => void;
  files: FileInfo[];
  changedFiles: Array<{ path: string; type: "add" | "modify" | "delete" }>;
  selectedFile: string | null;
  selectFile: (path: string) => void;
  refreshFiles: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<ProjectInformation | null>(() => {
    // Try to load from localStorage on initial render (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedProject");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [changedFiles, setChangedFiles] = useState<Array<{ path: string; type: "add" | "modify" | "delete" }>>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [trpcClient, setTrpcClient] = useState<any>(null);

  // Initialize tRPC websocket client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wsClient = createWSClient({
      url: "ws://localhost:3030/events",
    });

    const client = createTRPCProxyClient<AppRouter>({
      links: [
        wsLink({
          client: wsClient,
          transformer: superjson
        }),
      ],
    });

    setTrpcClient(client);

    return () => {
      wsClient.close();
    };
  }, []);

  // Subscribe to file changes
  useEffect(() => {
    if (!trpcClient || !selectedProject) return;

    const subscription = trpcClient.events.subscribe(undefined, {
      onData(data: any) {
        if (data.type === "file_change") {
          handleFileChange(data.data);
        } else if (data.type === "project_structure") {
          handleProjectStructure(data.data);
        }
      },
      onError(err: any) {
        console.error("Subscription error", err);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [trpcClient, selectedProject]);

  const handleFileChange = (change: FileChange) => {
    if (change.isDirectory) {
      // Handle directory changes
      if (change.type === "add" || change.type === "modify") {
        setFiles(prevFiles => {
          const folderExists = prevFiles.some(f => f.path === change.path && f.type === "folder");
          if (folderExists) return prevFiles;
          return [...prevFiles, { path: change.path, type: "folder" }];
        });
      } else if (change.type === "delete") {
        setFiles(prevFiles => prevFiles.filter(f => !f.path.startsWith(change.path)));
      }
    } else {
      // Handle file changes
      if (change.type === "add" || change.type === "modify") {
        setFiles(prevFiles => {
          const fileIndex = prevFiles.findIndex(f => f.path === change.path);
          if (fileIndex >= 0) {
            const newFiles = [...prevFiles];
            newFiles[fileIndex] = { 
              path: change.path, 
              type: "file",
              content: change.content 
            };
            return newFiles;
          }
          return [...prevFiles, { 
            path: change.path, 
            type: "file",
            content: change.content 
          }];
        });
      } else if (change.type === "delete") {
        setFiles(prevFiles => prevFiles.filter(f => f.path !== change.path));
      }

      // Track file change for highlighting
      setChangedFiles(prev => {
        const existingChange = prev.findIndex(c => c.path === change.path);
        if (existingChange >= 0) {
          const newChanges = [...prev];
          newChanges[existingChange] = { path: change.path, type: change.type };
          return newChanges;
        }
        return [...prev, { path: change.path, type: change.type }];
      });
    }
  };

  const handleProjectStructure = (structure: FileChange[]) => {
    // Clear existing files and changes
    setFiles([]);
    setChangedFiles([]);
    
    // Process the new structure
    const newFiles: FileInfo[] = [];
    
    // First, add all directories
    structure
      .filter(item => item.isDirectory)
      .forEach(dir => {
        newFiles.push({ path: dir.path, type: "folder" });
      });
    
    // Then add all files
    structure
      .filter(item => !item.isDirectory)
      .forEach(file => {
        newFiles.push({ 
          path: file.path, 
          type: "file",
          content: file.content 
        });
      });
    
    setFiles(newFiles);
  };

  const handleSetSelectedProject = (
    project: ProjectInformation | null,
  ) => {
    setSelectedProject(project);
    setFiles([]);
    setChangedFiles([]);
    setSelectedFile(null);

    if (project) {
      localStorage.setItem("selectedProject", JSON.stringify(project));
    } else {
      localStorage.removeItem("selectedProject");
    }
  };

  const selectFile = (path: string) => {
    setSelectedFile(path);
  };

  const refreshFiles = () => {
    // This would trigger a request to refresh all files from the server
    console.log("Refreshing files for project", selectedProject?.id);
  };

  return (
    <ProjectContext.Provider
      value={{ 
        selectedProject, 
        setSelectedProject: handleSetSelectedProject,
        files,
        changedFiles,
        selectedFile,
        selectFile,
        refreshFiles
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
