import type React from "react";

/**
 * Props for the FindIcon component
 */
export interface FindIconProps {
  /** Width of the icon */
  width?: number | string;
  /** Height of the icon */
  height?: number | string;
  /** Color of the icon */
  color?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Find icon component for the find tool
 * Represents file/directory search functionality
 */
export const FindIcon: React.FC<FindIconProps> = ({
  width = 16,
  height = 16,
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
      <title>Find files and directories</title>
      {/* Magnifying glass circle */}
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />

      {/* Magnifying glass handle */}
      <path
        d="m21 21-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* File/folder representation inside the magnifying glass */}
      <path
        d="M8 9h6M8 11h4M8 13h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Optional: Small folder icon in the corner */}
      <path
        d="M6 7.5h2.5L9 6.5h3.5c.5 0 1 .5 1 1v1"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};
