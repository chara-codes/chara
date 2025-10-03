import styled from "styled-components";
import { pulse, shimmer, spin } from "./constants/animations";

export const LoadingLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  overflow: hidden;
  z-index: 10;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${props => props.theme.colors.primary} 15%,
      ${props => props.theme.colors.secondary} 30%,
      ${props => props.theme.colors.primary} 50%,
      ${props => props.theme.colors.secondary} 70%,
      ${props => props.theme.colors.primary} 85%,
      transparent 100%
    );
    background-size: 200% 100%;
    box-shadow: 0 0 8px ${props => props.theme.colors.primaryLight};
    animation: ${shimmer} 2s infinite linear, ${pulse} 2s infinite ease-in-out;
  }
`;

export const InputContainer = styled.div<{ isLoading?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: ${props => props.theme.colors.background};
  position: relative;
  border-top: 1px solid ${props => props.theme.colors.border};
  transition: background-color ${props => props.theme.transitions.theme},
              border-color ${props => props.theme.transitions.theme};

  &:focus-within {
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }

  ${(props) =>
    props.isLoading &&
    `
    pointer-events: none;
    opacity: 0.7;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 5;
    }
  `}
`;

export const InputWrapper = styled.div<{ hasContext?: boolean }>`
  display: flex;
  align-items: center;
  flex: 1;
  background-color: transparent;
  border-radius: 12px;
  padding: 0;
  transition: all ${props => props.theme.transitions.theme};

  ${(props) =>
    props.hasContext &&
    `
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 70%;
      background-color: ${props.theme.colors.primary};
      border-radius: 3px;
    }
  `}
`;

export const InputControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
`;

export const ButtonsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid ${props => props.theme.colors.border};
  transition: border-color ${props => props.theme.transitions.theme};
`;

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const SendButton = styled.button<{ $isResponding?: boolean }>`
  margin-left: 12px;
  background-color: ${(props) => (props.$isResponding ? props.theme.colors.error : props.theme.colors.primary)};
  border-radius: 12px;
  width: 40px;
  height: 40px;
  transition: all ${props => props.theme.transitions.normal} ease;
  box-shadow: ${props => props.theme.shadows.sm};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.background};

  &:hover:not(:disabled) {
    background-color: ${(props) =>
      props.$isResponding ? props.theme.colors.errorHover : props.theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${props => props.theme.shadows.sm};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) svg {
    transform: ${(props) =>
      props.$isResponding ? "scale(1.1)" : "translateX(1px) scale(1.1)"};
  }
`;

export const LoaderContainer = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Loader = styled.div`
  border: 2px solid ${props => props.theme.colors.primaryLight};
  border-radius: 50%;
  border-top: 2px solid ${props => props.theme.colors.background};
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

export const StyledInput = styled.textarea`
  font-size: 14px;
  padding: 6px 0;
  width: 100%;
  min-height: 24px;
  max-height: 300px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: ${props => props.theme.colors.text};
  line-height: 1.5;
  transition: height 0.1s ease, color ${props => props.theme.transitions.theme};
  overflow-y: hidden;

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
    transition: color ${props => props.theme.transitions.theme};
  }

  &:focus::placeholder {
    color: ${props => props.theme.colors.border};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
