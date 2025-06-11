import type React from "react"

export interface SearchIconProps {
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
}

/**
 * Search icon component
 *
 * @param props - Component props
 * @returns React component
 */
export const SearchIcon: React.FC<SearchIconProps> = ({
  width = 14,
  height = 14,
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
      <path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
