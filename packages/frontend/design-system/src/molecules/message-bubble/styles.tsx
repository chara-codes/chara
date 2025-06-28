import styled from "styled-components";
import { theme, Theme } from "../../theme";
import { ThinkingIcon } from "../../atoms/icons/thinking-icon";
import { ExpandableChevronIcon } from "../../atoms/icons/expandable-chevron-icon";
import { CloseIcon } from "../../atoms/icons/close-icon";

// Main container styles
export const BubbleContainer = styled.div<{ isUser: boolean; theme: Theme }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const Bubble = styled.div<{ $isUser: boolean; theme: Theme }>`
  position: relative;
  max-width: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  color: ${({ theme }) => theme.colors.text};
  background-color: ${(props) =>
    props.$isUser
      ? props.theme.colors.background
      : props.theme.colors.backgroundSecondary};
  box-shadow: ${(props) =>
    props.$isUser ? props.theme.shadows.sm : "0 1px 2px rgba(0, 0, 0, 0.05)"};
  border: ${(props) =>
    props.$isUser ? `1px solid ${props.theme.colors.border}` : "none"};
`;

export const DeleteButton = styled.button<{ theme: Theme }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.6;
  transition: all ${({ theme }) => theme.transitions.fast} ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.highlight};
    color: ${({ theme }) => theme.colors.error};
    opacity: 1;
  }

  &:focus {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus}
      ${({ theme }) => theme.colors.errorLight};
  }
`;

export const MessageContent = styled.div<{ theme: Theme }>`
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
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
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
    color: ${({ theme }) => theme.colors.info};
    text-decoration: underline;
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  /* Inline code styling */
  code:not(pre code) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    background-color: ${({ theme }) => theme.colors.highlight};
    color: ${({ theme }) => theme.colors.error};
    padding: 0.2em 0.4em;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    white-space: pre-wrap;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  /* Code block container styling */
  pre {
    background-color: ${({ theme }) => theme.colors.highlight} !important;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    padding: ${({ theme }) => theme.spacing.md};
    margin: ${({ theme }) => theme.spacing.sm} 0;
    overflow-x: auto;
    white-space: pre;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    line-height: 1.45;

    /* Custom scrollbar for code blocks */
    &::-webkit-scrollbar {
      height: ${({ theme }) => theme.spacing.sm};
    }
    &::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.colors.backgroundSecondary};
      border-radius: ${({ theme }) => theme.borderRadius.sm};
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.border};
      border-radius: ${({ theme }) => theme.borderRadius.sm};
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${({ theme }) => theme.colors.borderHover};
    }
  }

  /* Code inside pre blocks */
  pre code {
    background-color: transparent !important;
    color: inherit !important;
    padding: 0;
    font-size: inherit;
    white-space: inherit;
    border: none;
    border-radius: 0;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
  }

  /* Highlight.js specific overrides */
  .hljs {
    background: ${({ theme }) => theme.colors.highlight} !important;
    padding: 0 !important;
  }

  blockquote {
    border-left: 4px solid ${({ theme }) => theme.colors.border};
    padding-left: 1em;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 0.8em;
    color: ${({ theme }) => theme.colors.textSecondary};
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
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 0.5em 0.75em;
    text-align: left;
  }
  th {
    background-color: ${({ theme }) => theme.colors.highlight};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
  thead {
    border-bottom: 2px solid ${({ theme }) => theme.colors.borderHover};
  }
`;

export const Time = styled.div<{ theme: Theme }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const ContextContainer = styled.div<{ isUser: boolean; theme: Theme }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid
    ${(props) =>
      props.isUser ? props.theme.colors.border : props.theme.colors.border};
  position: relative;
`;

export const ContextLabel = styled.div<{ isUser: boolean; theme: Theme }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-right: 6px;
  display: flex;
  align-items: center;
`;

export const ContextItemWrapper = styled.div`
  position: relative;
`;

export const ContextItemComponent = styled.div<{
  isUser: boolean;
  theme: Theme;
}>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${(props) =>
    props.isUser
      ? props.theme.colors.backgroundSecondary
      : props.theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:hover {
    background-color: ${(props) =>
      props.isUser
        ? props.theme.colors.highlight
        : props.theme.colors.borderHover};
  }
`;

// New styled components for the inline context details
export const ContextDetailsPanel = styled.div<{ theme: Theme }>`
  margin-top: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
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

export const ContextDetailHeader = styled.div<{ theme: Theme }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.highlight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ContextDetailTitle = styled.div<{ theme: Theme }>`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ContextDetailType = styled.span<{ theme: Theme }>`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: normal;
  background-color: ${({ theme }) => theme.colors.border};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-transform: capitalize;
`;

export const ContextDetailContent = styled.div<{ theme: Theme }>`
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;

  code,
  pre {
    font-family: monospace;
    background-color: ${({ theme }) => theme.colors.border};
    padding: 2px ${({ theme }) => theme.spacing.xs};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }

  pre {
    padding: ${({ theme }) => theme.spacing.sm};
    overflow-x: auto;
    margin: ${({ theme }) => theme.spacing.sm} 0;
  }

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const CloseButton = styled.button<{ theme: Theme }>`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus}
      ${({ theme }) => theme.colors.primaryLight};
  }
