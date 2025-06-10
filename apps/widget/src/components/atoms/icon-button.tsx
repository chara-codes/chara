import styled from "styled-components"

interface IconButtonProps {
  size?: "sm" | "md" | "lg"
  variant?: "ghost" | "primary" | "secondary"
}

const IconButton = styled.button<IconButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  
  ${({ size = "md" }) => {
    const sizeMap = {
      sm: "28px",
      md: "36px",
      lg: "44px",
    }

    return `
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
    `
  }}
  
  ${({ variant = "ghost" }) => {
    const variantStyles = {
      ghost: `
        color: #666;
        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `,
      primary: `
        color: #fff;
        background-color: #2563eb;
        &:hover {
          background-color: #1d4ed8;
        }
      `,
      secondary: `
        color: #666;
        background-color: #f3f4f6;
        &:hover {
          background-color: #e5e7eb;
        }
      `,
    }

    return variantStyles[variant]
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default IconButton
