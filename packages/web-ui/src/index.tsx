import styled, { ThemeProvider } from "styled-components";
import {
  ChatInterface,
  PreviewType,
  Theme,
  theme,
  UIStoreProvider,
  PreviewToolbar,
} from "@chara/design-system";
import { useCallback, useEffect, useRef, useState } from "react";

const WorkspaceContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const ChatColumn = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  min-width: 280px;
  max-width: 600px;
  height: 100%;
  border-right: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  position: relative;
`;

const ResizeHandle = styled.div`
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  position: relative;
  z-index: 10;

  &:hover::after,
  &:active::after {
    content: "";
    position: absolute;
    top: 0;
    left: 3px;
    width: 2px;
    height: 100%;
    background-color: ${({ theme }) => (theme as Theme).colors.primary};
    opacity: 0.6;
  }

  &:active::after {
    opacity: 1;
  }
`;

const PreviewColumn = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
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

const AppPreview = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => (theme as Theme).colors?.border};
`;

const CodePreview = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border-radius: 8px;
  padding: 16px;
  font-family: monospace;
  color: ${({ theme }) => (theme as Theme).colors.text};
  overflow: auto;
`;

const TestsPreview = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TestItem = styled.div<{ $passed: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ $passed, theme }) =>
    $passed
      ? (theme as Theme).colors.success + "15"
      : (theme as Theme).colors.error + "15"};
  border: 1px solid
    ${({ $passed, theme }) =>
      $passed
        ? (theme as Theme).colors.success
        : (theme as Theme).colors.error};
  color: ${({ theme }) => (theme as Theme).colors.text};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
`;

const StatCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};

  h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  }

  p {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: ${({ theme }) => (theme as Theme).colors.text};
  }
`;

const DocsSection = styled.div`
  margin-bottom: 24px;

  h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: ${({ theme }) => (theme as Theme).colors?.text};
  }

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
    line-height: 1.5;
  }

  code {
    background-color: ${({ theme }) => (theme as Theme).colors?.background};
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
  }
`;

const DeploymentItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  margin-bottom: 16px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: ${({ theme }) => (theme as Theme).colors.text};
  }

  p {
    margin: 0;
    font-size: 14px;
    color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  }
`;

const StatusBadge = styled.span<{
  $status: "success" | "warning" | "error" | "info";
}>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  background-color: ${({ $status, theme }) => {
    switch ($status) {
      case "success":
        return (theme as Theme).colors.success + "20";
      case "warning":
        return (theme as Theme).colors.warning + "20";
      case "error":
        return (theme as Theme).colors.error + "20";
      case "info":
        return (theme as Theme).colors.info + "20";
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case "success":
        return (theme as Theme).colors.success;
      case "warning":
        return (theme as Theme).colors.warning;
      case "error":
        return (theme as Theme).colors.error;
      case "info":
        return (theme as Theme).colors.info;
    }
  }};
`;

// Overlay to prevent interactions during resize
const ResizeOverlay = styled.div<{ $active: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9;
  cursor: col-resize;
  display: ${({ $active }) => ($active ? "block" : "none")};
`;

