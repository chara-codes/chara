import type React from "react"

/**
 * Props for the TerminalIcon component
 */
export interface TerminalIconProps {
  /** Width of the icon */
  width?: number | string
  /** Height of the icon */
  height?: number | string
  /** Color of the icon */
  color?: string
  /** Additional CSS class names */
  className?: string
}

/**
 * TerminalIcon component - Displays a terminal/command line icon
 *
 * @param props - Component props
 * @returns React component
 */
export const TerminalIcon: React.FC<TerminalIconProps> = ({
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
    <path d="M8 9L11 12L8 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 15H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
