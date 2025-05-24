import styled from "styled-components"

// Main container styles
export const BubbleContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  margin-bottom: 16px;
  width: 100%;
`

export const Bubble = styled.div<{ isUser: boolean }>`
  position: relative;
  max-width: 100%;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  background-color: ${(props) => (props.isUser ? "#ffffff" : "#f3f4f6")};
  box-shadow: ${(props) => (props.isUser ? "0 2px 4px rgba(0, 0, 0, 0.05)" : "0 1px 2px rgba(0, 0, 0, 0.05)")};
  border: ${(props) => (props.isUser ? "1px solid #e5e7eb" : "none")};
`

export const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  opacity: 0.6;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
    opacity: 1;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
`

export const MessageContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  margin-right: 24px;
`

export const Time = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`

export const ContextContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${(props) => (props.isUser ? "#e5e7eb" : "#e2e4e9")};
  position: relative;
`

export const ContextLabel = styled.div<{ isUser: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-right: 6px;
  display: flex;
  align-items: center;
`

export const ContextItemWrapper = styled.div`
  position: relative;
`

export const ContextItemComponent = styled.div<{ isUser: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.isUser ? "#f9fafb" : "#e5e7eb")};
  color: #4b5563;
  cursor: pointer;
  
  svg {
    color: #6b7280;
  }
  
  &:hover {
    background-color: ${(props) => (props.isUser ? "#f3f4f6" : "#d1d5db")};
  }
`

export const ContextPreviewTooltip = styled.div<{ position: string }>`
  position: fixed;
  z-index: 1000;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  animation: fadeIn 0.2s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  /* Ensure tooltip doesn't get cut off at screen edges */
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  
  &:after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: white;
    border: 1px solid #e5e7eb;
    transform: rotate(45deg);
    
    ${({ position }) => {
      switch (position) {
        case "top":
          return `
            bottom: -6px;
            left: 50%;
            margin-left: -5px;
            border-top: none;
            border-left: none;
          `
        case "right":
          return `
            left: -6px;
            top: 50%;
            margin-top: -5px;
            border-right: none;
            border-bottom: none;
          `
        case "bottom":
          return `
            top: -6px;
            left: 50%;
            margin-left: -5px;
            border-bottom: none;
            border-right: none;
          `
        case "left":
          return `
            right: -6px;
            top: 50%;
            margin-top: -5px;
            border-left: none;
            border-top: none;
          `
        default:
          return `
            left: -6px;
            top: 50%;
            margin-top: -5px;
            border-right: none;
            border-bottom: none;
          `
      }
    }}
  }
`

export const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
`

export const PreviewType = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: normal;
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: capitalize;
`

export const PreviewContent = styled.div`
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #4b5563;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  
  code {
    font-family: monospace;
    background-color: #f3f4f6;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
  }
`

// Instruction section styles
export const InstructionSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`

export const InstructionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
  
  svg {
    color: #6b7280;
  }
`

export const InstructionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const InstructionItem = styled.div`
  font-size: 13px;
  color: #4b5563;
  padding: 4px 8px;
  background-color: #f9fafb;
  border-radius: 4px;
  font-family: monospace;
`

export const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
`

export const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => (props.$active ? "#6366f1" : "transparent")};
  color: ${(props) => (props.$active ? "#4f46e5" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${(props) => (props.$active ? "#4f46e5" : "#4b5563")};
  }
  
  svg {
    color: currentColor;
  }
`

export const TabContent = styled.div`
  padding: 4px 0;
`
