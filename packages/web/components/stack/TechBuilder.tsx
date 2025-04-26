"use client";

import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { techSchema } from "./StackFormDialog";

type TechBuilderProps = {
  onAdd: (tech: z.infer<typeof techSchema>) => void;
};

export const TechBuilder = ({ onAdd }: TechBuilderProps) => {
  const {
    register,
    reset,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof techSchema>>({
    resolver: zodResolver(techSchema),
    defaultValues: { name: "", docsUrl: "", codeUrl: "" },
  });

  const handleAdd = handleSubmit((data) => {
    onAdd(data);
    reset();
  });

  function handleSubmit(cb: (data: any) => void) {
    return (e: React.FormEvent) => {
      e.preventDefault();
      cb(getValues());
    };
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Technologies</Label>

        <div className="col-span-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Name" {...register("name")} />
            <Input placeholder="Docs URL" {...register("docsUrl")} />
            <Input placeholder="Code URL" {...register("codeUrl")} />
          </div>

          <Button type="button" onClick={handleAdd} className="w-full">
            Add Technology
          </Button>

          {/* Inline errors (optional) */}
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
          {(errors.docsUrl || errors.codeUrl) && (
            <p className="text-destructive text-xs">
              {errors.docsUrl?.message || errors.codeUrl?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
