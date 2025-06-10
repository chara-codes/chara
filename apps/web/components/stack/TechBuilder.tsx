"use client";

import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { FormValues, techSchema, TechSchemaType } from "./utils";

type TechBuilderProps = {
  append: (tech: TechSchemaType) => void;
};

export const TechBuilder = ({ append }: TechBuilderProps) => {
  const {
    register,
    getValues,
    setValue,
    clearErrors,
    setError,
    watch,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useFormContext<FormValues>();

  const handleAdd = () => {
    const draft = getValues("techDraft");
    const parsed = techSchema.safeParse(draft);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      if (flat.name) setError("techDraft.name", { message: flat.name[0] });
      if (flat.docsUrl)
        setError("techDraft.docsUrl", { message: flat.docsUrl[0] });
      if (flat.codeUrl)
        setError("techDraft.codeUrl", { message: flat.codeUrl[0] });
      return;
    }
    append(parsed.data);
    setValue("techDraft", { name: "", docsUrl: "", codeUrl: "" });
    clearErrors("techDraft");
    clearErrors("technologies");
  };

  const draftErr = (errors.techDraft as any) || {};
  const draft = watch("techDraft");
  const isDraftValid = techSchema.safeParse(draft).success;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Technologies</Label>

        <div className="col-span-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Name" {...register("techDraft.name")} />
            <Input placeholder="Docs URL" {...register("techDraft.docsUrl")} />
            <Input placeholder="Code URL" {...register("techDraft.codeUrl")} />
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            className="w-full"
            disabled={!isDraftValid}
          >
            Add Technology
          </Button>

          {draftErr?.name?.message && (
            <p className="text-destructive text-xs">{draftErr.name.message}</p>
          )}
          {(draftErr?.docsUrl?.message || draftErr?.codeUrl?.message) && (
            <p className="text-destructive text-xs">
              {draftErr.docsUrl?.message || draftErr.codeUrl?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
