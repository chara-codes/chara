"use client";

import type React from "react";
import styled from "styled-components";
import { PreviewType } from "../../pages/workspace";
import type { Theme } from "../../styles/theme";

interface PreviewAreaProps {
  activeType: PreviewType;
}

const PreviewContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  height: 48px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  background-color: ${({ theme }) => (theme as Theme).colors.background};
`;

const PreviewTitle = styled.h2`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => (theme as Theme).colors.text};
  text-transform: capitalize;
`;

const PreviewContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow: auto;
`;

const AppPreview = styled.div`
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const CodePreview = styled.pre`
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 13px;
  line-height: 1.6;
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  border-radius: 8px;
  overflow: auto;
  height: 100%;
`;

const TestsPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TestItem = styled.div<{ $passed: boolean }>`
  padding: 12px 16px;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border-radius: 8px;
  border-left: 4px solid ${({ $passed }) => ($passed ? "#10b981" : "#ef4444")};
  font-size: 14px;
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const StatCard = styled.div`
  padding: 20px;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => (theme as Theme).colors.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const PreviewArea: React.FC<PreviewAreaProps> = ({ activeType }) => {
  const renderPreviewContent = () => {
    switch (activeType) {
      case PreviewType.APP:
        return (
          <AppPreview>
            <div>App preview will be rendered here</div>
          </AppPreview>
        );

      case PreviewType.CODE:
        return (
          <CodePreview>
            {`import React from 'react'
import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>Hello World</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`}
          </CodePreview>
        );

      case PreviewType.TESTS:
        return (
          <TestsPreview>
            <TestItem $passed={true}>
              ✓ Component renders without crashing
            </TestItem>
            <TestItem $passed={true}>
              ✓ Button click increments counter
            </TestItem>
            <TestItem $passed={false}>✗ API integration test failed</TestItem>
            <TestItem $passed={true}>
              ✓ Form validation works correctly
            </TestItem>
          </TestsPreview>
        );

      case PreviewType.STATISTICS:
        return (
          <StatisticsGrid>
            <StatCard>
              <StatValue>1,234</StatValue>
              <StatLabel>Lines of Code</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>42</StatValue>
              <StatLabel>Components</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>98%</StatValue>
              <StatLabel>Test Coverage</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>0.8s</StatValue>
              <StatLabel>Build Time</StatLabel>
            </StatCard>
          </StatisticsGrid>
        );

      case PreviewType.DOCUMENTATION:
        return (
          <div>
            <h3>API Documentation</h3>
            <p style={{ marginTop: 16, lineHeight: 1.6 }}>
              Documentation preview will be displayed here with API endpoints,
              component documentation, and usage examples.
            </p>
          </div>
        );

      case PreviewType.DEPLOYMENT:
        return (
          <div>
            <h3>Deployment Status</h3>
            <p style={{ marginTop: 16 }}>
              Deployment configuration and status will be shown here.
            </p>
          </div>
        );

      default:
        return <div>Select a preview type</div>;
    }
  };

  return (
    <PreviewContainer>
      <PreviewHeader>
        <PreviewTitle>{activeType} Preview</PreviewTitle>
      </PreviewHeader>
      <PreviewContent>{renderPreviewContent()}</PreviewContent>
    </PreviewContainer>
  );
};

export default PreviewArea;
