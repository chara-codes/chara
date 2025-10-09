"use client";

import type { ToolCall } from "@chara-codes/core";
import { useCallback, useState } from "react";
import type React from "react";
import { ExpandableChevronIcon } from "../../atoms/icons/expandable-chevron-icon";
import { getToolIcon } from "../../atoms/icons/tool-icon-mapper";
// Import specialized tool components for enhanced display
import { TerminalToolBlock } from "../tools";
import { DiffBlock } from "../tools/diff-block";
import {
  ToolCallArguments,
  ToolCallArgumentsContent,
  ToolCallArgumentsLabel,
  ToolCallItemHeader,
  ToolCallName,
  ToolCallResult,
  ToolCallResultContent,
  ToolCallResultLabel,
  ToolCallsContainer,
  ToolCallStatus,
  ToolCallToggle,
} from "./styles";

interface ToolCallComponentProps {
  toolCall: ToolCall;
  toolCallId: string;
  toolCallType: string;
}

const ToolCallComponent: React.FC<ToolCallComponentProps> = ({
  toolCall,
  toolCallType,
  toolCallId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = toolCall.name || toolCallType;
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  /*
   * SPECIALIZED TOOL COMPONENT ROUTING
   *
   * This component routes different tool call types to specialized display components
   * for enhanced user experience. Instead of showing raw JSON, these tools get
   * custom interfaces that better represent their functionality.
   */

  // Terminal tool calls: Show command execution with syntax highlighting and streaming output
  if (type === "terminal") {
    return (
      <TerminalToolBlock
        toolCall={toolCall}
        id={toolCallId}
        toolCallType={type}
        isVisible={true}
      />
    );
  }

  // Edit file tool calls: Show diff view with before/after comparison
  if (type === "edit-file" || type === "write-file") {
    return (
      <DiffBlock
        toolCall={toolCall}
        toolCallId={toolCallId}
        isVisible={true}
        showLineNumbers={true}
        maxHeight={300}
      />
    );
  }

  /*
   * DEFAULT TOOL CALL DISPLAY
   *
   * For tool calls that don't have specialized components, show a generic
   * expandable interface with arguments and results in JSON format.
   */
  return (
    <ToolCallsContainer>
      <div>
        <ToolCallItemHeader>
          <ToolCallName>
            {getToolIcon(type)}
            {type}
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
                <ToolCallResultContent $hasError={toolCall.status === "error"}>
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
