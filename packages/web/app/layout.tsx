import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProjectProvider } from "@/contexts/project-context";
import { StacksProvider } from "@/context";
import { AppShell } from "@/components/layout";
import { TrpcProviders } from "@/context";
import { SessionProvider } from "@/context/SessionContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chara Codes",
  description:
    "Chara Codes is an AI-powered development environment designed to streamline frontend development workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <ProjectProvider>
            <StackProvider>
              <TrpcProviders>
                <SessionProvider>
                  <StacksProvider>
                    <AppShell>{children}</AppShell>
                    <Toaster />
                  </StacksProvider>
                </SessionProvider>
              </TrpcProviders>
            </StackProvider>
          </ProjectProvider>
      </body>
    </html>
  );
}

import "./globals.css";import { StackProvider } from "@/contexts/stack-context";

