"use client";

import { Button } from "@/components/ui/button";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { stackTypes, useStacks } from "@/context/StackContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { TechBuilder } from "./TechBuilder";

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

export const CreateStackDialog = () => {
  const { addStack } = useStacks();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "frontend",
      description: "",
      technologies: [],
    },
  });

  /* dynamic array helpers */
  const {
    fields: techFields,
    append,
    remove,
  } = useFieldArray({ control, name: "technologies" });

  const onAddTech = (tech: z.infer<typeof techSchema>) => {
    append(tech);
  };

  const onSubmit = handleSubmit((data) => {
    addStack({
      id: Date.now().toString(),
      name: data.name,
      type: data.type,
      description: data.description || "",
      technologies: data.technologies,
    });
    reset();
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full !mt-2" variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Stack
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create New Stack</DialogTitle>
          <DialogDescription>
            Enter the details for your new technology stack. Click save when
            you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── Name ────────────────────────────────────── */}
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

          {/* ── Category ────── */}
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

          {/* ── Technologies list builder ──────────────── */}
          <TechBuilder onAdd={onAddTech} />
          {errors.technologies && (
            <p className="text-destructive text-sm -mt-4 pl-[30%]">
              {errors.technologies.message as string}
            </p>
          )}

          {/* Existing tech chips */}
          {techFields.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-3 col-start-2">
                <ScrollArea className="h-[110px] rounded-md border p-4">
                  <div className="flex flex-wrap gap-2">
                    {techFields.map((tech, idx) => (
                      <Badge
                        key={tech.id}
                        className="flex items-center gap-1"
                        variant="secondary"
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

          {/* ── Description ────────────────────────────── */}
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

          {/* ── Submit ─────────────────────────────────── */}
          <DialogFooter>
            <Button type="submit">Save Stack</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
