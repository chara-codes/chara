"use client";

import { TechStackDetail } from "../types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
import { trpc } from "../services";
import type { StackDTO } from "@chara/server";
import { toast } from "../components";

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
export const useAddTechStackStore = () =>
  useTechStacksStore((state) => state.addTechStack);
export const useUpdateTechStackStore = () =>
  useTechStacksStore((state) => state.updateTechStack);
export const useDeleteTechStack = () =>
  useTechStacksStore((state) => state.deleteTechStack);
export const useGetTechStackById = () =>
  useTechStacksStore((state) => state.getTechStackById);
export const useTechStacksLoading = () =>
  useTechStacksStore((state) => state.isLoading);

/**
 * Hook for deleting a tech stack
 * Calls the server API and updates the store on success
 */
export function useDeleteTechStackMutation() {
  const deleteTechStack = useDeleteTechStack();
  const mutation = trpc.stacks.remove.useMutation({
    onSuccess: (data) => {
      deleteTechStack(data.id.toString());
      toast({ title: "Stack deleted", description: "" });
    },
  });

  const deleteStack = (id: string) => {
    mutation.mutate(Number(id));
  };

  return {
    deleteStack,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useDuplicateTechStackMutation() {
  const addTechStack = useAddTechStackStore();
  const mutation = trpc.stacks.duplicate.useMutation({
    onSuccess: (data) => {
      addTechStack(mapServerStackToDetail(data));
      toast({ title: "Stack duplicated", description: "" });
    },
  });

  const duplicateStack = (id: string) => {
    mutation.mutate(parseInt(id, 10));
  };

  return {
    duplicateStack,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function TechStacksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the data loading hook to fetch tech stacks when the component mounts
  useTechStacksData();

  return <>{children}</>;
}

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

export function useCreateTechStack() {
  const addTechStack = useAddTechStackStore();
  const utils = trpc.useUtils();
  const invalidateList = () => utils.stacks.list.invalidate();

  const mutation = trpc.stacks.create.useMutation({
    onSuccess: (row) => {
      addTechStack(mapServerStackToDetail(row));
      toast({ title: "Stack created", description: row.title });
      invalidateList();
    },
    onError: (err) => {
      toast({ title: "Failed to create stack", description: err.message });
    },
  });

  return {
    createStack: (s: Omit<TechStackDetail, "id">) => {
      mutation.mutate(detailToCreateInput(s));
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateTechStack() {
  const updateTechStack = useUpdateTechStackStore();
  const utils = trpc.useUtils();
  const invalidateList = () => utils.stacks.list.invalidate();

  const mutation = trpc.stacks.update.useMutation({
    onSuccess: (row) => {
      updateTechStack(mapServerStackToDetail(row));
      toast({ title: "Stack updated", description: row.title });
      invalidateList();
    },
    onError: (err) => {
      toast({ title: "Failed to update stack", description: err.message });
    },
  });

  return {
    updateStack: (s: TechStackDetail) =>
      mutation.mutate(detailToUpdateInput(s)),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

function detailToUpdateInput(s: TechStackDetail): any {
  return {
    id: Number(s.id),
    ...detailToCreateInput(s),
  };
}

function categoryToServerEnum(category: string): string {
  switch (category) {
    case "Frontend":
      return "frontend";
    case "Backend":
      return "backend";
    case "Database":
      return "database";
    case "Full Stack":
      return "fullstack";
    case "API":
      return "api";
    case "DevOps":
      return "devops";
    case "Mobile":
      return "mobile";
    case "Other":
      return "others";
    default:
      return "others";
  }
}

function detailToCreateInput(s: Omit<TechStackDetail, "id">): any {
  return {
    title: s.name,
    type: categoryToServerEnum(s.category),
    shortDescription: s.description ?? null,
    longDescription: s.longDescription ?? null,
    icon: s.icon ?? null,
    isNew: s.isNew ?? true,
    popularity: s.popularity ?? 0,
    links:
      s.documentationLinks?.map((l) => ({
        title: l.name,
        url: l.url,
        description: l.description ?? null,
      })) ?? [],
    mcps:
      s.mcpServers?.map((m) => ({
        name: m.name,
        serverConfig: {
          command: m.configuration.command,
          args: m.configuration.args,
          env: m.configuration.env,
        },
      })) ?? [],
  };
}

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
