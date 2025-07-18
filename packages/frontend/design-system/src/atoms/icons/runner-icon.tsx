import type React from "react";

/**
 * Props for the RunnerIcon component
 */
export interface RunnerIconProps {
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
 * RunnerIcon component - Displays a play/runner icon
 *
 * @param props - Component props
 * @returns React component
 */
export const RunnerIcon: React.FC<RunnerIconProps> = ({
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
    <title>Runner</title>
    <polygon
      points="5,3 19,12 5,21"
      stroke={color}
      strokeWidth="2"
      fill={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
