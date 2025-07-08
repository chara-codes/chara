import { z } from "zod";
import { stackTypes } from "@apk/server";
import { ReactNode } from "react";
import { TechStack } from "@/types";

/** Create/Edit stack form schemas and types */

export const techSchema = z.object({
  name: z.string().min(1, "Required"),
  docsUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  codeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const techDraftSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  docsUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  codeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  type: z.enum(stackTypes),
  description: z.string().optional(),
  technologies: z
    .array(techSchema)
    .min(1, "Add at least one technology")
    .max(10, "Too many"),
  techDraft: techDraftSchema.default({ name: "", docsUrl: "", codeUrl: "" }),
});

export type FormValues = z.infer<typeof formSchema>;
export type TechSchemaType = z.infer<typeof techSchema>;

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
