import styled from "styled-components";
import { type Theme } from "../../theme";

// Footer container
export const FooterContainer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => (theme as Theme).spacing.xs}
    ${({ theme }) => (theme as Theme).spacing.sm};
  border-top: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
`;

// Mode selector
export const ModeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.sm};
`;

export const ModeButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => (theme as Theme).spacing.xs}
    ${({ theme }) => (theme as Theme).spacing.sm};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  border: none;
  background-color: ${(props) =>
    props.$active ? (props.theme as Theme).colors.highlight : "transparent"};
  color: ${(props) =>
    props.$active
      ? (props.theme as Theme).colors.text
      : (props.theme as Theme).colors.textSecondary};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  cursor: pointer;
  transition: background-color
    ${({ theme }) => (theme as Theme).transitions.fast};

  &:hover {
    background-color: ${(props) =>
      props.$active
        ? (props.theme as Theme).colors.highlight
        : (props.theme as Theme).colors.backgroundSecondary};
  }
`;

// Model selector
export const ModelSelectorContainer = styled.div`
  position: relative;
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
`;

export const ModelSelectorButton = styled.button`
  padding: ${({ theme }) => (theme as Theme).spacing.xs}
    ${({ theme }) => (theme as Theme).spacing.sm};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  color: ${({ theme }) => (theme as Theme).colors.text};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.xs};
  transition: background-color
    ${({ theme }) => (theme as Theme).transitions.fast};

  &:hover {
    background-color: ${({ theme }) =>
      (theme as Theme).colors.backgroundSecondary};
  }
`;

export const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.xs};
`;

export const SourceBadge = styled.span<{ $sourceType: string }>`
  padding: 2px ${({ theme }) => (theme as Theme).spacing.sm};
  border-radius: 3px;
  border-width: 1px;
  font-size: 10px;
  font-weight: ${({ theme }) => (theme as Theme).typography.fontWeight.medium};
  max-height: 26px;
  background-color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return (props.theme as Theme).colors.sourceBadge.unified.background;
      case "native":
        return (props.theme as Theme).colors.sourceBadge.native.background;
      case "local":
        return (props.theme as Theme).colors.sourceBadge.local.background;
      default:
        return (props.theme as Theme).colors.highlight;
    }
  }};
  color: ${(props) => {
    switch (props.$sourceType) {
      case "unified":
        return "#5b21b6";
        return (props.theme as Theme).colors.sourceBadge.unified.text;
      case "native":
        return "#1d4ed8";
        return (props.theme as Theme).colors.sourceBadge.native.text;
      case "local":
        return "#166534";
        return (props.theme as Theme).colors.sourceBadge.local.text;
      default:
        return (props.theme as Theme).colors.textSecondary;
    }
  }};
`;

// Dropdown
export const DropdownContainer = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  color: ${({ theme }) => (theme as Theme).colors.text};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.xs};
  width: 240px;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  box-shadow: ${({ theme }) => (theme as Theme).shadows.md};
  z-index: ${({ theme }) => (theme as Theme).zIndices.dropdown};
  max-height: 300px;
  overflow-y: auto;
`;

export const SearchContainer = styled.div`
  padding: ${({ theme }) => (theme as Theme).spacing.sm};
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  z-index: ${({ theme }) => (theme as Theme).zIndices.base};
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => (theme as Theme).spacing.xs}
    ${({ theme }) => (theme as Theme).spacing.sm}
    ${({ theme }) => (theme as Theme).spacing.xs} 28px;
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  outline: none;
  transition: border-color ${({ theme }) => (theme as Theme).transitions.fast};

  &:focus {
    border-color: ${({ theme }) => (theme as Theme).colors.primary};
  }
`;

export const SearchIconWrapper = styled.div`
  position: absolute;
  left: ${({ theme }) => (theme as Theme).spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

// Provider groups
export const ProviderGroup = styled.div`
  padding: 0;
`;

export const ProviderHeader = styled.div`
  padding: ${({ theme }) => (theme as Theme).spacing.sm}
    ${({ theme }) => (theme as Theme).spacing.sm};
  font-weight: ${({ theme }) => (theme as Theme).typography.fontWeight.medium};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Model options
export const ModelOption = styled.div<{ $selected: boolean }>`
  padding: ${({ theme }) => (theme as Theme).spacing.sm}
    ${({ theme }) => (theme as Theme).spacing.sm};
  cursor: pointer;
  transition: background-color
    ${({ theme }) => (theme as Theme).transitions.fast};

  ${(props) =>
    props.$selected &&
    `
    background-color: ${(props.theme as Theme).colors.highlight};
    font-weight: ${(props.theme as Theme).typography.fontWeight.medium};
  `}

  &:hover {
    background-color: ${(props) =>
      props.$selected
        ? (props.theme as Theme).colors.highlight
        : (props.theme as Theme).colors.backgroundSecondary};
  }
`;

export const ModelOptionContent = styled.div`
  display: flex;
  color: ${({ theme }) => (theme as Theme).colors.text};
  justify-content: space-between;
  text-align: left;
  width: 100%;
`;

export const NoResults = styled.div`
  padding: ${({ theme }) => (theme as Theme).spacing.sm};
  text-align: center;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  font-style: italic;
`;
