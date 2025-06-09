import styled from "styled-components"
import type { Theme } from '@/theme'

interface ButtonProps {
  variant?: "primary" | "secondary" | "text"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  ${({ theme, variant = "primary", size = "md", fullWidth }) => {
    const themeObj = theme as Theme

    // Size styles
    const sizeStyles = {
      sm: `
        padding: ${themeObj.spacing.xs} ${themeObj.spacing.sm};
        font-size: 0.875rem;
        border-radius: ${themeObj.borderRadius.sm};
      `,
      md: `
        padding: ${themeObj.spacing.sm} ${themeObj.spacing.md};
        font-size: 1rem;
        border-radius: ${themeObj.borderRadius.md};
      `,
      lg: `
        padding: ${themeObj.spacing.md} ${themeObj.spacing.lg};
        font-size: 1.125rem;
        border-radius: ${themeObj.borderRadius.md};
      `,
    }

    // Variant styles
    const variantStyles = {
      primary: `
        background-color: ${themeObj.colors.primary};
        color: white;
        &:hover {
          background-color: ${themeObj.colors.primary}dd;
        }
      `,
      secondary: `
        background-color: ${themeObj.colors.backgroundSecondary};
        color: ${themeObj.colors.text};
        border: 1px solid ${themeObj.colors.border};
        &:hover {
          background-color: ${themeObj.colors.border};
        }
      `,
      text: `
        background-color: transparent;
        color: ${themeObj.colors.primary};
        &:hover {
          background-color: ${themeObj.colors.backgroundSecondary};
        }
      `,
    }

    return `
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      width: ${fullWidth ? "100%" : "auto"};
    `
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export default Button
