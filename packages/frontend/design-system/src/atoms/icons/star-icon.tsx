import type React from "react"

export interface StarIconProps {
  /**
   * The width of the icon
   * @default 14
   */
  width?: number
  /**
   * The height of the icon
   * @default 14
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
  /**
   * Whether the star should be filled
   * @default true
   */
  filled?: boolean
}

/**
 * Star icon component
 *
 * @param props - Component props
 * @returns React component
 */
export const StarIcon: React.FC<StarIconProps> = ({
  width = 14,
  height = 14,
  color = "currentColor",
  className,
  filled = true,
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
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={filled ? color : "none"}
        stroke={filled ? "none" : color}
        strokeWidth={filled ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
