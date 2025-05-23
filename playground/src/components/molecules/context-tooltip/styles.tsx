import styled, { css, keyframes } from "styled-components"

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

export const TooltipContainer = styled.div<{ position: "top" | "right" | "bottom" | "left" }>`
  position: fixed;
  z-index: 1000;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  animation: ${fadeIn} 0.2s ease-in-out;
  padding: 0;
  
  /* Ensure tooltip doesn't get cut off at screen edges */
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
`

export const TooltipArrow = styled.div<{ position: "top" | "right" | "bottom" | "left" }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: white;
  border: 1px solid #e5e7eb;
  transform: rotate(45deg);
  
  ${({ position }) => {
    switch (position) {
      case "top":
        return css`
          bottom: -6px;
          left: 50%;
          margin-left: -5px;
          border-top: none;
          border-left: none;
        `
      case "right":
        return css`
          left: -6px;
          top: 50%;
          margin-top: -5px;
          border-right: none;
          border-bottom: none;
        `
      case "bottom":
        return css`
          top: -6px;
          left: 50%;
          margin-left: -5px;
          border-bottom: none;
          border-right: none;
        `
      case "left":
        return css`
          right: -6px;
          top: 50%;
          margin-top: -5px;
          border-left: none;
          border-top: none;
        `
    }
  }}
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
