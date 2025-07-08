"use client";
import { useStacks } from "@/context/StacksContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stackTypes, StackType } from "@apk/server";

export const StackFilter = () => {
  const { filterType, setFilterType } = useStacks();

  return (
    <Select
      value={filterType}
      onValueChange={(v) => setFilterType(v as StackType)}
    >
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {stackTypes.map((type) => (
          <SelectItem key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Stacks
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
