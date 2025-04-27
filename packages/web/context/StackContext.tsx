"use client";
import { trpc } from "@/utils";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export const stackTypes = [
  "all",
  "frontend",
  "backend",
  "mobile",
  "others",
] as const;
export type StackType = (typeof stackTypes)[number];

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

interface StackCtx {
  stacks: TechStack[];
  filtered: TechStack[];
  filterType: StackType;
  setFilterType: (t: StackType) => void;
  search: string;
  setSearch: (q: string) => void;
  createStack: (s: TechStack) => void;
  updateStack: (s: TechStack) => void;
  deleteStack: (id: string) => void;
  duplicateStack: (id: string) => void;
}

const serverToClient = (row: {
  id: number;
  title: string;
  description: string | null;
}) =>
  ({
    id: String(row.id),
    name: row.title,
    description: row.description ?? "",
    type: "others",
    technologies: [],
  }) satisfies TechStack;

const clientToInsert = (s: Omit<TechStack, "id">) => ({
  title: s.name,
  description: s.description,
});

const clientToUpdate = (s: TechStack) => ({
  id: Number(s.id),
  title: s.name,
  description: s.description,
});

const StackContext = createContext<StackCtx | null>(null);
export const useStacks = () => {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStacks must be inside StackProvider");
  return ctx;
};

export const StackProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const utils = trpc.useUtils();

  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [filterType, setFilterType] = useState<StackType>("all");
  const [search, setSearch] = useState("");

  const { data: rows = [] } = trpc.stacks.list.useQuery(undefined, {
    onSettled: (data: TechStack[] | undefined) => {
      if (data) setStacks(data.map(serverToClient));
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    return stacks.filter((s) => {
      const byType = filterType === "all" || s.type === filterType;
      const bySearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase());
      return byType && bySearch;
    });
  }, [stacks, filterType, search]);

  const createStackMut = trpc.stacks.create.useMutation({
    onSuccess: (row) => {
      setStacks((s) => [...s, serverToClient(row)]);
      utils.stacks.list.invalidate();
    },
  });

  const updateStackMut = trpc.stacks.update.useMutation({
    onSuccess: (row) => {
      setStacks((s) =>
        s.map((st) => (st.id === String(row.id) ? serverToClient(row) : st)),
      );
      utils.stacks.list.invalidate();
    },
  });

  const deleteStackMut = trpc.stacks.remove.useMutation({
    onSuccess: ({ id }) => {
      setStacks((s) => s.filter((st) => st.id !== String(id)));
      utils.stacks.list.invalidate();
    },
  });

  const duplicateStackMut = trpc.stacks.duplicate.useMutation({
    onSuccess: (row) => {
      setStacks((s) => [...s, serverToClient(row)]);
      utils.stacks.list.invalidate();
    },
  });

  /* public actions */

  const createStack = (s: Omit<TechStack, "id">) =>
    createStackMut.mutate(clientToInsert(s));

  const updateStack = (s: TechStack) =>
    updateStackMut.mutate(clientToUpdate(s));

  const deleteStack = (id: string) => deleteStackMut.mutate(Number(id));

  const duplicateStack = (id: string) => duplicateStackMut.mutate(Number(id));

  const value: StackCtx = {
    stacks,
    filtered,
    filterType,
    setFilterType,
    search,
    setSearch,
    createStack,
    updateStack,
    deleteStack,
    duplicateStack,
  };

  return (
    <StackContext.Provider value={value}>{children}</StackContext.Provider>
  );
};
