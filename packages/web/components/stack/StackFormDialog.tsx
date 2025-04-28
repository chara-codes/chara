"use client";
import { ReactNode, useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

import { useStacks } from "@/context/StackContext";
import { Label } from "@/components/ui/label";
import { TechBuilder } from "@/components/stack/TechBuilder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { stackTypes } from "@chara/server";
import { TechStack } from '@/types';

export const techSchema = z.object({
  name: z.string().min(1, "Required"),
  docsUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  codeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  type: z.enum(stackTypes),
  description: z.string().optional(),
  technologies: z
    .array(techSchema)
    .min(1, "Add at least one technology")
    .max(10, "Too many"),
});

type FormValues = z.infer<typeof formSchema>;

export type StackFormDialogProps =
  | {
      mode: "create";
      trigger?: ReactNode;
      open?: boolean;
      onOpenChange?: (o: boolean) => void;
    }
  | {
      mode: "edit";
      stack: TechStack;
      trigger?: ReactNode;
      open?: boolean;
      onOpenChange?: (o: boolean) => void;
    };

export const StackFormDialog = (props: StackFormDialogProps) => {
  const { createStack, updateStack } = useStacks();

  /* ── Controlled vs uncontrolled ── */
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;
  const setOpen = isControlled ? props.onOpenChange! : setInternalOpen;

  /* — defaultValues depend on mode — */
  const defaults: FormValues =
    props.mode === "edit"
      ? {
          name: props.stack.name,
          type: props.stack.type,
          description: props.stack.description ?? "",
          technologies: props.stack.technologies ?? [],
        }
      : { name: "", type: "frontend", description: "", technologies: [] };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    criteriaMode: "all",
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "technologies",
  });

  const [tmpTech, setTmpTech] = useState({
    name: "",
    docsUrl: "",
    codeUrl: "",
  });

  function onAddTech(data: z.infer<typeof techSchema>) {
    append(data);
    setTmpTech({ name: "", docsUrl: "", codeUrl: "" });
  }

  const onSubmit = handleSubmit((data) => {
    if (props.mode === "create") {
      createStack({
        id: Date.now().toString(),
        name: data.name,
        type: data.type,
        description: data.description || "",
        technologies: data.technologies,
      });
    } else {
      updateStack({
        id: props.stack.id,
        name: data.name,
        type: data.type,
        description: data.description || "",
        technologies: data.technologies,
      });
    }
    reset(defaults);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.trigger && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[700px] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "Create New Stack" : "Edit Stack"}
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new technology stack. Click save when
            you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── Name ── */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              autoFocus
              placeholder="e.g., MERN Stack"
              {...register("name")}
              className="col-span-3"
            />
          </div>
          {errors.name && (
            <p className="text-destructive text-sm -mt-4 pl-[30%]">
              {errors.name.message}
            </p>
          )}

          {/* ── Category── */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {stackTypes
                      .filter((t) => t !== "all")
                      .map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ── Technologies list builder ── */}
          <TechBuilder onAdd={onAddTech} />
          {errors.technologies && (
            <p className="text-destructive text-sm -mt-4 pl-[30%]">
              {errors.technologies.message as string}
            </p>
          )}

          {/* existing tech chips */}
          {fields.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-3 col-start-2">
                <ScrollArea className="h-[110px] border rounded-md p-4">
                  <div className="flex flex-wrap gap-2">
                    {fields.map((tech, idx) => (
                      <Badge
                        key={tech.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tech.name}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0"
                          onClick={() => remove(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* ── Description ── */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Markdown supported…"
              className="col-span-3 h-[300px] font-mono"
              {...register("description")}
            />
          </div>

          {/* ── Submit ── */}
          <DialogFooter>
            <Button
              type="submit"
              disabled={!isDirty || !isValid || isSubmitting}
            >
              {props.mode === "create" ? "Save Stack" : "Update Stack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