export const CharaWeb = () => {
  // Calculate default width (30% of viewport with constraints)
  const defaultWidth = Math.max(
    280,
    Math.min(
      600,
      typeof window !== "undefined" ? window.innerWidth * 0.3 : 320,
    ),
  );

  // State for chat panel width
  const [chatWidth, setChatWidth] = useState(defaultWidth);

  // State for active preview type
  const [activePreviewType, setActivePreviewType] = useState<PreviewType>(
    PreviewType.APP,
  );

  // State to track if we're currently resizing
  const [isResizing, setIsResizing] = useState(false);

  // Store the initial mouse position and panel width when resizing starts
  const resizeInfo = useRef({ startX: 0, startWidth: 0 });

  // Handle mouse down on resize handle
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeInfo.current = {
        startX: e.clientX,
        startWidth: chatWidth,
      };
      document.body.style.cursor = "col-resize";
    },
    [chatWidth],
  );

  // Handle mouse move during resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeInfo.current.startX;
      const newWidth = Math.max(
        280,
        Math.min(600, resizeInfo.current.startWidth + deltaX),
      );
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (chatWidth > window.innerWidth * 0.5) {
        setChatWidth(Math.max(280, window.innerWidth * 0.3));
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [chatWidth]);

  const renderPreviewContent = () => {
    switch (activePreviewType) {
      case PreviewType.APP:
        return (
          <AppPreview>
            <p>App preview will be displayed here</p>
          </AppPreview>
        );
      case PreviewType.CODE:
        return (
          <CodePreview>
            {`// Example generated code
                import React from 'react';
                import { Button } from './components/ui/button';
                
                export default function HomePage() {
                  return (
                    <div className="container mx-auto py-8">
                      <h1 className="text-2xl font-bold mb-4">Welcome to the App</h1>
                      <Button>Get Started</Button>
                    </div>
                  );
                }`}
          </CodePreview>
        );
      case PreviewType.TESTS:
        return (
          <TestsPreview>
            <TestItem $passed={true}>
              ✓ Button component renders correctly
            </TestItem>
            <TestItem $passed={true}>
              ✓ Navigation links work as expected
            </TestItem>
            <TestItem $passed={false}>
              ✗ Form validation handles empty fields
            </TestItem>
            <TestItem $passed={true}>
              ✓ API endpoints return correct data
            </TestItem>
          </TestsPreview>
        );
      case PreviewType.STATISTICS:
        return (
          <StatsGrid>
            <StatCard>
              <h3>Components</h3>
              <p>12</p>
            </StatCard>
            <StatCard>
              <h3>Pages</h3>
              <p>5</p>
            </StatCard>
            <StatCard>
              <h3>API Routes</h3>
              <p>8</p>
            </StatCard>
            <StatCard>
              <h3>Test Coverage</h3>
              <p>76%</p>
            </StatCard>
            <StatCard>
              <h3>Bundle Size</h3>
              <p>245KB</p>
            </StatCard>
            <StatCard>
              <h3>Dependencies</h3>
              <p>18</p>
            </StatCard>
          </StatsGrid>
        );
      case PreviewType.DOCUMENTATION:
        return (
          <>
            <DocsSection>
              <h2>Getting Started</h2>
              <p>
                This application uses Next.js with the App Router. To run the
                application locally, use the following command:
              </p>
              <code>npm run dev</code>
            </DocsSection>
            <DocsSection>
              <h2>API Reference</h2>
              <p>
                The API endpoints are available under <code>/api</code>.
                Authentication is required for most endpoints.
              </p>
            </DocsSection>
            <DocsSection>
              <h2>Component Usage</h2>
              <p>Import components from the UI library:</p>
              <code>import but from '@/components/ui/button';</code>
            </DocsSection>
          </>
        );
      case PreviewType.DEPLOYMENT:
        return (
          <>
            <DeploymentItem>
              <h3>
                Production <StatusBadge $status="success">Online</StatusBadge>
              </h3>
              <p>Last deployed 2 hours ago</p>
            </DeploymentItem>
            <DeploymentItem>
              <h3>
                Staging <StatusBadge $status="info">Updating</StatusBadge>
              </h3>
              <p>Deployment in progress</p>
            </DeploymentItem>
            <DeploymentItem>
              <h3>
                Development{" "}
                <StatusBadge $status="warning">Needs Attention</StatusBadge>
              </h3>
              <p>Build warnings detected</p>
            </DeploymentItem>
          </>
        );
      default:
        return <div>Select a preview type</div>;
    }
  };

  return (
    <>
      <UIStoreProvider>
        <ThemeProvider theme={theme}>
          <WorkspaceContainer>
            {/* Chat Panel */}
            <ChatColumn $width={chatWidth}>
              <ChatInterface />
            </ChatColumn>

            {/* Resize Handle */}
            <ResizeHandle
              onMouseDown={handleResizeStart}
              title="Drag to resize"
              aria-label="Resize panel"
            />

            {/* Preview Column */}
            <PreviewColumn>
              <PreviewContent>{renderPreviewContent()}</PreviewContent>
            </PreviewColumn>

            {/* Toolbar Column */}
            <ToolbarColumn>
              <PreviewToolbar
                activeType={activePreviewType}
                onTypeChange={setActivePreviewType}
              />
            </ToolbarColumn>

            {/* Overlay to prevent interactions during resize */}
            <ResizeOverlay $active={isResizing} />
          </WorkspaceContainer>
        </ThemeProvider>
      </UIStoreProvider>
    </>
  );
};
