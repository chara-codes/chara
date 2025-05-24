import styled from "styled-components"
import type { Theme } from "../../styles/theme"

interface TypographyProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "body1" | "body2" | "caption"
  color?: "primary" | "secondary" | "default"
  align?: "left" | "center" | "right"
}

const Typography = styled.span<TypographyProps>`
  margin: 0;
  
  ${({ theme, variant = "body1", color = "default", align = "left" }) => {
    const themeObj = theme as Theme

    const variantStyles = {
      h1: `
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.2;
      `,
      h2: `
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.3;
      `,
      h3: `
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.4;
      `,
      h4: `
        font-size: 1.125rem;
        font-weight: 600;
        line-height: 1.4;
      `,
      body1: `
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;
      `,
      body2: `
        font-size: 0.875rem;
        font-weight: 400;
        line-height: 1.5;
      `,
      caption: `
        font-size: 0.75rem;
        font-weight: 400;
        line-height: 1.5;
      `,
    }

    const colorStyles = {
      primary: themeObj.colors.primary,
      secondary: themeObj.colors.textSecondary,
      default: themeObj.colors.text,
    }

    return `
      ${variantStyles[variant]}
      color: ${colorStyles[color]};
      text-align: ${align};
    `
  }}
`

// Create component variants with proper HTML tags
export const H1 = styled(Typography).attrs({ as: "h1", variant: "h1" })``
export const H2 = styled(Typography).attrs({ as: "h2", variant: "h2" })``
export const H3 = styled(Typography).attrs({ as: "h3", variant: "h3" })``
export const H4 = styled(Typography).attrs({ as: "h4", variant: "h4" })``
export const Body1 = styled(Typography).attrs({ as: "p", variant: "body1" })``
export const Body2 = styled(Typography).attrs({ as: "p", variant: "body2" })``
export const Caption = styled(Typography).attrs({ as: "span", variant: "caption" })``

export default Typography
