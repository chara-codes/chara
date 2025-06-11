import type React from "react"

export interface ChevronDownIconProps {
  /**
   * The width of the icon
   * @default 12
   */
  width?: number
  /**
   * The height of the icon
   * @default 12
   */
  height?: number
  /**
   * The color of the icon
   * @default "currentColor"
   */
  color?: string
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

/**
 * Chevron Down icon component
 *
 * @param props - Component props
 * @returns React component
 */
export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
  width = 12,
  height = 12,
  color = "currentColor",
  className,
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
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
