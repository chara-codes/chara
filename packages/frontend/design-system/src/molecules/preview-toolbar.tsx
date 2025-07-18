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
  gap: 12px;
  width: 100%;
  align-items: center;
  padding: 16px 12px;
`;

const ToolbarButton = styled.button<{ $isActive: boolean }>`
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? (theme as Theme).colors.primary : "transparent"};
  color: ${({ $isActive, theme }) =>
    $isActive ? "#ffffff" : (theme as Theme).colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid
    ${({ $isActive, theme }) =>
      $isActive ? (theme as Theme).colors.primary : "transparent"};
  box-shadow: ${({ $isActive }) =>
    $isActive
      ? "0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)"
      : "0 2px 4px rgba(0, 0, 0, 0.04)"};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive
        ? (theme as Theme).colors.primary
        : (theme as Theme).colors.backgroundSecondary};
    color: ${({ $isActive, theme }) =>
      $isActive ? "#ffffff" : (theme as Theme).colors.text};
    transform: translateY(-1px);
    box-shadow: ${({ $isActive }) =>
      $isActive
        ? "0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)"
        : "0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)"};
    border-color: ${({ $isActive, theme }) =>
      $isActive
        ? (theme as Theme).colors.primary
        : (theme as Theme).colors.border};
  }

  &:active {
    transform: translateY(0px) scale(0.96);
    transition: all 0.1s ease;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => (theme as Theme).colors.primary}33;
  }
`;

const Divider = styled.div`
  width: 28px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    ${({ theme }) => (theme as Theme).colors.border} 20%,
    ${({ theme }) => (theme as Theme).colors.border} 80%,
    transparent
  );
  margin: 4px 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background-color: ${({ theme }) => (theme as Theme).colors.border};
    border-radius: 50%;
    opacity: 0.6;
  }
`;

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  activeType,
  onTypeChange,
}) => {
  const toolbarItems = [
    { type: PreviewType.APP, icon: <GlobeIcon />, tooltip: "App Preview" },
    { type: PreviewType.CODE, icon: <CodeIcon />, tooltip: "Code View" },
    {
      type: PreviewType.TESTS,
      icon: <FileIcon width={28} height={28} />,
      tooltip: "Tests",
    },
    {
      type: PreviewType.STATISTICS,
      icon: <ChartIcon />,
      tooltip: "Statistics",
    },
    {
      type: PreviewType.DOCUMENTATION,
      icon: <DocumentationIcon width={28} height={28} />,
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
