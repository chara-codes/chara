import type React from "react";

/**
 * Props for the MoveIcon component
 */
export interface MoveIconProps {
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
 * MoveIcon component - Displays a move/transfer icon
 *
 * @param props - Component props
 * @returns React component
 */
export const MoveIcon: React.FC<MoveIconProps> = ({
  width = 12,
  height = 12,
  color = "currentColor",
  className,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <title>Move</title>
    <path
      d="M21 12H3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 9L21 12L18 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 9L3 12L6 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
