import type React from "react"

export interface StopIconProps {
  /** Width of the icon */
  width?: number | string
  /** Height of the icon */
  height?: number | string
  /** Color of the icon */
  color?: string
  /** Additional class names */
  className?: string
}

/**
 * Stop icon component
 * Used for stopping processes or canceling actions
 */
export const StopIcon: React.FC<StopIconProps> = ({ width = 24, height = 24, color = "currentColor", className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
