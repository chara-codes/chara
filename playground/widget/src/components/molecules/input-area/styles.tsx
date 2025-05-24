import styled, { keyframes } from "styled-components"
import IconButton from "../../atoms/icon-button"
import TextInput from "../../atoms/text-input"

// Input container styles
export const InputContainer = styled.div`
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
`

// Input wrapper styles
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

// Input controls styles
export const InputControls = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
`

// Buttons row styles
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

// Spinner animation
export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

// Send button styles
export const SendButton = styled(IconButton)<{ $isResponding?: boolean }>`
  margin-left: 12px;
  background-color: ${(props) => (props.$isResponding ? "#ef4444" : "#2563eb")};
  border-radius: 12px;
  width: 40px;
  height: 40px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: ${(props) => (props.$isResponding ? "#dc2626" : "#1d4ed8")};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: ${(props) => (props.$isResponding ? "scale(1.1)" : "translateX(1px) scale(1.1)")};
  }
`

// Loader styles
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

// Input styles
export const StyledInput = styled(TextInput)`
  font-size: 14px;
  padding: 6px 0;
  width: 100%;
  min-height: 24px;
  
  &::placeholder {
    color: #9ca3af;
    transition: color 0.2s ease;
  }
  
  &:focus::placeholder {
    color: #d1d5db;
  }
`

// Context indicator styles
export const ContextIndicator = styled.div`
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #2563eb;
  gap: 4px;
  background-color: rgba(37, 99, 235, 0.05);
  border-radius: 4px;
  padding: 3px 8px;
  margin-left: auto;
  border: 1px solid rgba(37, 99, 235, 0.1);
`

export const ContextCount = styled.span`
  font-weight: 500;
`
