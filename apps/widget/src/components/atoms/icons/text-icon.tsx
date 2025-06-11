import type React from "react"

/**
 * Props for the TextIcon component
 */
export interface TextIconProps {
  /** Width of the icon */
  width?: number | string
  /** Height of the icon */
  height?: number | string
  /** Color of the icon */
  color?: string
  /** Additional CSS class names */
  className?: string
}

/**
 * TextIcon component - Displays a text document icon
 *
 * @param props - Component props
 * @returns React component
 */
export const TextIcon: React.FC<TextIconProps> = ({ width = 12, height = 12, color = "currentColor", className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 13H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 9H9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
