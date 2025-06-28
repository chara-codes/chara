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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

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
