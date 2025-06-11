import type React from "react";

export interface ServerIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const ServerIcon: React.FC<ServerIconProps> = ({
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
      <title>Server Icon</title>
      <rect
        x="2"
        y="4"
        width="20"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="14"
        width="20"
        height="6"
        rx="1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="7" r="1" fill={color} />
      <circle cx="6" cy="17" r="1" fill={color} />
    </svg>
  );
};

export default ServerIcon;
