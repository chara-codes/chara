"use client"

import React from "react"
import styled from "styled-components"
import { PreviewType } from "../../pages/workspace"
import { GlobeIcon, CodeIcon, FileIcon, DocumentationIcon, ServerIcon } from "../atoms/icons"
import Tooltip from "../atoms/tooltip"
import type { Theme } from "../../styles/theme"

// Define ChartIcon directly in this file to avoid import issues
const ChartIcon: React.FC<{ width?: number; height?: number; className?: string }> = ({
  width = 24,
  height = 24,
  className,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
)

interface PreviewToolbarProps {
  activeType: PreviewType
  onTypeChange: (type: PreviewType) => void
}

const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
`

const ToolbarButton = styled.button<{ $isActive: boolean }>`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background-color: ${({ $isActive, theme }) => ($isActive ? (theme as Theme).colors.primary : "transparent")};
  color: ${({ $isActive, theme }) => ($isActive ? "#ffffff" : (theme as Theme).colors.textSecondary)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? (theme as Theme).colors.primary : (theme as Theme).colors.hover};
    color: ${({ $isActive, theme }) => ($isActive ? "#ffffff" : (theme as Theme).colors.text)};
  }

  &:active {
    transform: scale(0.95);
  }
`

const Divider = styled.div`
  width: 24px;
  height: 1px;
  background-color: ${({ theme }) => (theme as Theme).colors.border};
  margin: 8px 0;
`

const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ activeType, onTypeChange }) => {
  const toolbarItems = [
    { type: PreviewType.APP, icon: GlobeIcon, tooltip: "App Preview" },
    { type: PreviewType.CODE, icon: CodeIcon, tooltip: "Code View" },
    { type: PreviewType.TESTS, icon: FileIcon, tooltip: "Tests" },
    { type: PreviewType.STATISTICS, icon: ChartIcon, tooltip: "Statistics" },
    { type: PreviewType.DOCUMENTATION, icon: DocumentationIcon, tooltip: "Documentation" },
    { type: PreviewType.DEPLOYMENT, icon: ServerIcon, tooltip: "Deployment" },
  ]

  return (
    <ToolbarContainer>
      {toolbarItems.map((item, index) => (
        <React.Fragment key={item.type}>
          {index === 3 && <Divider />}
          <Tooltip text={item.tooltip} position="left">
            <ToolbarButton $isActive={activeType === item.type} onClick={() => onTypeChange(item.type)}>
              <item.icon width={20} height={20} />
            </ToolbarButton>
          </Tooltip>
        </React.Fragment>
      ))}
    </ToolbarContainer>
  )
}

export default PreviewToolbar
