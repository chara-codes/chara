"use client";

import { TechStackDetail } from "../types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
import { trpc } from "../services";
import type { StackDTO } from "@chara/server";

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
      select: (rows) => rows,
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
function mapServerStackToDetail(serverStack: StackDTO): TechStackDetail {
  const {
    id,
    title,
    type,
    shortDescription,
    longDescription,
    icon,
    isNew,
    popularity,
    links,
    mcps,
  } = serverStack;

  return {
    id: id.toString(),
    name: title,
    category: type,
    description: shortDescription ?? "",
    longDescription: longDescription ?? undefined,
    icon,
    isNew: isNew ?? false,
    popularity: popularity ?? 0,
    documentationLinks: links.map((link: any) => ({
      name: link.title,
      url: link.url,
      description: link.description ?? undefined,
    })),
    mcpServers:
      mcps?.map((mcp: any) => ({
        name: mcp.name,
        configuration: {
          command: mcp.serverConfig.command,
          args: mcp.serverConfig.args ?? [],
          env: mcp.serverConfig.env ?? {},
        },
      })) ?? [],
  };
}
