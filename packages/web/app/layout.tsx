import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProjectProvider } from "@/contexts/project-context";

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
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  );
}

import "./globals.css";
