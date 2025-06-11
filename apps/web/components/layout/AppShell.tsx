"use client";
import { createContext, useContext, useState } from "react";
import { Header } from "./Header";
import { SideNav } from "./SideNav";

type LayoutCtx = {
  leftVisible: boolean;
  toggleLeft: () => void;
};

const LayoutContext = createContext<LayoutCtx | null>(null);
export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be inside AppShell");
  return ctx;
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [leftVisible, setLeftVisible] = useState(true);
  const toggleLeft = () => setLeftVisible((v) => !v);

  return (
    <LayoutContext.Provider value={{ leftVisible, toggleLeft }}>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <SideNav />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};
