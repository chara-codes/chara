import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import styled from "styled-components";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ToolIcon } from "./icons";
import { cleanThinkingTags, type ToolCall } from "@chara/core";
import WriteFileBlock from "../write-file-block";

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

  // Check if this is a write-file tool call
  // Supports common variations: write-file, write_file, edit-file, edit_file
  const isWriteFileTool =
    toolCall.name === "write-file" ||
    toolCall.name === "write_file" ||
    toolCall.name === "edit-file" ||
    toolCall.name === "edit_file";

  // For write-file tools, render the WriteFileBlock component instead of generic tool display
  // This provides a better visual representation with syntax highlighting, line numbers,
  // and streaming animation for file generation
  if (isWriteFileTool) {
    const filePath =
      toolCall.arguments?.path ||
      toolCall.arguments?.file_path ||
      toolCall.arguments?.filePath ||
      "Unknown file";

    // Extract content from tool call arguments or result
    // Content can be provided in multiple ways depending on the tool implementation:
    // 1. toolCall.arguments.content - content passed as argument
    // 2. toolCall.result.content - content returned as result
    // 3. toolCall.result (string) - result is the content itself
    let content = "";
    let streamingContent = "";

    // Handle streaming/partial content for real-time display during generation
    if (toolCall.arguments?.content) {
      content = toolCall.arguments.content;
    } else if (toolCall.result?.content) {
      content = toolCall.result.content;
    } else if (typeof toolCall.result === "string") {
      content = toolCall.result;
    }

    // Check for streaming content updates (for real-time file generation display)
    // This allows the UI to show content as it's being generated character by character
    if (toolCall.streamingContent) {
      streamingContent = toolCall.streamingContent;
    } else if (toolCall.partialContent) {
      streamingContent = toolCall.partialContent;
    }

    // Use streaming content if available (during generation), otherwise use final content
    const displayContent = streamingContent || content;

    // Determine if the file is currently being generated based on tool call status
    // This controls the streaming animation and progress indicators
    const isGenerating =
      toolCall.status === "running" ||
      toolCall.status === "pending" ||
      toolCall.status === "in_progress" ||
      toolCall.status === "streaming";

    // Fallback to generic tool display if we don't have essential file data
    // This ensures we still show something useful even with malformed tool calls
    if (!filePath || filePath === "Unknown file") {
      return (
        <ToolCallInline status={toolCall.status} onClick={handleToggle}>
          <ToolCallHeader>
            <ToolCallName>
              <ToolIcon /> {toolCall.name}
            </ToolCallName>
            <ChevronIcon isExpanded={isExpanded}>
              {isExpanded ? (
                <ChevronDown size={8} />
              ) : (
                <ChevronRight size={8} />
              )}
            </ChevronIcon>
          </ToolCallHeader>

          <ToolCallDetails isExpanded={isExpanded}>
            <ToolCallSection>
              <ToolCallLabel>Error</ToolCallLabel>
              <ToolCallContent>
                Invalid write-file tool call: missing file path
              </ToolCallContent>
            </ToolCallSection>
            {Object.keys(toolCall.arguments).length > 0 && (
              <ToolCallSection>
                <ToolCallLabel>Arguments</ToolCallLabel>
                <ToolCallContent>
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </ToolCallContent>
              </ToolCallSection>
            )}
          </ToolCallDetails>
        </ToolCallInline>
      );
    }

    // Render the WriteFileBlock component with streaming support
    // This provides a rich code display with syntax highlighting, line numbers,
    // generation progress, and real-time streaming animation
    return (
      <WriteFileBlock
        filePath={filePath}
        content={displayContent}
        isGenerating={isGenerating}
        isVisible={true}
        streamingSpeed={isGenerating ? 20 : 0} // 20ms between characters for smooth streaming
        onClose={() => {}} // No-op close handler in inline context
        showLineNumbers={true} // Always show line numbers for code files
        maxHeight={400} // Slightly smaller height for inline display
      />
    );
  }

  // Default tool call rendering for non-write-file tools
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
