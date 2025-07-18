import type React from "react"

export interface ExpandableChevronIconProps {
  /**
   * Whether the chevron is in expanded state
   */
  isExpanded: boolean
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
   * Aria label for accessibility
   */
  ariaLabel?: string
}

/**
 * Expandable Chevron icon component - rotates based on expanded state
 *
 * @param props - Component props
 * @returns React component
 */
export const ExpandableChevronIcon: React.FC<ExpandableChevronIconProps> = ({
  isExpanded,
  width = 14,
  height = 14,
  color = "currentColor",
  className,
  ariaLabel,
}) => {
  const defaultAriaLabel = isExpanded ? "Collapse section" : "Expand section"

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={ariaLabel || defaultAriaLabel}
      className={className}
      style={{
        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <title>{ariaLabel || defaultAriaLabel}</title>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
