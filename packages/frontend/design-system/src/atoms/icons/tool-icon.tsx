import type React from "react";

/**
 * Props for the ToolIcon component
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
 * ToolIcon component - Displays a general tool icon as default fallback
 *
 * @param props - Component props
 * @returns React component
 */
export const ToolIcon: React.FC<ToolIconProps> = ({
  width = 12,
  height = 12,
  color = "currentColor",
  className,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 17 17"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    className={className}
  >
    <title>Tool</title>
    <path
      d="M9 4h5.625l-3.609-4h-7.016v4h4v3.723h-1.125v9.277h3.25v-9.277h-1.125v-3.723zM5 1h5.571l1.805 2h-7.376v-2zM9.125 16h-1.25v-7.277h1.25v7.277z"
      fill={color}
    />
  </svg>
);
