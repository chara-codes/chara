import type React from "react"

export interface PlusIconProps {
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
 * Plus icon component
 * Used for adding or creating new items
 */
export const PlusIcon: React.FC<PlusIconProps> = ({ width = 24, height = 24, color = "currentColor", className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 4V20M4 12H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
