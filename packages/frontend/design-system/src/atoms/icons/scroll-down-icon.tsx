import type React from "react"

export interface ScrollDownIconProps {
  /**
   * The width of the icon
   * @default 26
   */
  width?: number
  /**
   * The height of the icon
   * @default 26
   */
  height?: number
  /**
   * The color of the icon
   * @default "#c0c0c0"
   */
  color?: string
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

/**
 * Scroll Down icon component
 *
 * @param props - Component props
 * @returns React component
 */
export const ScrollDownIcon: React.FC<ScrollDownIconProps> = ({
  width = 26,
  height = 26,
  color = "#c0c0c0",
  className,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Scroll Down</title>
      <path
        d="M7 10L12 15L17 10"
        strokeWidth="2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
