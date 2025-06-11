import type React from "react"

export interface SendIconProps {
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
 * Send icon component
 * Used for submitting messages or forms
 */
export const SendIcon: React.FC<SendIconProps> = ({ width = 24, height = 24, color = "currentColor", className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
