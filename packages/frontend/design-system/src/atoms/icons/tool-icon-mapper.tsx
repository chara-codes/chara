import type React from "react";
import { FileIcon } from "./file-icon";
import { EditIcon } from "./edit-icon";
import { MoveIcon } from "./move-icon";
import { FilesIcon } from "./files-icon";
import { SearchIcon } from "./search-icon";
import { LinkIcon } from "./link-icon";
import { TerminalIcon } from "./terminal-icon";
import { ThinkingIcon } from "./thinking-icon";
import { RunnerIcon } from "./runner-icon";
import { ExaminationIcon } from "./examination-icon";
import { ToolIcon } from "./tool-icon";
import { MkdirIcon } from "./mkdir-icon";

/**
 * Props for tool icons
 */
export interface ToolIconProps {
  /** Width of the icon */
  width?: number | string;
  /** Height of the icon */
  height?: number | string;
  /** Color of the icon */
  color?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Get the appropriate icon component for a given tool call type
 *
 * @param toolCallType - The type of tool call
 * @param props - Icon props to pass to the component
 * @returns React component for the tool icon
 */
export const getToolIcon = (
  toolCallType: string,
  props?: ToolIconProps
): React.ReactElement => {
  const width = typeof props?.width === "number" ? props.width : 16;
  const height = typeof props?.height === "number" ? props.height : 16;
  const color = props?.color ?? "currentColor";
  const className = props?.className;

  switch (toolCallType) {
    case "read-file":
      return (
        <FileIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "edit-file":
      return (
        <EditIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "move-file":
      return (
        <MoveIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "file-system":
      return (
        <FilesIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "grep":
      return (
        <SearchIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "fetch":
      return (
        <LinkIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "terminal":
      return (
        <TerminalIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "thinking":
      return (
        <ThinkingIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "runner":
      return (
        <RunnerIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "examination":
      return (
        <ExaminationIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    case "mkdir":
      return (
        <MkdirIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
    default:
      return (
        <ToolIcon
          width={width}
          height={height}
          color={color}
          className={className}
        />
      );
  }
};
