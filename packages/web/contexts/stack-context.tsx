"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface StackInformation {
  id: string;
  name: string;
}

interface StackContextType {
  selectedStack: StackInformation | null;
  setSelectedStack: (stack: StackInformation | null) => void;
}

const StackContext = createContext<StackContextType | undefined>(undefined);

export function StackProvider({ children }: { children: ReactNode }) {
  const [selectedStack, setSelectedStack] = useState<{
    id: string;
    name: string;
  } | null>(() => {
    // Try to load from localStorage on initial render (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedStack");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const handleSetSelectedStack = (
    stack: { id: string; name: string } | null,
  ) => {
    setSelectedStack(stack);

    if (stack) {
      localStorage.setItem("selectedStack", JSON.stringify(stack));
    } else {
      localStorage.removeItem("selectedStack");
    }
  };

  return (
    <StackContext.Provider
      value={{ selectedStack, setSelectedStack: handleSetSelectedStack }}
    >
      {children}
    </StackContext.Provider>
  );
}

export function useStack() {
  const context = useContext(StackContext);
  if (context === undefined) {
    throw new Error("useStack must be used within a StackProvider");
  }
  return context;
}
