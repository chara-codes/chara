import styled from "styled-components";

// Main container styles
export const BubbleContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  margin-bottom: 16px;
  width: 100%;
`;

export const Bubble = styled.div<{ isUser: boolean }>`
  position: relative;
  max-width: 100%;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  background-color: ${(props) => (props.isUser ? "#ffffff" : "#f3f4f6")};
  box-shadow: ${(props) =>
    props.isUser
      ? "0 2px 4px rgba(0, 0, 0, 0.05)"
      : "0 1px 2px rgba(0, 0, 0, 0.05)"};
  border: ${(props) => (props.isUser ? "1px solid #e5e7eb" : "none")};
`;

export const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  opacity: 0.6;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
    opacity: 1;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
`;

export const MessageContent = styled.div`
  white-space: pre-wrap; /* Preserves line breaks for plain text and Markdown <pre> tags */
  word-break: break-word;
  margin-right: 24px; /* To avoid overlapping with delete button if present */

  /* Basic styling for Markdown elements.
     You might want to expand this or use Tailwind classes via ReactMarkdown's components prop. */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0.8em;
    margin-bottom: 0.4em;
    line-height: 1.3;
  }
  h1 {
    font-size: 1.5em;
    font-weight: 600;
  }
  h2 {
    font-size: 1.3em;
    font-weight: 600;
  }
  h3 {
    font-size: 1.15em;
    font-weight: 600;
  }

  p {
    margin-bottom: 0.8em;
    white-space: normal; /* Allow normal wrapping for paragraphs from Markdown */
  }

  ul,
  ol {
    margin-left: 1.5em;
    margin-bottom: 0.8em;
    white-space: normal; /* Allow normal wrapping for lists */
  }
  li {
    margin-bottom: 0.2em;
  }

  a {
    color: #3b82f6; /* Example blue link color */
    text-decoration: underline;
    &:hover {
      color: #2563eb;
    }
  }

  code {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    background-color: #e5e7eb; /* Light gray background for inline code */
    padding: 0.2em 0.4em;
    font-size: 0.875em;
    border-radius: 4px;
    white-space: pre-wrap; /* Wrap inline code if it's too long */
  }

  pre {
    background-color: #1f2937; /* Dark background for code blocks */
    color: #d1d5db; /* Light text for code blocks */
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto; /* Allow horizontal scrolling for long lines */
    margin-bottom: 0.8em;
    white-space: pre; /* Preserve all whitespace within <pre> */
  }
  pre code {
    background-color: transparent; /* Reset background for <code> inside <pre> */
    padding: 0;
    font-size: 0.875em; /* Ensure consistent font size */
    white-space: inherit; /* Inherit pre's whitespace handling */
  }

  blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1em;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 0.8em;
    color: #4b5563;
    font-style: italic;
    white-space: normal;
  }

  table {
    width: auto; /* Or 100% if you want full width tables */
    border-collapse: collapse;
    margin-bottom: 1em;
    white-space: normal;
  }
  th,
  td {
    border: 1px solid #d1d5db;
    padding: 0.5em 0.75em;
    text-align: left;
  }
  th {
    background-color: #f3f4f6;
    font-weight: 600;
  }
  thead {
    border-bottom: 2px solid #c7c9cc;
  }
`;

export const Time = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

export const ContextContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${(props) => (props.isUser ? "#e5e7eb" : "#e2e4e9")};
  position: relative;
`;

export const ContextLabel = styled.div<{ isUser: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-right: 6px;
  display: flex;
  align-items: center;
`;

export const ContextItemWrapper = styled.div`
  position: relative;
`;

export const ContextItemComponent = styled.div<{ isUser: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.isUser ? "#f9fafb" : "#e5e7eb")};
  color: #4b5563;
  cursor: pointer;

  svg {
    color: #6b7280;
  }

  &:hover {
    background-color: ${(props) => (props.isUser ? "#f3f4f6" : "#d1d5db")};
  }
`;

// New styled components for the inline context details
export const ContextDetailsPanel = styled.div`
  margin-top: 8px;
  width: 100%;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ContextDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

export const ContextDetailTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ContextDetailType = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: normal;
  background-color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: capitalize;
`;

export const ContextDetailContent = styled.div`
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;

  code,
  pre {
    font-family: monospace;
    background-color: #e5e7eb;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
  }

  pre {
    padding: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }

  strong {
    color: #374151;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #e5e7eb;
    color: #4b5563;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

export const CloseIcon = styled.svg.attrs({
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
})`
  & > line:first-child {
    x1: 18;
    y1: 6;
    x2: 6;
    y2: 18;
  }
  & > line:last-child {
    x1: 6;
    y1: 6;
    x2: 18;
    y2: 18;
  }
`;

// Instruction section styles
export const InstructionSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

export const InstructionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;

  svg {
    color: #6b7280;
  }
`;

export const InstructionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const InstructionItem = styled.div`
  font-size: 13px;
  color: #4b5563;
  padding: 4px 8px;
  background-color: #f9fafb;
  border-radius: 4px;
  font-family: monospace;
`;

export const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
`;

export const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#6366f1" : "transparent")};
  color: ${(props) => (props.$active ? "#4f46e5" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${(props) => (props.$active ? "#4f46e5" : "#4b5563")};
  }

  svg {
    color: currentColor;
  }
`;

export const TabContent = styled.div`
  padding: 4px 0;
`;
