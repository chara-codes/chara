import type { StackType } from "@chara/server";
import type { ReactNode } from "react";

/** Chat message types */
export interface FileDiff {
  oldContent: string;
  newContent: string;
}

export interface FileChange {
  id: string;
  filename: string;
  type: "add" | "delete" | "modify";
  description: string;
  version?: number;
  diff?: FileDiff;
}

export interface Command {
  id: string;
  command: string;
  description?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // In a real app, this would be a blob URL or a server URL
}

export interface Message {
  id: string;
  content: string;
  context?: Record<string, unknown>;
  role: "user" | "assistant";
  timestamp: Date;
  regenerations?: string[];
  currentRegenerationIndex?: number;
  fileChanges?: FileChange[];
  commands?: Command[];
  attachments?: FileAttachment[];
}

/** Technology stack types */
export interface Technology {
  name: string;
  docsUrl?: string;
  codeUrl?: string;
}

export interface TechStack {
  id: string;
  name: string;
  type: StackType;
  description: string;
  technologies: Technology[];
  icon?: ReactNode;
}
