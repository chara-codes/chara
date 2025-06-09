import type React from "react";

export interface TrendingUpIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * TrendingUpIcon component
 *
 * @param {number} width - The width of the icon
 * @param {number} height - The height of the icon
 * @param {string} color - The color of the icon
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
export const TrendingUpIcon: React.FC<TrendingUpIconProps> = ({
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
        d="M23 6L13.5 15.5L8.5 10.5L1 18M23 6H17M23 6V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
