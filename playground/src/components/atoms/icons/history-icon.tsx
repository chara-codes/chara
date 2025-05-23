import type React from "react"

/**
 * History/Clock icon component
 * Used for history-related actions and navigation
 */
export interface HistoryIconProps {
  size?: number
}

export const HistoryIcon: React.FC<HistoryIconProps> = ({ size = 24 }) => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export default HistoryIcon
