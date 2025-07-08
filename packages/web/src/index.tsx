import styled, { ThemeProvider } from "styled-components";
import {
  ChatInterface,
  PreviewType,
  type Theme,
  theme,
  PreviewPanel,
} from "@apk/design-system";
import {
  UIStoreProvider,
  TrpcProvider,
  TechStacksProvider,
  Toaster,
} from "@apk/core";
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

  return (
    <>
      <TrpcProvider>
        <TechStacksProvider>
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
                  <PreviewPanel
                    activeType={activePreviewType}
                    onTypeChange={setActivePreviewType}
                  />
                </PreviewColumn>

                {/* Overlay to prevent interactions during resize */}
                <ResizeOverlay $active={isResizing} />

                <Toaster />
              </WorkspaceContainer>
            </ThemeProvider>
          </UIStoreProvider>
        </TechStacksProvider>
      </TrpcProvider>
    </>
  );
};
