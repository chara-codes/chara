import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import styled from "styled-components";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ToolCall } from "../../../../../frontend/core/src/stores/types.ts";
import { ToolIcon } from "./icons";
import { cleanThinkingTags } from "../../../../../frontend/core/src/utils/thinking-tags.ts";

interface ContentSegment {
  type: "text" | "tool-call";
  content: string;
  toolCall?: ToolCall;
}

interface InlineMessageContentProps {
  segments: ContentSegment[];
  isUser: boolean;
}

const MessageContent = styled.div`
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const ToolCallInline = styled.div<{ status: string }>`
  display: block;
  font-size: 11px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
  font-weight: 400;
  margin: 4px 0;

  &:hover {
    color: #374151;
  }
`;

const ToolCallHeader = styled.div`
  display: flex;
  align-items: center;
  font-weight: 400;
`;

const ToolCallName = styled.span`
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  color: #9ca3af;
`;

const ToolCallDetails = styled.div<{ isExpanded: boolean }>`
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e5e7eb;
  display: ${({ isExpanded }) => (isExpanded ? "block" : "none")};
  font-size: 10px;
`;

const ToolCallSection = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ToolCallLabel = styled.div`
  font-size: 10px;
  font-weight: 400;
  color: #9ca3af;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ToolCallContent = styled.pre`
  background: #f9fafb;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
  color: #6b7280;
  border: 1px solid #e5e7eb;
`;

const ChevronIcon = styled.span<{ isExpanded: boolean }>`
  transform: rotate(${({ isExpanded }) => (isExpanded ? "0deg" : "-90deg")});
  transition: transform 0.2s ease;
  display: inline-flex;
  align-items: center;
  color: #9ca3af;
  margin-left: 4px;
`;

const formatToolCallResult = (result: ToolCall["result"]): string => {
  if (!result) return "No result";

  if (typeof result === "object" && result !== null && "error" in result) {
    return String(result.error);
  }

  if (typeof result === "object" && result !== null && "content" in result) {
    return String(result.content);
  }

  if (typeof result === "object" && result !== null && "data" in result) {
    return JSON.stringify(result.data, null, 2);
  }

  return JSON.stringify(result, null, 2);
};

const InlineToolCall = ({ toolCall }: { toolCall: ToolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <ToolCallInline status={toolCall.status} onClick={handleToggle}>
      <ToolCallHeader>
        <ToolCallName>
          <ToolIcon /> {toolCall.name}
        </ToolCallName>
        <ChevronIcon isExpanded={isExpanded}>
          {isExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        </ChevronIcon>
      </ToolCallHeader>

      <ToolCallDetails isExpanded={isExpanded}>
        {Object.keys(toolCall.arguments).length > 0 && (
          <ToolCallSection>
            <ToolCallLabel>Arguments</ToolCallLabel>
            <ToolCallContent>
              {JSON.stringify(toolCall.arguments, null, 2)}
            </ToolCallContent>
          </ToolCallSection>
        )}

        {toolCall.result && (
          <ToolCallSection>
            <ToolCallLabel>Result</ToolCallLabel>
            <ToolCallContent>
              {formatToolCallResult(toolCall.result)}
            </ToolCallContent>
          </ToolCallSection>
        )}
      </ToolCallDetails>
    </ToolCallInline>
  );
};

export const InlineMessageContent = ({
  segments,
  isUser,
}: InlineMessageContentProps) => {
  const renderSegment = (segment: ContentSegment, index: number) => {
    if (segment.type === "text") {
      if (isUser) {
        return <span key={index}>{segment.content}</span>;
      }
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {cleanThinkingTags(segment.content)}
        </ReactMarkdown>
      );
    }
    if (segment.type === "tool-call" && segment.toolCall) {
      return <InlineToolCall key={index} toolCall={segment.toolCall} />;
    }
    return null;
  };

  return (
    <MessageContent>
      {segments.map((segment, index) => renderSegment(segment, index))}
    </MessageContent>
  );
};

export default InlineMessageContent;
