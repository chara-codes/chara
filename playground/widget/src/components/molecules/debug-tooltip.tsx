"use client"

import type React from "react"
import { useState } from "react"
import styled from "styled-components"

const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 300px;
`

const DebugButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
  
  &:hover {
    background-color: #4338ca;
  }
`

const DebugTooltip = styled.div`
  position: absolute;
  top: -100px;
  left: 0;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
`

const DebugTooltipComponent: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <DebugContainer>
      <DebugButton onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        Hover to test tooltip
      </DebugButton>

      {showTooltip && (
        <DebugTooltip>
          <h4 style={{ margin: "0 0 8px 0" }}>Test Tooltip</h4>
          <p style={{ margin: 0, fontSize: "12px" }}>
            If you can see this tooltip, the tooltip system is working correctly.
          </p>
        </DebugTooltip>
      )}

      <div style={{ fontSize: "12px" }}>
        <p>Tooltip Debug Info:</p>
        <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
          <li>z-index: 1000</li>
          <li>position: fixed</li>
          <li>visibility: visible</li>
        </ul>
      </div>
    </DebugContainer>
  )
}

export default DebugTooltipComponent
