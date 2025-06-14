"use client";

import { TechStackDetail } from "../types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type ReactNode, useEffect } from "react";
import { StackType } from "@chara/server";
import { trpc } from "../services";

// Define the tech stacks state interface
interface TechStacksState {
  // All tech stacks
  techStacks: TechStackDetail[];

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setTechStacks: (stacks: TechStackDetail[]) => void;
  setLoading: (isLoading: boolean) => void;
  addTechStack: (techStack: TechStackDetail) => void;
  updateTechStack: (techStack: TechStackDetail) => void;
  deleteTechStack: (id: string) => void;
  getTechStackById: (id: string) => TechStackDetail | undefined;
}

export const useTechStacksStore = create<TechStacksState>()(
  devtools(
    (set, get) => ({
      // Initial state
      techStacks: [],
      isLoading: false,
      error: null,

      // Set tech stacks from external source
      setTechStacks: (techStacks: TechStackDetail[]) => {
        set({ techStacks });
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // Add a new tech stack
      addTechStack: (techStack: TechStackDetail) => {
        set((state) => ({
          techStacks: [...state.techStacks, techStack],
        }));
      },

      // Update an existing tech stack
      updateTechStack: (techStack: TechStackDetail) => {
        set((state) => ({
          techStacks: state.techStacks.map((stack) =>
            stack.id === techStack.id ? techStack : stack,
          ),
        }));
      },

      // Delete a tech stack
      deleteTechStack: (id: string) => {
        set((state) => ({
          techStacks: state.techStacks.filter((stack) => stack.id !== id),
        }));
      },

      // Get a tech stack by ID
      getTechStackById: (id: string) => {
        return get().techStacks.find((stack) => stack.id === id);
      },
    }),
    {
      name: "tech-stacks-store",
    },
  ),
);

// Selector hooks for common use cases
export const useTechStacks = () =>
  useTechStacksStore((state) => state.techStacks);
export const useAddTechStack = () =>
  useTechStacksStore((state) => state.addTechStack);
export const useUpdateTechStack = () =>
  useTechStacksStore((state) => state.updateTechStack);
export const useDeleteTechStack = () =>
  useTechStacksStore((state) => state.deleteTechStack);
export const useGetTechStackById = () =>
  useTechStacksStore((state) => state.getTechStackById);
export const useTechStacksLoading = () =>
  useTechStacksStore((state) => state.isLoading);

/**
 * TechStacksProvider component
 *
 * Wrap your application with this component to provide tech stacks data loading
 * via trpc. This is meant to be a replacement for the StacksProvider from StacksContext.
 */
export function TechStacksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the data loading hook to fetch tech stacks when the component mounts
  useTechStacksData();

  return <>{children}</>;
}

// LEGACY, for testing purposes
export interface Technology {
  name: string;
  docsUrl?: string;
  codeUrl?: string;
}

export interface TechStack {
  id: string;
  name: string;
  type: StackType;
  description: string;
  technologies: Technology[];
  icon?: ReactNode;
}

export const serverToClient = (row: {
  id: number;
  title: string;
  description: string | null;
  technologies: Technology[];
  type: StackType;
}): TechStack => ({
  id: String(row.id),
  name: row.title,
  description: row.description ?? "",
  type: row.type,
  technologies: row.technologies,
});

/**
 * This hook loads tech stacks from the trpc API and updates the Zustand store
 * It handles the mapping from server format to TechStackDetail format, including mocking of missing fields
 */
export function useTechStacksData() {
  const setTechStacks = useTechStacksStore((state) => state.setTechStacks);
  const setLoading = useTechStacksStore((state) => state.setLoading);

  const { data: serverStacks = [], isFetching } = trpc.stacks.list.useQuery(
    undefined,
    {
      select: (rows) => rows.map(serverToClient),
      initialData: [],
    },
  );

  useEffect(() => {
    setLoading(isFetching);
  }, [isFetching]);

  useEffect(() => {
    const res = serverStacks.map((stack) => {
      return mapServerStackToDetail(stack);
    });

    setTechStacks(res);
    setLoading(false);
  }, [serverStacks]);
}

/**
 * Helper function to map server stack format to TechStackDetail
 */
function mapServerStackToDetail(serverStack: any): TechStackDetail {
  // Extract basic fields that exist in both formats
  const { id, name, description } = serverStack;

  // Map type to category (field name change)
  const category = serverStack.type || "Other";

  // Create TechStackDetail with required fields and mock the missing ones
  return {
    id,
    name,
    category,
    description,
    // Mock additional fields required by TechStackDetail
    icon: getIconForCategory(category),
    popularity: Math.floor(Math.random() * 10) + 1, // Random popularity 1-10
    version: "1.0.0", // Default version
    // Add other optional fields as needed
    documentationLinks: [],
    mcpServers: [],
  };
}

/**
 * Helper function to choose an appropriate icon based on category
 */
function getIconForCategory(
  category: string,
): "code" | "server" | "database" | "layers" | "globe" {
  switch (category.toLowerCase()) {
    case "frontend":
      return "code";
    case "backend":
      return "server";
    case "database":
      return "database";
    case "full stack":
      return "layers";
    case "api":
      return "globe";
    default:
      return "code";
  }
}
