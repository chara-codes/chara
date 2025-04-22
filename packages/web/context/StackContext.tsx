"use client";
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

export interface TechStack {
  id: string;
  name: string;
  type: StackType;
  description?: string;
  icon?: ReactNode;
}

interface StackCtx {
  stacks: TechStack[];
  filtered: TechStack[];
  filterType: StackType;
  setFilterType: (t: StackType) => void;
  search: string;
  setSearch: (q: string) => void;
  addStack: (s: TechStack) => void;
}

const StackContext = createContext<StackCtx | null>(null);
export const useStacks = () => {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStacks must be inside StackProvider");
  return ctx;
};

export const StackProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Dummy data
  const [stacks, setStacks] = useState<TechStack[]>([
    { id: "1", name: "React", type: "frontend" },
    { id: "2", name: "Next.js", type: "frontend" },
    { id: "3", name: "PostgreSQL", type: "backend" },
  ]);

  const [filterType, setFilterType] = useState<StackType>("all");
  const [search, setSearch] = useState("");

  const addStack = (s: TechStack) => setStacks((prev) => [...prev, s]);

  const filtered = useMemo(() => {
    return stacks.filter((s) => {
      const byType = filterType === "all" || s.type === filterType;
      const bySearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase());
      return byType && bySearch;
    });
  }, [stacks, filterType, search]);

  const value: StackCtx = {
    stacks,
    filtered,
    filterType,
    setFilterType,
    search,
    setSearch,
    addStack,
  };

  return (
    <StackContext.Provider value={value}>{children}</StackContext.Provider>
  );
};
