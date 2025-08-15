"use client";

import { useWebSocketStatus } from "@chara-codes/core";
import {
  useRunnerConnect,
  useRunnerConnection,
} from "@chara-codes/core/stores";
import type React from "react";
import { useCallback, useState } from "react";
import styled from "styled-components";
import Button from "../atoms/button";
import ViewNavigation from "../molecules/view-navigation";
import type { Theme } from "../theme";

const ConnectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
`;

const ConnectionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => (theme as Theme).spacing.xl};
  font-family: ${({ theme }) => (theme as Theme).typography.fontFamily};
  color: ${({ theme }) => (theme as Theme).colors.text};
  text-align: center;
`;

const IconWrapper = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.lg};
  opacity: 0.8;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  animation: gentle-bounce 2s ease-in-out infinite;

  @keyframes gentle-bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xl};
  font-weight: ${({ theme }) =>
    (theme as Theme).typography.fontWeight.semibold};
  color: ${({ theme }) => (theme as Theme).colors.error};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
  font-family: ${({ theme }) => (theme as Theme).typography.fontFamily};
`;

const Description = styled.p`
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.md};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.xl};
  max-width: 500px;
  line-height: ${({ theme }) => (theme as Theme).typography.lineHeight.normal};
`;

const CommandSection = styled.div`
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.lg};
  padding: ${({ theme }) => (theme as Theme).spacing.lg};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.xl};
  max-width: 600px;
  width: 100%;
  box-shadow: ${({ theme }) => (theme as Theme).shadows.sm};
`;

const CommandTitle = styled.h3`
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.md};
  color: ${({ theme }) => (theme as Theme).colors.text};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
  font-weight: ${({ theme }) =>
    (theme as Theme).typography.fontWeight.semibold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.sm};
`;

const CommandBlock = styled.div`
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.md};
  padding: ${({ theme }) => (theme as Theme).spacing.md};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", "Ubuntu Mono",
    monospace;
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  position: relative;
  border-left: 3px solid #00ff41;
  transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;
  display: flex;
  align-items: center;

  &:hover {
    border-left-color: #00ff41;
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.1);
  }

  &::before {
    content: "$ ";
    color: #00ff41;
    margin-right: ${({ theme }) => (theme as Theme).spacing.sm};
    font-weight: bold;
  }
`;

const CommandText = styled.code`
  color: #00ff41;
  background: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: ${({ theme }) => (theme as Theme).typography.fontWeight.medium};
`;

const CopyButton = styled.button`
  margin-left: auto;
  background-color: #2a2a2a;
  border: 1px solid #444;
  color: #ccc;
  padding: ${({ theme }) => (theme as Theme).spacing.sm};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  cursor: pointer;
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", "Ubuntu Mono",
    monospace;
  transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.xs};

  &:hover {
    background-color: #333;
    border-color: #00ff41;
    color: #00ff41;
  }

  &:active {
    background-color: #1a1a1a;
    transform: translateY(1px);
  }
`;

const InstructionsList = styled.ul`
  text-align: left;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  line-height: ${({ theme }) => (theme as Theme).typography.lineHeight.normal};
  margin: 0;
  padding-left: 20px;

  li {
    margin-bottom: ${({ theme }) => (theme as Theme).spacing.sm};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as Theme).spacing.md};
  align-items: center;
`;

const StatusIndicator = styled.div<{ $isConnecting: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.sm};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  color: ${({ $isConnecting, theme }) =>
    $isConnecting
      ? (theme as Theme).colors.warning
      : (theme as Theme).colors.textSecondary};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ $isConnecting, theme }) =>
      $isConnecting
        ? (theme as Theme).colors.warning
        : (theme as Theme).colors.error};
    animation: ${({ $isConnecting }) =>
      $isConnecting ? "pulse 1.5s infinite" : "none"};
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const TroubleshootingSection = styled.div`
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.lg};
  padding: 20px;
  margin-top: ${({ theme }) => (theme as Theme).spacing.lg};
  max-width: 600px;
  width: 100%;
  text-align: left;
  box-shadow: ${({ theme }) => (theme as Theme).shadows.sm};
