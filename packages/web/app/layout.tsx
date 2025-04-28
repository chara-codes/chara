import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout";
import { TrpcProviders } from "@/context";
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
        <TrpcProviders>
          <AppShell>{children}</AppShell>
          <Toaster />
        </TrpcProviders>
      </body>
    </html>
  );
}

import "./globals.css";
