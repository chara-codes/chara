"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import type { Theme } from "../theme";
import { RefreshIcon, ExternalLinkIcon } from "../atoms/icons";

interface AppPreviewProps {
  // URL of the running application
  url?: string;
  // Future props for customization
  placeholder?: string;
  isLoading?: boolean;
  // Whether to show the URL bar and controls
  showControls?: boolean;
  // Callback when iframe loads
  onLoad?: () => void;
  // Callback when iframe fails to load
  onError?: (error: string) => void;
}

const AppPreviewContainer = styled.div<{ $hasUrl: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  border-radius: 8px;
  border: 1px ${({ $hasUrl }) => ($hasUrl ? "solid" : "dashed")}
    ${({ theme }) => (theme as Theme).colors?.border};
  overflow: hidden;
`;

const PreviewControls = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: ${({ theme }) =>
    (theme as Theme).colors?.backgroundSecondary};
  border-bottom: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  gap: 8px;
  flex-shrink: 0;
`;

const UrlDisplay = styled.div`
  flex: 1;
  font-size: 12px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  background-color: ${({ theme }) => (theme as Theme).colors?.background};
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => (theme as Theme).colors?.border};
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => (theme as Theme).colors?.border};
    color: ${({ theme }) => (theme as Theme).colors?.text};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const IframeContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background-color: white;
`;

const PlaceholderContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const PlaceholderText = styled.p`
  margin: 0;
  padding: 20px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => (theme as Theme).colors?.textSecondary};
  z-index: 10;
`;

export const AppPreview: React.FC<AppPreviewProps> = ({
  url,
  placeholder = "App preview will be displayed here",
  isLoading = false,
  showControls = true,
  onLoad,
  onError,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setIframeError(null);
    onLoad?.();
  }, [onLoad]);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    const errorMessage = "Failed to load application";
    setIframeError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && url) {
      setIframeLoading(true);
      setIframeError(null);
      iframeRef.current.src = url;
    }
  }, [url]);

  const handleOpenExternal = useCallback(() => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [url]);

  const hasUrl = Boolean(url);

  return (
    <AppPreviewContainer $hasUrl={hasUrl}>
      {hasUrl && showControls && (
        <PreviewControls>
          <UrlDisplay>{url}</UrlDisplay>
          <ControlButton onClick={handleRefresh} title="Refresh">
            <RefreshIcon width={14} height={14} />
          </ControlButton>
          <ControlButton onClick={handleOpenExternal} title="Open in new tab">
            <ExternalLinkIcon width={14} height={14} />
          </ControlButton>
        </PreviewControls>
      )}

      {hasUrl ? (
        <IframeContainer>
          <PreviewIframe
            ref={iframeRef}
            src={url}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Application Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
          {(iframeLoading || isLoading) && (
            <LoadingOverlay>Loading app preview...</LoadingOverlay>
          )}
          {iframeError && (
            <LoadingOverlay>
              <div>
                <p>Failed to load application</p>
                <p style={{ fontSize: "12px", marginTop: "8px" }}>
                  Try refreshing or check if the application is running
                </p>
              </div>
            </LoadingOverlay>
          )}
        </IframeContainer>
      ) : (
        <PlaceholderContainer>
          <PlaceholderText>
            {isLoading ? "Loading app preview..." : placeholder}
          </PlaceholderText>
        </PlaceholderContainer>
      )}
    </AppPreviewContainer>
  );
};