`;

const TroubleshootingTitle = styled.h4`
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  color: ${({ theme }) => (theme as Theme).colors.text};
  margin-bottom: 12px;
  font-weight: ${({ theme }) =>
    (theme as Theme).typography.fontWeight.semibold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.sm};
`;

const IconContainer = styled.div`
  background: linear-gradient(
    135deg,
    ${({ theme }) => (theme as Theme).colors.highlight} 0%,
    ${({ theme }) => (theme as Theme).colors.border} 100%
  );
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
  border: 3px solid ${({ theme }) => (theme as Theme).colors.border};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => (theme as Theme).colors.error};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.sm};
`;

const ErrorMessageWs = styled.div`
  color: ${({ theme }) => (theme as Theme).colors.error};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
`;

interface ServerConnectionViewProps {
  onBack: () => void;
}

const ServerConnectionView: React.FC<ServerConnectionViewProps> = ({
  onBack,
}) => {
  const { isConnected, isConnecting, connectionError } = useRunnerConnection();
  const connect = useRunnerConnect();
  const wsStatus = useWebSocketStatus();
  const [copyFeedback, setCopyFeedback] = useState<string>("");

  const handleRetryConnection = useCallback(async () => {
    try {
      // Only try to reconnect the runner service
      // WebSocket service handles its own reconnection automatically
      console.log("Attempting to reconnect Runner service...");
      await connect();
    } catch (error) {
      console.error("Runner reconnection failed:", error);
    }
  }, [connect]);

  const handleCopyCommand = useCallback(() => {
    const command = "bunx @chara-codes/cli dev";
    navigator.clipboard
      .writeText(command)
      .then(() => {
        setCopyFeedback("Copied!");
        setTimeout(() => setCopyFeedback(""), 2000);
      })
      .catch(() => {
        setCopyFeedback("Failed to copy");
        setTimeout(() => setCopyFeedback(""), 2000);
      });
  }, []);

  return (
    <ConnectionContainer>
      <ViewNavigation
        onBack={onBack}
        searchQuery=""
        onSearchChange={() => {
          /* no-op */
        }}
        placeholder=""
        showSearch={false}
      />

      <ConnectionContent>
        <IconWrapper>
          <IconContainer>◈</IconContainer>
        </IconWrapper>

        <Title>Development Server Not Connected</Title>

        <Description>
          Chara needs a running development server to work properly.{" "}
          {!wsStatus.connected
            ? "No connection to development server detected."
            : !isConnected
            ? "Connected to server, initializing runner services..."
            : "Development server ready."}{" "}
          Please start your development server to continue.
        </Description>

        <CommandSection>
          <CommandTitle>› Quick Start</CommandTitle>
          <CommandBlock>
            <CommandText>bunx @chara-codes/cli dev</CommandText>
            <CopyButton onClick={handleCopyCommand} title="Copy command">
              ⧉<span>{copyFeedback || "Copy"}</span>
            </CopyButton>
          </CommandBlock>

          <InstructionsList>
            <li>Open your terminal in the project directory</li>
            <li>Copy and run the command above</li>
            <li>Wait for "Server ready" message</li>
            <li>The interface will automatically reconnect</li>
          </InstructionsList>
        </CommandSection>

        <ActionButtons>
          {!isConnecting && (
            <Button
              variant="primary"
              size="md"
              onClick={handleRetryConnection}
              disabled={isConnecting}
            >
              {!isConnecting && "↻"}
              {isConnecting ? "Connecting..." : "Retry Connection"}
            </Button>
          )}

          <StatusIndicator
            $isConnecting={isConnecting || wsStatus.reconnecting}
          >
            {isConnecting
              ? "Connecting to development server..."
              : wsStatus.reconnecting
              ? "Reconnecting to development server..."
              : isConnected && wsStatus.connected
              ? "Development server connected"
              : wsStatus.connected
              ? "WebSocket connected, runner services starting..."
              : "Development server offline"}
          </StatusIndicator>
        </ActionButtons>
      </ConnectionContent>
    </ConnectionContainer>
  );
};

export default ServerConnectionView;
