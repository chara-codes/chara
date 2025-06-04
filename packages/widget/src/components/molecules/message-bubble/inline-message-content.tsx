import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import styled from 'styled-components';
import { ChevronDown, ChevronRight, Settings, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ToolCall } from '../../../store/types';

interface ContentSegment {
  type: 'text' | 'tool-call';
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
  display: inline-block;
  margin: 4px 0;
  padding: 8px 12px;
  background: ${({ status }) => {
    switch (status) {
      case 'pending': return '#f3f4f6';
      case 'in-progress': return '#fef3c7';
      case 'success': return '#d1fae5';
      case 'error': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};
  border: 1px solid ${({ status }) => {
    switch (status) {
      case 'pending': return '#d1d5db';
      case 'in-progress': return '#f59e0b';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#d1d5db';
    }
  }};
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 100%;
  box-sizing: border-box;

  &:hover {
    background: ${({ status }) => {
      switch (status) {
        case 'pending': return '#e5e7eb';
        case 'in-progress': return '#fbbf24';
        case 'success': return '#a7f3d0';
        case 'error': return '#fca5a5';
        default: return '#e5e7eb';
      }
    }};
  }
`;

const ToolCallHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const ToolCallIcon = styled.div<{ status: string }>`
  color: ${({ status }) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'in-progress': return '#f59e0b';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  display: flex;
  align-items: center;
`;

const ToolCallName = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ToolCallStatus = styled.span<{ status: string }>`
  font-size: 0.75rem;
  color: ${({ status }) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'in-progress': return '#d97706';
      case 'success': return '#059669';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  }};
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const ToolCallDetails = styled.div<{ isExpanded: boolean }>`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: ${({ isExpanded }) => isExpanded ? 'block' : 'none'};
`;

const ToolCallSection = styled.div`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ToolCallLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ToolCallContent = styled.pre`
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const ChevronIcon = styled.div<{ isExpanded: boolean }>`
  transform: rotate(${({ isExpanded }) => isExpanded ? '0deg' : '-90deg'});
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
`;

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock size={14} />;
    case 'in-progress':
      return <Clock size={14} />;
    case 'success':
      return <CheckCircle size={14} />;
    case 'error':
      return <XCircle size={14} />;
    default:
      return <Settings size={14} />;
  }
};

const formatToolCallResult = (result: ToolCall['result']): string => {
  if (!result) return "No result";
  
  if (typeof result === 'object' && result !== null && 'error' in result) {
    return String(result.error);
  }
  
  if (typeof result === 'object' && result !== null && 'content' in result) {
    return String(result.content);
  }
  
  if (typeof result === 'object' && result !== null && 'data' in result) {
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
        <ToolCallIcon status={toolCall.status}>
          {getStatusIcon(toolCall.status)}
        </ToolCallIcon>
        <ToolCallName>{toolCall.name}</ToolCallName>
        <ToolCallStatus status={toolCall.status}>
          {toolCall.status}
        </ToolCallStatus>
        <ChevronIcon isExpanded={isExpanded}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
  isUser 
}: InlineMessageContentProps) => {
  const renderSegment = (segment: ContentSegment, index: number) => {
    if (segment.type === 'text') {
      if (isUser) {
        return <span key={index}>{segment.content}</span>;
      }
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {segment.content}
        </ReactMarkdown>
      );
    }
    if (segment.type === 'tool-call' && segment.toolCall) {
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