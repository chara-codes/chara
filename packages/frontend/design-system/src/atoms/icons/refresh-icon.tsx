import type React from "react";

/**
 * Props for the RefreshIcon component
 */
export interface RefreshIconProps {
  /** Width of the icon */
  width?: number | string;
  /** Height of the icon */
  height?: number | string;
  /** Color of the icon */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RefreshIcon component
 *
 * Renders a refresh icon SVG
 */
export const RefreshIcon: React.FC<RefreshIconProps> = ({
  width = 16,
  height = 16,
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
      <title>Refresh</title>
      <path
        d="M1 4V10H7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 20V14H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.49 9C19.9828 7.56678 19.1209 6.28392 17.9845 5.27493C16.8482 4.26595 15.4745 3.56632 13.9917 3.24459C12.5089 2.92285 10.9652 2.99267 9.52421 3.44782C8.08323 3.90297 6.78385 4.72893 5.75 5.84L1 10M23 14L18.25 18.16C17.2162 19.2711 15.9168 20.097 14.4758 20.5522C13.0348 21.0073 11.4911 21.0771 10.0083 20.7554C8.52547 20.4337 7.1518 19.734 6.01547 18.7251C4.87913 17.7161 4.01717 16.4332 3.51 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
