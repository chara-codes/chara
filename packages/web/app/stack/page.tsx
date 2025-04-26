"use client";
import { StackProvider } from "@/context";
import {
  StackFilter,
  CreateStackButton,
  StackGrid,
  StackTopBar,
} from "@/components/stack";
import { useLayout } from "@/components/layout";

export default function StackPage() {
  const { leftVisible } = useLayout();

  return (
    <StackProvider>
      <div className="flex h-full">
        {/* Left rail */}
        {leftVisible && (
          <aside className="w-64 shrink-0 border-r p-4 space-y-4">
            <StackFilter />
            <CreateStackButton />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          <StackTopBar />
          <StackGrid />
        </main>
      </div>
    </StackProvider>
  );
}
