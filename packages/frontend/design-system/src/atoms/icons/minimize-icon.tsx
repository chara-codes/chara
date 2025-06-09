import type React from "react"

/**
 * Minimize icon component
 * Used for minimizing windows, panels, or UI elements
 */
export interface MinimizeIconProps {
  size?: number
}

export const MinimizeIcon: React.FC<MinimizeIconProps> = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

export default MinimizeIcon
