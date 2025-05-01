"use client";
import { TechStack } from "@/types";
import { matchStack, serverToClient, trpc } from "@/utils";
import { StackType } from "@chara/server";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useStacksService } from "@/hooks/useStackService";
import { useDebounce } from "@/hooks/useDebounce";

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

const StackContext = createContext<StackCtx | null>(null);
export const useStacks = () => {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error("useStacks must be inside StackProvider");
  return ctx;
};

export const StackProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [filterType, setFilterType] = useState<StackType>("all");
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 250);

  const { data: serverStacks = [] } = trpc.stacks.list.useQuery(undefined, {
    select: (rows) => rows.map(serverToClient),
    initialData: [],
  });

  const filtered = useMemo(
    () => stacks.filter((s) => matchStack(s, search, filterType)),
    [stacks, search, filterType],
  );

  const svc = useStacksService();

  useEffect(() => {
    setStacks(serverStacks);
  }, [serverStacks]);

  const value = useMemo<StackCtx>(
    () => ({
      stacks,
      filtered,
      filterType,
      setFilterType,
      search: searchRaw,
      setSearch: setSearchRaw,
      ...svc,
    }),
    [stacks, filtered, filterType, searchRaw, svc],
  );

  return (
    <StackContext.Provider value={value}>{children}</StackContext.Provider>
  );
};
