"use client";
import { Input } from "@/components/ui/input";
import { useStacks } from "@/context/StacksContext";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const StackSearch = () => {
  const { search, setSearch } = useStacks();
  return (
    <div className="flex items-center space-x-2">
      <Input
        placeholder="Search stacks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-64"
      />
      <Button size="icon" variant="ghost">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};
