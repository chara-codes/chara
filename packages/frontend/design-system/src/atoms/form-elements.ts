import styled from "styled-components";

// Base input styles
export const InputBase = styled.input<{
  $hasError?: boolean;
  $disabled?: boolean;
}>`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  height: 38px;
  border: 1px solid
    ${(props) => {
      if (props.$disabled) return props.theme.colors.border;
      if (props.$hasError) return props.theme.colors.error;
      return props.theme.colors.border;
    }};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-family: ${props => props.theme.typography.fontFamily};
  background-color: ${(props) =>
    props.$disabled ? props.theme.colors.backgroundSecondary : props.theme.colors.background};
  color: ${(props) =>
    props.$disabled ? props.theme.colors.textSecondary : props.theme.colors.text};
  transition: all ${props => props.theme.transitions.theme};

  &:hover:not(:disabled) {
    border-color: ${(props) =>
      props.$hasError ? props.theme.colors.error : props.theme.colors.borderHover};
  }

  &:focus:not(:disabled) {
    outline: none;
    border-color: ${(props) =>
      props.$hasError ? props.theme.colors.error : props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.focus}
      ${(props) =>
        props.$hasError ? props.theme.colors.errorLight : props.theme.colors.primaryLight};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
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
  line-height: ${props => props.theme.typography.lineHeight.normal};
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
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

// Error message
export const ErrorMessageBase = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: ${props => props.theme.spacing.xs};
`;

// Form group
export const FormGroupBase = styled.div<{ $fullWidth?: boolean }>`
  flex: ${(props) => (props.$fullWidth ? 1 : "0 0 calc(50% - 8px)")};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: "640px") {
    flex: 1;
  }
`;

// Form row
export const FormRowBase = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: "640px") {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
  }
`;

// Form section
export const FormSectionBase = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${props => props.theme.spacing.lg};
`;

// Section title
export const SectionTitleBase = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

// Button base
export const ButtonBase = styled.button<{
  $variant?: "primary" | "secondary" | "destructive" | "link";
  $size?: "small" | "medium" | "large";
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all ${props => props.theme.transitions.normal} ease;
  cursor: pointer;
  font-family: ${props => props.theme.typography.fontFamily};

  /* Size styles */
  ${(props) => {
    switch (props.$size || "medium") {
      case "small":
        return `
          padding: 4px 10px;
          font-size: ${props.theme.typography.fontSize.xs};
          height: 26px;
        `;
      case "large":
        return `
          padding: 10px 20px;
          font-size: ${props.theme.typography.fontSize.lg};
          height: 46px;
        `;
      default:
        return `
          padding: 8px 16px;
          font-size: ${props.theme.typography.fontSize.md};
          height: 38px;
        `;
    }
  }}

  /* Variant styles */
  ${(props) => {
    switch (props.$variant || "primary") {
      case "secondary":
        return `
          background-color: transparent;
          color: ${props.theme.colors.textSecondary};
          border: 1px solid ${props.theme.colors.border};

          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.highlight};
            border-color: ${props.theme.colors.borderHover};
            color: ${props.theme.colors.text};
          }
        `;
      case "destructive":
        return `
          background-color: transparent;
          color: ${props.theme.colors.error};
          border: 1px solid ${props.theme.colors.error};

          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.errorLight};
            border-color: ${props.theme.colors.errorHover};
          }
        `;
      case "link":
        return `
          background-color: transparent;
          color: ${props.theme.colors.primary};
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
          background-color: ${props.theme.colors.primary};
          color: ${props.theme.colors.background};
          border: 1px solid ${props.theme.colors.primary};

          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryHover};
            border-color: ${props.theme.colors.primaryHover};
          }
        `;
    }
  }}

  /* States */
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
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
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  label {
    font-size: ${props => props.theme.typography.fontSize.md};
    color: ${props => props.theme.colors.textSecondary};
    margin: 0;
    cursor: pointer;
  }
`;

// Icon selector
export const IconSelectorBase = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

// Icon option
export const IconOptionBase = styled.div<{ $selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.$selected ? props.theme.colors.primary : props.theme.colors.backgroundSecondary};
  color: ${(props) =>
    props.$selected ? props.theme.colors.background : props.theme.colors.textSecondary};
  border: 1px solid
    ${(props) =>
      props.$selected ? props.theme.colors.primary: props.theme.colors.border};
  transition: all ${props => props.theme.transitions.normal} ease;

  &:hover {
    background-color: ${(props) =>
      props.$selected ? props.theme.colors.primary : props.theme.colors.highlight};
  }
`;
