"use client";

import React from "react";
import styled from "styled-components";
import { isDebugMode } from "../../../utils/debug";
import ToolCallComponent from "../tool-call-component";
import ContextPart from "./context-part";
import DebugPart from "./debug-part";
import ReasoningPart from "./reasoning-part";
import TextPart from "./text-part";
import ToolCallPart from "./tool-call-part";

// Styled components for step-start parts
const StepStartContainer = styled.div`
  background: #f8f9fa;
  border: 1px dashed #d1d5db;
  border-radius: 3px;
  padding: 6px;
  margin: 2px 0;
  font-size: 10px;
  color: #6b7280;
  font-family: monospace;
  position: relative;
  opacity: 0.7;
`;

const StepStartLabel = styled.div`
  position: absolute;
  top: -6px;
  left: 6px;
  background: #9ca3af;
  color: white;
  padding: 1px 4px;
  font-size: 8px;
  font-weight: 500;
  border-radius: 2px;
`;

const StepStartContent = styled.div`
  margin-top: 6px;
`;

const StepStartDetails = styled.pre`
  margin: 4px 0 0 0;
  white-space: pre-wrap;
  font-size: 9px;
  color: #9ca3af;
`;

const UnknownPartContainer = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  margin: 4px 0;
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
`;

const UnknownPartDetails = styled.pre`
  margin: 4px 0 0 0;
  white-space: pre-wrap;
`;

export interface Part {
  type: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  status?: string;
  arguments?: Record<string, unknown>;
  input?: unknown;
  args?: unknown;
  result?: unknown;
  output?: unknown;
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
  [key: string]: unknown;
}

export interface PartRendererProps {
  parts: Part[];
  isUser?: boolean;
  onReasoningToggle?: (index: number) => void;
  expandedReasoningIndex?: number;
  showDebug?: boolean;
}

const PartRenderer: React.FC<PartRendererProps> = ({
  parts,
  isUser = false,
  onReasoningToggle,
  expandedReasoningIndex,
  showDebug,
}) => {
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return null;
  }

  // Check if debug mode is enabled globally or via prop
  const debugModeEnabled = showDebug ?? isDebugMode();

  // In debug mode, show all parts including step-start
  // In normal mode, filter out step-start parts
  const partsToRender = debugModeEnabled
    ? parts
    : parts.filter((part) => part.type !== "step-start");

  return (
    <>
      {partsToRender.map((part, index) => {
        const key = `part-${index}-${part.type}`;

        // Render the main part element
        const partElement = (() => {
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
              arguments: (part.arguments ||
                part.input ||
                part.args ||
                {}) as Record<string, unknown>,
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
                  state={part.state as "complete" | "streaming"}
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
                  input={part.input as Record<string, unknown>}
                  state={part.state as "pending" | "success" | "error"}
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
                    (part.state || (part.error ? "error" : "success")) as
                      | "pending"
                      | "success"
                      | "error"
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

            case "step-start":
              // Special handling for step-start parts in debug mode
              return (
                <StepStartContainer key={key}>
                  <StepStartLabel>workflow</StepStartLabel>
                  <StepStartContent>
                    {part.text || "Step marker"}
                  </StepStartContent>
                  {Object.keys(part).length > 2 && (
                    <StepStartDetails>
                      {JSON.stringify(part, null, 2)}
                    </StepStartDetails>
                  )}
                </StepStartContainer>
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
                <UnknownPartContainer key={key}>
                  <strong>Unknown part type:</strong> {part.type}
                  <UnknownPartDetails>
                    {JSON.stringify(part, null, 2)}
                  </UnknownPartDetails>
                </UnknownPartContainer>
              );
          }
        })();

        // Return the part element with optional debug wrapper
        return (
          <React.Fragment key={key}>
            {partElement}
            {debugModeEnabled && <DebugPart part={part} index={index} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default PartRenderer;
