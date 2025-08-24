"use client";

import React from "react";
import ToolCallComponent from "../tool-call-component";
import ContextPart from "./context-part";
import ReasoningPart from "./reasoning-part";
import TextPart from "./text-part";
import ToolCallPart from "./tool-call-part";

export interface Part {
  type: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  status?: string;
  arguments?: Record<string, any>;
  input?: any;
  args?: any;
  result?: any;
  output?: any;
  error?: string;
  text?: string;
  title?: string;
  url?: string;
  sourceId?: string;
  content?: string;
  filename?: string;
  mediaType?: string;
  size?: number;
  lastModified?: string;
  [key: string]: any;
}

export interface PartRendererProps {
  parts: Part[];
  isUser?: boolean;
  onReasoningToggle?: (index: number) => void;
  expandedReasoningIndex?: number;
}

const PartRenderer: React.FC<PartRendererProps> = ({
  parts,
  isUser = false,
  onReasoningToggle,
  expandedReasoningIndex,
}) => {
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return null;
  }

  return (
    <>
      {parts
        .filter((part) => part.type !== "step-start")
        .map((part, index) => {
          const key = `part-${index}-${part.type}`;

          // Check if this part has a toolCallId - if so, render as specialized tool block
          if (part.toolCallId && typeof part.toolCallId === "string") {
            let toolName = "";

            // Extract tool name from different type formats
            if (part.type?.startsWith("tool-")) {
              // Format: "tool-directory" -> "directory"
              toolName = part.type.replace(/^tool-/, "");
            } else if (
              part.type === "tool-call" ||
              part.type === "tool-result"
            ) {
              // Format: "tool-call" with separate toolName property
              toolName = part.toolName || "unknown";
            } else {
              // Fallback to the type itself
              toolName = part.type || "unknown";
            }

            // Create a tool call object compatible with the ToolCallComponent
            const rawStatus = part.state || part.status || "success";
            let status: "pending" | "in-progress" | "success" | "error" =
              "success";

            if (rawStatus === "generating" || rawStatus === "streaming") {
              status = "in-progress";
            } else if (rawStatus === "error" || rawStatus === "failed") {
              status = "error";
            } else if (rawStatus === "pending") {
              status = "pending";
            } else {
              status = "success";
            }

            const toolCall = {
              id: part.toolCallId,
              name: toolName,
              status,
              arguments: part.arguments || part.input || part.args || {},
              result: part.result || part.output || {},
            };

            // Use the existing ToolCallComponent which has specialized routing
            return (
              <ToolCallComponent
                key={key}
                toolCall={toolCall}
                toolCallId={part.toolCallId}
                toolCallType={toolName}
              />
            );
          }

          // Handle regular parts (non-tool calls)
          switch (part.type) {
            case "text":
              return (
                <TextPart key={key} text={part.text || ""} isUser={isUser} />
              );

            case "reasoning":
              return (
                <ReasoningPart
                  key={key}
                  text={part.text}
                  state={part.state as any}
                  isExpanded={expandedReasoningIndex === index}
                  onToggle={() => onReasoningToggle?.(index)}
                />
              );

            case "tool-call":
              return (
                <ToolCallPart
                  key={key}
                  toolName={part.toolName || "Unknown Tool"}
                  toolCallId={part.toolCallId || `tool-${index}`}
                  input={part.input}
                  state={part.state as any}
                />
              );

            case "tool-result":
              return (
                <ToolCallPart
                  key={key}
                  toolName={part.toolName || "Unknown Tool"}
                  toolCallId={part.toolCallId || `tool-${index}`}
                  output={part.output}
                  error={part.error}
                  state={
                    (part.state || (part.error ? "error" : "success")) as any
                  }
                />
              );

            case "source-url":
              return (
                <ContextPart
                  key={key}
                  type="source-url"
                  title={part.title}
                  url={part.url}
                  sourceId={part.sourceId}
                  content={part.content}
                />
              );

            case "source-document":
              return (
                <ContextPart
                  key={key}
                  type="source-document"
                  title={part.title}
                  filename={part.filename}
                  mediaType={part.mediaType}
                  sourceId={part.sourceId}
                  content={part.content}
                  size={part.size}
                  lastModified={part.lastModified}
                />
              );

            case "file":
              return (
                <ContextPart
                  key={key}
                  type="file"
                  filename={part.filename}
                  url={part.url}
                  mediaType={part.mediaType}
                  content={part.content}
                  size={part.size}
                  lastModified={part.lastModified}
                />
              );

            default:
              // For unknown part types, try to render as text if possible
              if (part.text) {
                return (
                  <TextPart
                    key={key}
                    text={`[${part.type}] ${part.text}`}
                    isUser={isUser}
                  />
                );
              }

              // If no text, render as a generic debug view
              return (
                <div
                  key={key}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "8px",
                    margin: "4px 0",
                    fontSize: "12px",
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  <strong>Unknown part type:</strong> {part.type}
                  <pre style={{ margin: "4px 0 0 0", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                </div>
              );
          }
        })}
    </>
  );
};

export default PartRenderer;
