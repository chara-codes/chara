import type React from "react"

export interface ThinkingIconProps {
  /**
   * The width of the icon
   * @default 12
   */
  width?: number
  /**
   * The height of the icon
   * @default 12
   */
  height?: number
  /**
   * The color of the icon
   * @default "currentColor"
   */
  color?: string
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

/**
 * Thinking icon component - represents an idea or thought process
 *
 * @param props - Component props
 * @returns React component
 */
export const ThinkingIcon: React.FC<ThinkingIconProps> = ({
  width = 12,
  height = 12,
  color = "currentColor",
  className,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Idea indicator"
      className={className}
    >
      <title>Idea indicator</title>
      <path d="M9 21h6" />
      <path d="M12 21v-3" />
      <path d="M12 3a6 6 0 0 0-6 6c0 1.8.8 3.4 2 4.5V17h8v-3.5c1.2-1.1 2-2.7 2-4.5a6 6 0 0 0-6-6z" />
      <path d="M8 17h8" />
    </svg>
  )
}
