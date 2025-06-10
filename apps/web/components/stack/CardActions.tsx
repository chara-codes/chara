import { TechStack } from "@/types";
import { useStacks } from "@/context";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { StackFormDialog } from "@/components/stack/StackFormDialog";

export const CardActions = ({ stack }: { stack: TechStack }) => {
  const { deleteStack, duplicateStack } = useStacks();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="!mt-0 border-none outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
            <EllipsisVertical />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent side="bottom" align="end" sideOffset={10}>
            <div className="px-2 py-1 text-md font-semibold">Actions</div>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              Edit stack
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => duplicateStack(stack.id)}>
              Duplicate stack
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => deleteStack(stack.id)}
              className="text-destructive hover:!text-destructive"
            >
              Delete Stack
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <StackFormDialog
        mode="edit"
        stack={stack}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
};
