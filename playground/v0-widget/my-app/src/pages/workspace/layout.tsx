import type React from "react";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="workspace-layout">{children}</div>;
}