`;

// Thinking section styles
export const ThinkingContainer = styled.div<{
  isExpanded: boolean;
  theme: Theme;
}>`
  margin-top: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  transition: all ${({ theme }) => theme.transitions.normal} ease;
`;

export const ThinkingHeader = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  user-select: none;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  transition: all ${({ theme }) => theme.transitions.fast} ease;
`;

export const ThinkingLabel = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
`;

export const ThinkingToggle = styled.button<{ theme: Theme }>`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast} ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus {
    outline: none;
  }

  svg {
    transition: transform ${({ theme }) => theme.transitions.normal} ease;
  }
`;

export const ThinkingContent = styled.div<{
  isExpanded: boolean;
  theme: Theme;
}>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: pre-wrap;
  word-break: break-word;
  max-height: ${(props) => (props.isExpanded ? "400px" : "0")};
  overflow-y: ${(props) => (props.isExpanded ? "auto" : "hidden")};
  transition: all ${({ theme }) => theme.transitions.normal}
    cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  margin-top: ${({ theme }) => theme.spacing.xs};
  scroll-behavior: smooth;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: ${({ theme }) => theme.spacing.xs};
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderHover};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }

  &:not(:last-child) {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }

  ${(props) =>
    !props.isExpanded &&
    `
    padding: 0;
    margin: 0;
  `}
`;

// Export the imported icons for backward compatibility
export { ThinkingIcon, ExpandableChevronIcon as ChevronIconSVG, CloseIcon };

export const ToolCallToggle = styled.button<{ theme: Theme }>`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast} ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus {
    outline: none;
  }

  svg {
    transition: transform ${({ theme }) => theme.transitions.normal} ease;
  }
`;

// Instruction section styles
export const InstructionSection = styled.div<{ theme: Theme }>`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const InstructionHeader = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const InstructionList = styled.div<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const InstructionItem = styled.div<{ theme: Theme }>`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: monospace;
`;

export const TabsContainer = styled.div<{ theme: Theme }>`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const Tab = styled.button<{ $active: boolean; theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? props.theme.colors.primary : "transparent")};
  color: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : props.theme.colors.textSecondary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast} ease;

  &:hover {
    color: ${(props) =>
      props.$active ? props.theme.colors.primary : props.theme.colors.text};
  }

  svg {
    color: currentColor;
  }
`;

export const TabContent = styled.div<{ theme: Theme }>`
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

// Tool call styles
export const ToolCallsContainer = styled.div<{ theme: Theme }>`
  margin: 0;
  padding: 0;
  transition: all ${({ theme }) => theme.transitions.normal} ease;
`;

export const ToolCallItem = styled.div<{ isExpanded: boolean; theme: Theme }>`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.transitions.normal} ease;
`;

export const ToolCallHeader = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  user-select: none;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  transition: all ${({ theme }) => theme.transitions.fast} ease;
`;

export const ToolCallItemHeader = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding: 2px 0;
`;

export const ToolCallName = styled.div<{ theme: Theme }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: monospace;
`;

export const ToolCallStatus = styled.span<{ status: string; theme: Theme }>`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  text-transform: capitalize;
  color: ${(props) => {
    switch (props.status) {
      case "success":
        return props.theme.colors.success;
      case "error":
        return props.theme.colors.error;
      case "in-progress":
        return props.theme.colors.warning;
      case "pending":
        return props.theme.colors.textSecondary;
      default:
        return props.theme.colors.textSecondary;
    }
  }};
  background-color: ${(props) => {
    switch (props.status) {
      case "success":
        return "#d1fae5";
      case "error":
        return props.theme.colors.errorLight;
      case "in-progress":
        return "#fef3c7";
      case "pending":
        return props.theme.colors.highlight;
      default:
        return props.theme.colors.highlight;
    }
  }};
`;

export const ToolCallContent = styled.div<{
  isExpanded: boolean;
  theme: Theme;
}>`
  max-height: ${(props) => (props.isExpanded ? "400px" : "0")};
  overflow-y: ${(props) => (props.isExpanded ? "auto" : "hidden")};
  transition: all ${({ theme }) => theme.transitions.normal}
    cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${(props) =>
    props.isExpanded ? `${props.theme.spacing.sm} 0` : "0"};
  margin-top: ${({ theme }) => theme.spacing.xs};

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: ${({ theme }) => theme.spacing.xs};
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.borderHover};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const ToolCallArguments = styled.div<{ theme: Theme }>`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const ToolCallArgumentsLabel = styled.div<{ theme: Theme }>`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

export const ToolCallArgumentsContent = styled.pre<{ theme: Theme }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-family: monospace;
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ToolCallResult = styled.div<{ theme: Theme }>`
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const ToolCallResultLabel = styled.div<{ theme: Theme }>`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

export const ToolCallResultContent = styled.div<{
  hasError?: boolean;
  theme: Theme;
}>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${(props) =>
    props.hasError
      ? props.theme.colors.error
      : props.theme.colors.textSecondary};
  background-color: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ${(props) => (props.hasError ? "inherit" : "monospace")};
`;
