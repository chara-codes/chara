"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface ProjectInformation {
  id: string;
  name: string;
}

interface ProjectContextType {
  selectedProject: ProjectInformation | null;
  setSelectedProject: (project: ProjectInformation | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    name: string;
  } | null>(() => {
    // Try to load from localStorage on initial render (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedProject");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const handleSetSelectedProject = (
    project: { id: string; name: string } | null,
  ) => {
    setSelectedProject(project);

    if (project) {
      localStorage.setItem("selectedProject", JSON.stringify(project));
    } else {
      localStorage.removeItem("selectedProject");
    }
  };

  return (
    <ProjectContext.Provider
      value={{ selectedProject, setSelectedProject: handleSetSelectedProject }}
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
