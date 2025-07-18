import type React from "react";

export interface CodeIconProps {
  width?: number;
  height?: number;
  color?: string;
  style?: Record<string, string>;
  className?: string;
}

/**
 * CodeIcon component
 *
 * @param {number} width - The width of the icon
 * @param {number} height - The height of the icon
 * @param {string} color - The color of the icon
 * @param {string} className - Additional CSS classes
 * @param {string} Record<string, string> - Additional CSS styles
 * @returns {JSX.Element} - Rendered component
 */
export const CodeIcon: React.FC<CodeIconProps> = ({
  width = 24,
  height = 24,
  color = "currentColor",
  className = "",
  style = {},
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M16 18L22 12L16 6M8 6L2 12L8 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
