"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StackFormDialog } from "./StackFormDialog";

export const CreateStackButton = () => {
  return (
    <StackFormDialog
      mode="create"
      trigger={
        <Button className="w-full !mt-2" variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Stack
        </Button>
      }
    />
  );
};
