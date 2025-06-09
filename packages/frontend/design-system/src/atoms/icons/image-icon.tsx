import type React from "react"

export interface ImageIconProps {
  width?: number
  height?: number
  color?: string
  className?: string
}

/**
 * ImageIcon component
 *
 * @param {number} width - The width of the icon
 * @param {number} height - The height of the icon
 * @param {string} color - The color of the icon
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
export const ImageIcon: React.FC<ImageIconProps> = ({
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
        d="M2.25 15.75L5.25 12.75L7.5 15L11.25 11.25L15 15M4.5 19.5H19.5C20.3284 19.5 21 18.8284 21 18V6C21 5.17157 20.3284 4.5 19.5 4.5H4.5C3.67157 4.5 3 5.17157 3 6V18C3 18.8284 3.67157 19.5 4.5 19.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
