"use client";
import { useStacks } from "@/context/StackContext";
import { StackCard } from "./StackCard";

export const StackGrid = () => {
  const { filtered } = useStacks();
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {filtered.map((s) => (
        <StackCard key={s.id} stack={s} />
      ))}
      {filtered.length === 0 && (
        <p className="col-span-full text-muted-foreground">
          Nothing matches your criteria.
        </p>
      )}
    </div>
  );
};
