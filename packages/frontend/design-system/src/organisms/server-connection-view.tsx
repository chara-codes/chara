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
  background-color: ${({ theme }) =>
    (theme as Theme).colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.md};
  padding: ${({ theme }) => (theme as Theme).spacing.md};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", "Ubuntu Mono",
    monospace;
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  position: relative;
  border-left: 3px solid ${({ theme }) => (theme as Theme).colors.primary};
  transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;
  display: flex;
  align-items: center;

  &:hover {
    border-left-color: ${({ theme }) => (theme as Theme).colors.primary};
    box-shadow: ${({ theme }) => (theme as Theme).shadows.sm};
  }

  &::before {
    content: "$ ";
    color: ${({ theme }) => (theme as Theme).colors.primary};
    margin-right: ${({ theme }) => (theme as Theme).spacing.sm};
    font-weight: bold;
  }
`;

const CommandText = styled.code`
  color: ${({ theme }) => (theme as Theme).colors.text};
  background: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: ${({ theme }) => (theme as Theme).typography.fontWeight.medium};
  flex: 1;
`;

const PackageManagerSelector = styled.div`
  display: flex;
  gap: ${({ theme }) => (theme as Theme).spacing.xs};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
`;

const PackageManagerButton = styled.button<{ $isActive: boolean }>`
  padding: ${({ theme }) => (theme as Theme).spacing.xs}
    ${({ theme }) => (theme as Theme).spacing.sm};
  border-radius: ${({ theme }) => (theme as Theme).borderRadius.sm};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  background-color: ${({ $isActive, theme }) =>
    $isActive
      ? (theme as Theme).colors.primary
      : (theme as Theme).colors.background};
  color: ${({ $isActive, theme }) =>
    $isActive
      ? (theme as Theme).colors.background
      : (theme as Theme).colors.text};
  font-family: "SF Mono", "Monaco", "Menlo", "Consolas", "Ubuntu Mono",
    monospace;
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.xs};
  cursor: pointer;
  transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;
  font-weight: ${({ $isActive, theme }) =>
    $isActive
      ? (theme as Theme).typography.fontWeight.semibold
      : (theme as Theme).typography.fontWeight.medium};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive
        ? (theme as Theme).colors.primary
        : (theme as Theme).colors.highlight};
    border-color: ${({ theme }) => (theme as Theme).colors.primary};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => (theme as Theme).spacing.sm};
  margin-bottom: ${({ theme }) => (theme as Theme).spacing.md};
  font-size: ${({ theme }) => (theme as Theme).typography.fontSize.sm};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  cursor: pointer;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${({ theme }) => (theme as Theme).colors.primary};
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => (theme as Theme).colors.border};
  border-radius: 20px;
  transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;

  &:before {
    content: "";
    position: absolute;
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: ${({ theme }) => (theme as Theme).colors.background};
    border-radius: 50%;
    transition: all ${({ theme }) => (theme as Theme).transitions.fast} ease;
  }
`;

const ToggleLabel = styled.span`
  font-family: ${({ theme }) => (theme as Theme).typography.fontFamily};
  user-select: none;
`;

const CopyButton = styled.button`
  margin-left: auto;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
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
    background-color: ${({ theme }) =>
      (theme as Theme).colors.backgroundSecondary};
    border-color: ${({ theme }) => (theme as Theme).colors.primary};
    color: ${({ theme }) => (theme as Theme).colors.primary};
  }

  &:active {
    background-color: ${({ theme }) => (theme as Theme).colors.highlight};
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

interface ServerConnectionViewProps {
  onBack: () => void;
}

const ServerConnectionView: React.FC<ServerConnectionViewProps> = ({
  onBack,
}) => {
  const { isConnected, isConnecting } = useRunnerConnection();
  const connect = useRunnerConnect();
  const wsStatus = useWebSocketStatus();
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [packageManager, setPackageManager] = useState<"bunx" | "npx" | "pnpm">(
    "npx"
  );
  const [enableAlpha, setEnableAlpha] = useState<boolean>(false);

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
    const packageName = enableAlpha
      ? "@chara-codes/cli@alpha"
      : "@chara-codes/cli";
    const command = `${
      packageManager === "pnpm" ? "pnpm dlx" : packageManager
    } ${packageName} dev`;
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
  }, [packageManager, enableAlpha]);

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
        leftElement={<div />}
      />

      <ConnectionContent>
        <IconWrapper>
          <IconContainer>◈</IconContainer>
        </IconWrapper>

        <Title>The Local Chara Codes Server Not Connected</Title>

        <Description>
          {!wsStatus.connected
            ? "Not connected to the local Chara Codes server."
            : !isConnected
            ? "Connected to Chara Codes, starting services..."
            : "Chara Codes is ready to use."}{" "}
          Please start the local Chara Codes server to continue.
        </Description>

        <CommandSection>
          <CommandTitle>› Start Local Chara Codes Server</CommandTitle>
          <PackageManagerSelector>
            <PackageManagerButton
              $isActive={packageManager === "npx"}
              onClick={() => setPackageManager("npx")}
              title="Use npx (npm)"
            >
              npx
            </PackageManagerButton>
            <PackageManagerButton
              $isActive={packageManager === "bunx"}
              onClick={() => setPackageManager("bunx")}
              title="Use bunx (Bun)"
            >
              bunx
            </PackageManagerButton>
            <PackageManagerButton
              $isActive={packageManager === "pnpm"}
              onClick={() => setPackageManager("pnpm")}
              title="Use pnpm dlx"
            >
              pnpm
            </PackageManagerButton>
          </PackageManagerSelector>
          <ToggleContainer>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={enableAlpha}
                onChange={(e) => setEnableAlpha(e.target.checked)}
              />
              <ToggleSlider />
            </ToggleSwitch>
            <ToggleLabel>Enable Alpha Version</ToggleLabel>
          </ToggleContainer>
          <CommandBlock>
            <CommandText>
              {packageManager === "pnpm" ? "pnpm dlx" : packageManager}{" "}
              {enableAlpha ? "@chara-codes/cli@alpha" : "@chara-codes/cli"} dev
            </CommandText>
            <CopyButton onClick={handleCopyCommand} title="Copy command">
              ⧉<span>{copyFeedback || "Copy"}</span>
            </CopyButton>
          </CommandBlock>

          <InstructionsList>
            <li>Open your terminal in the project directory</li>
            <li>Copy and run the command above</li>
            <li>Wait for "Chara Codes ready" message</li>
            <li>This interface will automatically connect</li>
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
              ? "Connecting to Chara Codes..."
              : wsStatus.reconnecting
              ? "Reconnecting to Chara Codes..."
              : isConnected && wsStatus.connected
              ? "Connected to Chara Codes"
              : wsStatus.connected
              ? "Connected, starting services..."
              : "Chara Codes offline"}
          </StatusIndicator>
        </ActionButtons>
      </ConnectionContent>
    </ConnectionContainer>
  );
};

export default ServerConnectionView;
