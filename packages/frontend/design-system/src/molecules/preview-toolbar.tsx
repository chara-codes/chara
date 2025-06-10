"use client";

import React from "react";
import styled from "styled-components";
import {
  GlobeIcon,
  CodeIcon,
  FileIcon,
  DocumentationIcon,
  ServerIcon,
  ChartIcon,
} from "../atoms/icons";
import Tooltip from "../atoms/tooltip";
import type { Theme } from "../theme";

// Define the different preview types
export enum PreviewType {
  APP = "app",
  CODE = "code",
  TESTS = "tests",
  STATISTICS = "statistics",
  DOCUMENTATION = "documentation",
  DEPLOYMENT = "deployment",
}

interface PreviewToolbarProps {
  activeType: PreviewType;
  onTypeChange: (type: PreviewType) => void;
}

const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
`;

const ToolbarButton = styled.button<{ $isActive: boolean }>`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? (theme as Theme).colors.primary : "transparent"};
  color: ${({ $isActive, theme }) =>
    $isActive ? "#ffffff" : (theme as Theme).colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive
        ? (theme as Theme).colors.background
        : (theme as Theme).colors.backgroundSecondary};
    color: ${({ $isActive, theme }) =>
      $isActive ? "#ffffff" : (theme as Theme).colors.text};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Divider = styled.div`
  width: 24px;
  height: 1px;
  background-color: ${({ theme }) => (theme as Theme).colors.border};
  margin: 8px 0;
`;

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  activeType,
  onTypeChange,
}) => {
  const toolbarItems = [
    { type: PreviewType.APP, icon: <GlobeIcon />, tooltip: "App Preview" },
    { type: PreviewType.CODE, icon: <CodeIcon />, tooltip: "Code View" },
    { type: PreviewType.TESTS, icon: <FileIcon />, tooltip: "Tests" },
    {
      type: PreviewType.STATISTICS,
      icon: <ChartIcon />,
      tooltip: "Statistics",
    },
    {
      type: PreviewType.DOCUMENTATION,
      icon: <DocumentationIcon />,
      tooltip: "Documentation",
    },
    {
      type: PreviewType.DEPLOYMENT,
      icon: <ServerIcon />,
      tooltip: "Deployment",
    },
  ];

  return (
    <ToolbarContainer>
      {toolbarItems.map((item, index) => (
        <React.Fragment key={item.type}>
          {index === 3 && <Divider />}
          <Tooltip text={item.tooltip} position="left">
            <ToolbarButton
              $isActive={activeType === item.type}
              onClick={() => onTypeChange(item.type)}
            >
              {item.icon}
            </ToolbarButton>
          </Tooltip>
        </React.Fragment>
      ))}
    </ToolbarContainer>
  );
};
