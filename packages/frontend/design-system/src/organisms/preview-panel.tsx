"use client";

import React from "react";
import styled from "styled-components";
import {
  PreviewToolbar,
  PreviewType,
  AppPreview,
  CodePreview,
  TestsPreview,
  StatisticsPreview,
  DocumentationPreview,
  DeploymentPreview,
} from "../molecules";
import type { Theme } from "../theme";

interface PreviewPanelProps {
  activeType: PreviewType;
  onTypeChange: (type: PreviewType) => void;
}

const PreviewContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const PreviewContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow: auto;
`;

const ToolbarColumn = styled.div`
  width: 56px;
  height: 100%;
  padding: 16px 8px;
  border-left: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  activeType,
  onTypeChange,
}) => {
  const renderPreviewContent = () => {
    switch (activeType) {
      case PreviewType.APP:
        return <AppPreview />;
      case PreviewType.CODE:
        return <CodePreview />;
      case PreviewType.TESTS:
        return <TestsPreview />;
      case PreviewType.STATISTICS:
        return <StatisticsPreview />;
      case PreviewType.DOCUMENTATION:
        return <DocumentationPreview />;
      case PreviewType.DEPLOYMENT:
        return <DeploymentPreview />;
      default:
        return <div>Select a preview type</div>;
    }
  };

  return (
    <PreviewContainer>
      <PreviewContent>{renderPreviewContent()}</PreviewContent>
      <ToolbarColumn>
        <PreviewToolbar activeType={activeType} onTypeChange={onTypeChange} />
      </ToolbarColumn>
    </PreviewContainer>
  );
};
