import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workspace | AI Development Environment",
  description: "Interactive workspace for AI-assisted development",
}

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="workspace-layout">{children}</div>
}
