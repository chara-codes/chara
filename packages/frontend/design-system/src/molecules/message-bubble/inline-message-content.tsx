import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import styled from "styled-components";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ToolIcon } from "./icons";
import { cleanThinkingTags, type ToolCall } from "@chara/core";
import WriteFileBlock from "../write-file-block";
import EditFileBlock, { type EditOperation } from "../edit-file-block";

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
  const isWriteFileTool =
    toolCall.name === "write-file" || toolCall.name === "write_file";

  // Check if this is an edit-file tool call
  const isEditFileTool =
    toolCall.name === "edit-file" || toolCall.name === "edit_file";

  // Handle write-file tool calls
  if (isWriteFileTool) {
    const filePath = String(
      toolCall.arguments?.path ||
        toolCall.arguments?.file_path ||
        toolCall.arguments?.filePath ||
        "Unknown file",
    );

    // Determine if the file is currently being generated based on tool call status
    const isGenerating =
      toolCall.status === "pending" || toolCall.status === "in-progress";

    // Fallback to generic tool display if we don't have essential file data
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

    // Extract content from tool call arguments or result
    let content = "";

    // Handle streaming/partial content for real-time display during generation
    if (
      toolCall.arguments?.content &&
      typeof toolCall.arguments.content === "string"
    ) {
      content = toolCall.arguments.content;
    } else if (
      toolCall.result?.content &&
      typeof toolCall.result.content === "string"
    ) {
      content = toolCall.result.content;
    } else if (typeof toolCall.result === "string") {
      content = toolCall.result;
    }

    // Ensure content is always a string
    const displayContent = content || "";

    return (
      <WriteFileBlock
        filePath={filePath}
        content={displayContent}
        isGenerating={isGenerating}
        isVisible={true}
        streamingSpeed={isGenerating ? 20 : 0}
        showLineNumbers={true}
        maxHeight={400}
      />
    );
  }

  // Handle edit-file tool calls
  if (isEditFileTool) {
    const filePath = String(
      toolCall.arguments?.path ||
        toolCall.arguments?.file_path ||
        toolCall.arguments?.filePath ||
        "Unknown file",
    );

    // Determine if the file is currently being edited based on tool call status
    const isGenerating =
      toolCall.status === "pending" || toolCall.status === "in-progress";

    // Extract tool call error if present
    const toolCallError =
      toolCall.result &&
      typeof toolCall.result === "object" &&
      "error" in toolCall.result
        ? String(toolCall.result.error)
        : undefined;

    // Fallback to generic tool display if we don't have essential file data
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
                Invalid edit-file tool call: missing file path
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

    // Extract edit operations from tool call arguments
    const edits = Array.isArray(toolCall.arguments?.edits)
      ? toolCall.arguments.edits
      : [];
    const processedEdits = edits.map(
      (
        edit: { oldText?: string; newText?: string },
        index: number,
      ): EditOperation => ({
        oldText: edit.oldText || "",
        newText: edit.newText || "",
        status:
          toolCall.status === "success"
            ? "complete"
            : toolCall.status === "error"
              ? "error"
              : isGenerating
                ? "applying"
                : "pending",
      }),
    );

    return (
      <EditFileBlock
        filePath={filePath}
        edits={processedEdits}
        isGenerating={isGenerating}
        isVisible={true}
        showLineNumbers={true}
        maxHeight={400}
        toolCallError={toolCallError}
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
