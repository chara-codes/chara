import styled, { keyframes } from "styled-components"

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scaleY(1);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.2);
  }
`

const loadingLineAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

export const LoadingLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  overflow: hidden;
  z-index: 10;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent 0%,
      #3b82f6 15%,
      #8b5cf6 30%,
      #ec4899 50%,
      #8b5cf6 70%,
      #3b82f6 85%,
      transparent 100%
    );
    background-size: 200% 100%;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
    animation: ${shimmer} 2s infinite linear, ${pulse} 2s infinite ease-in-out;
  }
`

export const InputContainer = styled.div<{ isLoading?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  position: relative;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  transition: background-color 0.2s ease;
  
  &:focus-within {
    background-color: #fff;
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
`

export const InputWrapper = styled.div<{ hasContext: boolean }>`
  display: flex;
  align-items: center;
  flex: 1;
  background-color: transparent;
  border-radius: 12px;
  padding: 0;
  transition: all 0.2s ease;
  
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
      background-color: #2563eb;
      border-radius: 3px;
    }
  `}
`

export const InputControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
`

export const ButtonsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(229, 231, 235, 0.3);
`

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`

export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

export const SendButton = styled.button<{ $isResponding?: boolean }>`
  margin-left: 12px;
  background-color: ${(props) => (props.$isResponding ? "#ef4444" : "#2563eb")};
  border-radius: 12px;
  width: 40px;
  height: 40px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$isResponding ? "#dc2626" : "#1d4ed8")};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover:not(:disabled) svg {
    transform: ${(props) => (props.$isResponding ? "scale(1.1)" : "translateX(1px) scale(1.1)")};
  }
`

export const LoaderContainer = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Loader = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`

export const StyledInput = styled.textarea`
  font-size: 14px;
  padding: 6px 0;
  width: 100%;
  min-height: 24px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  
  &::placeholder {
    color: #9ca3af;
    transition: color 0.2s ease;
  }
  
  &:focus::placeholder {
    color: #d1d5db;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`
