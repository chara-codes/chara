import type React from "react"

export interface ClipIconProps {
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
 * Clip icon component
 * Used for attachments and file uploads
 */
export const ClipIcon: React.FC<ClipIconProps> = ({ width = 24, height = 24, color = "currentColor", className }) => {
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
        d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42933 14.0991 2.00054 15.16 2.00054C16.2209 2.00054 17.2394 2.42933 17.99 3.18C18.7407 3.93067 19.1695 4.94915 19.1695 6.01C19.1695 7.07085 18.7407 8.08933 17.99 8.84L9.41 17.41C9.03464 17.7854 8.52519 17.9997 7.995 17.9997C7.46481 17.9997 6.95536 17.7854 6.58 17.41C6.20464 17.0346 5.99033 16.5252 5.99033 15.995C5.99033 15.4648 6.20464 14.9554 6.58 14.58L15.07 6.1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
