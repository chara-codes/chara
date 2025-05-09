"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLayout } from "./AppShell";
import { usePathname } from "next/navigation";
import { AppPath } from "@/constants";

const titleMap: Record<string, string> = {
  [AppPath.Stack]: "Stack Management",
  [AppPath.Chat]: "Chat Assistant",
} as const;

export const Header = () => {
  const { leftVisible, toggleLeft } = useLayout();
  const pathname = usePathname();

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

      <Image
        src="/placeholder.svg?height=40&width=40"
        alt="User avatar"
        width={40}
        height={40}
        className="rounded-full"
      />
    </header>
  );
};
