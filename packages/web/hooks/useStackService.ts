"use client";
import { clientToInsert, clientToUpdate, trpc } from "@/utils";
import { toast } from "./use-toast";
import { TechStack } from "@/types";

export function useStacksService() {
  const utils = trpc.useUtils();
  const invalidate = () => utils.stacks.list.invalidate();

  const create = trpc.stacks.create.useMutation({
    onSuccess: (row) => {
      toast({ title: "Stack created", description: row.title });
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Failed to create stack", description: err.message });
    },
  });

  const update = trpc.stacks.update.useMutation({
    onSuccess: (row) => {
      toast({ title: "Stack updated", description: row.title });
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Failed to update stack", description: err.message });
    },
  });

  const remove = trpc.stacks.remove.useMutation({
    onSuccess: () => {
      toast({ title: "Stack deleted" });
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Failed to delete stack", description: err.message });
    },
  });

  const duplicate = trpc.stacks.duplicate.useMutation({
    onSuccess: (row) => {
      toast({ title: "Stack duplicated", description: row.title });
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Failed to duplicate stack", description: err.message });
    },
  });

  return {
    createStack: (s: Omit<TechStack, "id">) => create.mutate(clientToInsert(s)),
    updateStack: (s: TechStack) => update.mutate(clientToUpdate(s)),
    deleteStack: (id: string) => remove.mutate(Number(id)),
    duplicateStack: (id: string) => duplicate.mutate(Number(id)),
  };
}
