"use client";

import { TechStackDetail } from "../types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ReactNode, useEffect } from "react";
import { trpc } from "../services";
import type { StackDTO } from "@apk/server";
import { toast } from "../components";
import { Screen, useRoutingStore } from "./routing-store";

interface TechStacksState {
  // State
  techStacks: TechStackDetail[];
  isLoading: boolean;
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

export function TechStacksProvider({ children }: { children: ReactNode }) {
  // Use the data loading hook to fetch tech stacks when the component mounts
  useTechStacksData();

  return <>{children}</>;
}

export function useTechStacksData() {
  const setTechStacks = useTechStacksStore((state) => state.setTechStacks);
  const setLoading = useTechStacksStore((state) => state.setLoading);
  const currentScreen = useRoutingStore((state) => state.currentScreen);

  const { data: serverStacks = [], isFetching } = trpc.stacks.list.useQuery(
    undefined,
    {
      enabled: currentScreen === Screen.TECH_STACKS,
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
      mutation.mutate({
        id: Number(s.id),
        ...detailToCreateInput(s),
      }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

function detailToCreateInput(s: Omit<TechStackDetail, "id">): any {
  return {
    title: s.name,
    type: s.category,
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

function mapServerStackToDetail(s: StackDTO): TechStackDetail {
  return {
    id: s.id.toString(),
    name: s.title,
    category: s.type,
    description: s.shortDescription ?? "",
    longDescription: s.longDescription ?? undefined,
    icon: s.icon,
    isNew: s.isNew ?? false,
    popularity: s.popularity ?? 0,
    documentationLinks: s.links.map((link: any) => ({
      id: crypto.randomUUID(),
      name: link.title,
      url: link.url,
      description: link.description ?? undefined,
    })),
    mcpServers:
      s.mcps?.map((mcp: any) => ({
        id: crypto.randomUUID(),
        name: mcp.name,
        configuration: {
          command: mcp.serverConfig.command,
          args: mcp.serverConfig.args ?? [],
          env: mcp.serverConfig.env ?? {},
        },
      })) ?? [],
  };
}
