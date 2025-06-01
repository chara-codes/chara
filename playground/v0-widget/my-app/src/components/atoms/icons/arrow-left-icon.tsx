import type React from "react";

/**
 * Props for the ArrowLeftIcon component
 * @interface ArrowLeftIconProps
 * @property {number} [width=24] - The width of the icon
 * @property {number} [height=24] - The height of the icon
 * @property {string} [color='currentColor'] - The color of the icon
 * @property {string} [className=''] - Additional CSS classes
 */
export interface ArrowLeftIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * ArrowLeftIcon component
 * @param {ArrowLeftIconProps} props - The component props
 * @returns {JSX.Element} The rendered icon
 */
export const ArrowLeftIcon: React.FC<ArrowLeftIconProps> = ({
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
      aria-labelledby="arrowLeftIconTitle"
      role="img"
    >
      <title id="arrowLeftIconTitle">Arrow Left</title>
      <path
        d="M19 12H5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19L5 12L12 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowLeftIcon;
