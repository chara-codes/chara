"use client";

import type { TechStack } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useStacks } from "@/context";

interface StackSelectDialogProps {
  open: boolean;
  handleOpen(): void;
  selectedId: string;
  handleSelect(stack: TechStack): void;
}

export function StackSelectDialog({ open, handleOpen, selectedId, handleSelect }: StackSelectDialogProps) {
  const { filtered: stacks, search, setSearch, isLoading } = useStacks();

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[700px] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Choose Stack
          </DialogTitle>
          <DialogDescription>
            Please choose the stack for the project 
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
        {/* Search Input */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stacks..."
          className="w-full border rounded-md p-2"
        />

        {/* Stack List */}
        <ul className="space-y-2 max-h-64 overflow-auto">
          {stacks.length > 0 ? (
            stacks.map((stack) => (
              <li
                key={stack.id}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedId === stack.id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleSelect(stack)}
              >
                {stack.name}
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-center">{isLoading ? 'Loading...' : 'No stacks found'}</p>
          )}
        </ul>
      </div>

      </DialogContent>
    </Dialog>
  );
}
