"use client";
import { useStacks } from "@/context/StackContext";
import { StackCard } from "./StackCard";

export const StackGrid = () => {
  const { filtered } = useStacks();
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
      {filtered.map((stack) => (
        <StackCard key={stack.id} stack={stack} />
      ))}
      {filtered.length === 0 && (
        <p className="col-span-full text-muted-foreground">
          Nothing matches your criteria.
        </p>
      )}
    </div>
  );
};
