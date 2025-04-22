"use client";

import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { stackTypes, useStacks } from "@/context/StackContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(stackTypes),
});

export const CreateStackDialog = () => {
  const { addStack } = useStacks();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(({ name, type }) => {
    addStack({ id: Date.now().toString(), name, type });
    form.reset();
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full !mt-2" variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Stack
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create New Technology Stack</DialogTitle>

          {/* -- placeholder for modal window --*/}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
