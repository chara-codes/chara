import styled from "styled-components";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from "../../styles/theme-constants";

// Base input styles
export const InputBase = styled.input<{
  $hasError?: boolean;
  $disabled?: boolean;
}>`
  width: 100%;
  padding: ${spacing.sm} ${spacing.md};
  height: 38px;
  border: 1px solid
    ${(props) => {
      if (props.$disabled) return colors.border.default;
      if (props.$hasError) return colors.destructive.default;
      return colors.border.default;
    }};
  border-radius: ${borderRadius.md};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  background-color: ${(props) =>
    props.$disabled ? colors.background.tertiary : colors.background.primary};
  color: ${(props) =>
    props.$disabled ? colors.text.disabled : colors.text.primary};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${(props) =>
      props.$hasError ? colors.destructive.default : colors.border.hover};
  }

  &:focus:not(:disabled) {
    outline: none;
    border-color: ${(props) =>
      props.$hasError ? colors.destructive.default : colors.primary.default};
    box-shadow: ${shadows.focus}
      ${(props) =>
        props.$hasError ? colors.destructive.light : colors.primary.light};
  }

  &::placeholder {
    color: ${colors.text.disabled};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Text area
export const TextAreaBase = styled(InputBase).attrs({ as: "textarea" })`
  height: auto;
  min-height: 80px;
  resize: vertical;
  line-height: ${typography.lineHeight.normal};
`;

// Select
export const SelectBase = styled(InputBase).attrs({ as: "select" })`
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px 16px;
  padding-right: 40px;
`;

// Label
export const LabelBase = styled.label`
  display: block;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.secondary};
  margin-bottom: ${spacing.xs};
`;

// Error message
export const ErrorMessageBase = styled.div`
  color: ${colors.destructive.default};
  font-size: ${typography.fontSize.xs};
  margin-top: ${spacing.xs};
`;

// Form group
export const FormGroupBase = styled.div<{ $fullWidth?: boolean }>`
  flex: ${(props) => (props.$fullWidth ? 1 : "0 0 calc(50% - 8px)")};
  margin-bottom: ${spacing.md};

  @media (max-width: "640px") {
    flex: 1;
  }
`;

// Form row
export const FormRowBase = styled.div`
  display: flex;
  gap: ${spacing.lg};
  margin-bottom: ${spacing.lg};

  @media (max-width: "640px") {
    flex-direction: column;
    gap: ${spacing.md};
  }
`;

// Form section
export const FormSectionBase = styled.div`
  margin-bottom: ${spacing.xxl};
  background-color: ${colors.background.primary};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.sm};
  padding: ${spacing.lg};
`;

// Section title
export const SectionTitleBase = styled.h3`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.primary};
  margin: 0 0 ${spacing.lg} 0;
  padding-bottom: ${spacing.sm};
  border-bottom: 1px solid ${colors.border.default};
`;

// Button base
export const ButtonBase = styled.button<{
  $variant?: "primary" | "secondary" | "destructive" | "link";
  $size?: "small" | "medium" | "large";
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${typography.fontWeight.medium};
  border-radius: ${borderRadius.md};
  transition: all ${transitions.normal} ease;
  cursor: pointer;
  font-family: ${typography.fontFamily};

  /* Size styles */
  ${(props) => {
    switch (props.$size || "medium") {
      case "small":
        return `
          padding: 6px 12px;
          font-size: ${typography.fontSize.xs};
          height: 30px;
        `;
      case "large":
        return `
          padding: 10px 20px;
          font-size: ${typography.fontSize.lg};
          height: 46px;
        `;
      default:
        return `
          padding: 8px 16px;
          font-size: ${typography.fontSize.md};
          height: 38px;
        `;
    }
  }}

  /* Variant styles */
  ${(props) => {
    switch (props.$variant || "primary") {
      case "secondary":
        return `
          background-color: ${colors.background.primary};
          color: ${colors.text.secondary};
          border: 1px solid ${colors.border.default};

          &:hover:not(:disabled) {
            background-color: ${colors.background.secondary};
            border-color: ${colors.border.hover};
          }
        `;
      case "destructive":
        return `
          background-color: ${colors.destructive.default};
          color: ${colors.background.primary};
          border: none;

          &:hover:not(:disabled) {
            background-color: ${colors.destructive.hover};
          }
        `;
      case "link":
        return `
          background-color: transparent;
          color: ${colors.primary.default};
          border: none;
          padding: 0;
          height: auto;

          &:hover:not(:disabled) {
            text-decoration: underline;
            transform: none;
            box-shadow: none;
          }
        `;
      default:
        return `
          background-color: ${colors.primary.default};
          color: ${colors.background.primary};
          border: none;

          &:hover:not(:disabled) {
            background-color: ${colors.primary.hover};
          }
        `;
    }
  }}

  /* States */
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${shadows.sm};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Checkbox container
export const CheckboxBase = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-top: ${spacing.sm};

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  label {
    font-size: ${typography.fontSize.md};
    color: ${colors.text.secondary};
    margin: 0;
    cursor: pointer;
  }
`;

// Icon selector
export const IconSelectorBase = styled.div`
  display: flex;
  gap: ${spacing.sm};
  margin-top: ${spacing.sm};
  flex-wrap: wrap;
`;

// Icon option
export const IconOptionBase = styled.div<{ $selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.$selected ? colors.primary.default : colors.background.tertiary};
  color: ${(props) =>
    props.$selected ? colors.background.primary : colors.text.tertiary};
  border: 1px solid
    ${(props) =>
      props.$selected ? colors.primary.default : colors.border.default};
  transition: all ${transitions.normal} ease;

  &:hover {
    background-color: ${(props) =>
      props.$selected ? colors.primary.default : colors.border.default};
  }
`;
