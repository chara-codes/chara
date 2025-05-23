import type React from "react"

export interface LightbulbIconProps {
  width?: number
  height?: number
  color?: string
  className?: string
}

/**
 * LightbulbIcon component
 *
 * @param {number} width - The width of the icon
 * @param {number} height - The height of the icon
 * @param {string} color - The color of the icon
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
export const LightbulbIcon: React.FC<LightbulbIconProps> = ({
  width = 24,
  height = 24,
  color = "currentColor",
  className = "",
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
      <path
        d="M9.66347 17H14.3364M11.9999 3V4M18.3639 5.63604L17.6568 6.34315M21 11.9999H20M4 11.9999H3M6.34309 6.34315L5.63599 5.63604M8.46441 15.5356C6.51179 13.5829 6.51179 10.4171 8.46441 8.46449C10.417 6.51187 13.5829 6.51187 15.5355 8.46449C17.4881 10.4171 17.4881 13.5829 15.5355 15.5356L14.9884 16.0827C14.3555 16.7155 13.9999 17.5739 13.9999 18.469V19C13.9999 20.1046 13.1045 21 11.9999 21C10.8954 21 9.99995 20.1046 9.99995 19V18.469C9.99995 17.5739 9.6444 16.7155 9.01151 16.0827L8.46441 15.5356Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
