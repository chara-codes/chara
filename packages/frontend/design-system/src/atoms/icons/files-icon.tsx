import type React from "react";

/**
 * Props for the FilesIcon component
 */
export interface FilesIconProps {
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
 * FilesIcon component - Displays a folder/files icon
 *
 * @param props - Component props
 * @returns React component
 */
export const FilesIcon: React.FC<FilesIconProps> = ({
  width = 12,
  height = 12,
  color = "currentColor",
  className,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <title>Files</title>
    <path
      d="M20 6H12L10 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V8C22 6.89 21.11 6 20 6Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
