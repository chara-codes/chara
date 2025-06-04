import React from "react";
import Link from "next/link";
import { MessageSquare, Code, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Code className="h-6 w-6" />
            <span className="font-bold hidden md:inline-block">AI Chat & Preview</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2">
          <nav className="flex items-center space-x-2">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary py-2 px-3 rounded-md flex items-center"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Chat</span>
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2 px-3 rounded-md flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
