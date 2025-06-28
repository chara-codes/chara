"use client";

import { useState, useCallback } from "react";
import type React from "react";
import { getToolIcon } from "../../atoms/icons";
import {
  ToolCallsContainer,
  ToolCallName,
  ToolCallStatus,
  ToolCallArguments,
  ToolCallArgumentsLabel,
  ToolCallArgumentsContent,
  ToolCallResult,
  ToolCallResultLabel,
  ToolCallResultContent,
  ToolCallItemHeader,
  ToolCallToggle,
} from "./styles";
import { ExpandableChevronIcon } from "../../atoms/icons/expandable-chevron-icon";
import { TerminalToolBlock } from "../tools";

interface ToolCallData {
  name?: string;
  status?: string;
  arguments?: unknown;
  result?: unknown;
}

interface ToolCallComponentProps {
  toolCall: ToolCallData;
  toolCallId: string;
  toolCallType: string;
}

const ToolCallComponent: React.FC<ToolCallComponentProps> = ({
  toolCall,
  toolCallType,
  toolCallId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Helper function to extract terminal arguments
  const getTerminalArgs = () => {
    if (typeof toolCall.arguments === "object" && toolCall.arguments !== null) {
      const args = toolCall.arguments as Record<string, unknown>;
      return {
        command: String(args.command || ""),
        workingDirectory: args.cd
          ? String(args.cd)
          : args.workingDirectory
            ? String(args.workingDirectory)
            : undefined,
      };
    }
    return { command: "", workingDirectory: undefined };
  };

  // Helper function to get terminal output
  const getTerminalOutput = () => {
    if (typeof toolCall.result === "string") {
      return toolCall.result;
    }
    if (typeof toolCall.result === "object" && toolCall.result !== null) {
      const result = toolCall.result as Record<string, unknown>;
      return (
        String(result.output || "") ||
        String(result.stdout || "") ||
        JSON.stringify(toolCall.result, null, 2)
      );
    }
    return "";
  };

  // Helper function to get terminal status
  const getTerminalStatus = ():
    | "pending"
    | "in-progress"
    | "success"
    | "error" => {
    const status = toolCall.status || "success";
    if (status === "completed" || status === "success") return "success";
    if (status === "error" || status === "failed") return "error";
    if (status === "running" || status === "in-progress") return "in-progress";
    return "pending";
  };

  // Special handling for terminal tool calls
  if (toolCallType === "terminal") {
    const { command, workingDirectory } = getTerminalArgs();
    const output = getTerminalOutput();
    const status = getTerminalStatus();

    return (
      <TerminalToolBlock
        command={command}
        workingDirectory={workingDirectory}
        output={output}
        status={status}
        isGenerating={status === "in-progress"}
        isVisible={true}
        toolCallId={toolCallId}
        toolCallError={status === "error" ? output : undefined}
      />
    );
  }

  // Default tool call component for non-terminal tools
  return (
    <ToolCallsContainer>
      <div>
        <ToolCallItemHeader>
          <ToolCallName>
            {getToolIcon(toolCallType)}
            {toolCall.name || toolCallType}
          </ToolCallName>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ToolCallStatus status={toolCall.status || "success"}>
              {toolCall.status || "completed"}
            </ToolCallStatus>
            <ToolCallToggle onClick={handleToggle}>
              <ExpandableChevronIcon isExpanded={isExpanded} />
            </ToolCallToggle>
          </div>
        </ToolCallItemHeader>

        {isExpanded && (
          <>
            {toolCall.arguments ? (
              <ToolCallArguments>
                <ToolCallArgumentsLabel>Arguments</ToolCallArgumentsLabel>
                <ToolCallArgumentsContent>
                  {typeof toolCall.arguments === "string"
                    ? (toolCall.arguments as string)
                    : JSON.stringify(toolCall.arguments, null, 2)}
                </ToolCallArgumentsContent>
              </ToolCallArguments>
            ) : null}

            {toolCall.result ? (
              <ToolCallResult>
                <ToolCallResultLabel>Result</ToolCallResultLabel>
                <ToolCallResultContent hasError={toolCall.status === "error"}>
                  {typeof toolCall.result === "string"
                    ? (toolCall.result as string)
                    : JSON.stringify(toolCall.result, null, 2)}
                </ToolCallResultContent>
              </ToolCallResult>
            ) : null}
          </>
        )}
      </div>
    </ToolCallsContainer>
  );
};

export default ToolCallComponent;
