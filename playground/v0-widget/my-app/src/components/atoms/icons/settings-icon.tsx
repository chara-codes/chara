import type React from "react"

/**
 * Settings/Gear icon component
 * Used for configuration and preferences
 */
export interface SettingsIconProps {
  size?: number
}

export const SettingsIcon: React.FC<SettingsIconProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="5" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="19" cy="12" r="2" fill="currentColor" />
  </svg>
)

export default SettingsIcon
