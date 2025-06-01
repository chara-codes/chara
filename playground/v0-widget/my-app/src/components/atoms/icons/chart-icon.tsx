export interface ChartIconProps {
  width?: number;
  height?: number;
  className?: string;
}
// // Define ChartIcon directly in this file to avoid import issues
export const ChartIcon: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 24, height = 24, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Chart visualization"
    role="img"
  >
    <title>Chart Icon</title>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);
