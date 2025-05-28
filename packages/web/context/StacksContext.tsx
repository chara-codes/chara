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

interface StacksCtx {
  stacks: TechStack[];
  filtered: TechStack[];
  filterType: StackType;
  setFilterType: (t: StackType) => void;
  search: string;
  isLoading: boolean;
  setSearch: (q: string) => void;
  createStack: (s: TechStack) => void;
  updateStack: (s: TechStack) => void;
  deleteStack: (id: string) => void;
  duplicateStack: (id: string) => void;
}

const StacksContext = createContext<StacksCtx | null>(null);
export const useStacks = () => {
  const ctx = useContext(StacksContext);
  if (!ctx) throw new Error("useStacks must be inside StackProvider");
  return ctx;
};

export const StacksProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [filterType, setFilterType] = useState<StackType>("all");
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 250);

  const { data: serverStacks = [], isFetching } = trpc.stacks.list.useQuery(undefined, {
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

  const value = useMemo<StacksCtx>(
    () => ({
      stacks,
      filtered,
      filterType,
      setFilterType,
      search: searchRaw,
      setSearch: setSearchRaw,
      isLoading: isFetching,
      ...svc,
    }),
    [stacks, filtered, filterType, searchRaw, svc],
  );

  return (
    <StacksContext.Provider value={value}>{children}</StacksContext.Provider>
  );
};
