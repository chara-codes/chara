"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
import { useLayout } from "./AppShell";
import { usePathname } from "next/navigation";
import { AppPath } from "@/constants";
import { useSession } from "@/context/SessionContext";

const titleMap: Record<string, string> = {
  [AppPath.Stack]: "Stack Management",
  [AppPath.Chat]: "Chat Assistant",
} as const;

export const Header = () => {
  const { leftVisible, toggleLeft } = useLayout();
  const pathname = usePathname();
  const { session } = useSession();

  const base = "/" + (pathname.split("/")[1] || "");
  const title = titleMap[base] ?? "Unknown Page";

  return (
    <header className="flex justify-between items-center p-4 border-b bg-background">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeft}
          className="mr-2"
        >
          {leftVisible ? (
            <PanelLeftClose className="h-6 w-6" />
          ) : (
            <PanelLeftOpen className="h-6 w-6" />
          )}
        </Button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session?.username ? `Welcome, ${session.username}!` : "Welcome!"}
        </span>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};
