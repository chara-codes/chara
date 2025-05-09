"use client";
import { useStacks } from "@/context/StackContext";
import { StackSearch } from "@/components/stack/StackSearch";

export const StackTopBar = () => {
  const { filterType } = useStacks();

  return (
    <header
      className="
        flex flex-col gap-4 mb-6
        sm:flex-row sm:items-center
        sm:justify-between
      "
    >
      <h1 className="text-2xl font-semibold capitalize">{filterType} stacks</h1>
      <StackSearch />
    </header>
  );
};
