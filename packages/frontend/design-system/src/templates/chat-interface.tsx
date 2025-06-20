"use client";

import type React from "react";
import { useEffect, useCallback } from "react";
import styled from "styled-components";
import Header from "../molecules/header";
import ConversationView from "../organisms/conversation-view";
import HistoryView from "../organisms/history-view";
import SettingsView from "../organisms/settings-view";
import TechStacksView from "../organisms/tech-stacks-view";
import AddTechStackView from "../organisms/add-tech-stack-view";
import EditTechStackView from "../organisms/edit-tech-stack-view";
import TerminalView from "../organisms/terminal-view";
import {
  useChatStore,
  useRunnerConnect,
  useRunnerConnection,
} from "@chara/core";
import { useModelsStore } from "@chara/core";
import {
  useRoutingStore,
  Screen,
  useNavigateToConversation,
} from "@chara/core";
import type { Theme } from "@/theme";
import type { ButtonConfig } from "@chara/core";

const Container = styled.div`
  all: revert;
  * {
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
    box-sizing: border-box;
  }

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border: 1px solid ${({ theme }) => (theme as Theme).colors.border};
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 14px;
  color: ${({ theme }) => (theme as Theme).colors.textSecondary};
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  text-align: center;

  h3 {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => (theme as Theme).colors.error};
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => (theme as Theme).colors.textSecondary};
    max-width: 400px;
  }
`;

const DebugButton = styled.button`
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background-color: #e5e7eb;
  }
`;

interface ChatInterfaceProps {
  buttonConfig?: ButtonConfig[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  // Get store initialization functions
  const initializeChatStore = useChatStore((state) => state.initializeStore);
  const initializeModelsStore = useModelsStore(
    (state) => state.initializeStore,
  );

  const { isConnected, isConnecting } = useRunnerConnection();
  const connect = useRunnerConnect();

  // Connect to runner service on mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isConnected, isConnecting]);

  // Get routing state
  const currentScreen = useRoutingStore((state) => state.currentScreen);
  const navigateToConversation = useNavigateToConversation();

  // Get chat store state
  const chats = useChatStore((state) => state.chats);
  const isChatsLoading = useChatStore((state) => state.isLoading);
  const chatsLoadError = useChatStore((state) => state.loadError);

  // Get models store state
  const isModelsLoading = useModelsStore((state) => state.isLoading);
  const modelsLoadError = useModelsStore((state) => state.loadError);

  // Get chat store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  // Memoize handlers to prevent unnecessary re-renders
  const handleSelectChatFromHistory = useCallback(
    (chatId: string) => {
      chatStore.setActiveChat(chatId);
      navigateToConversation();
    },
    [chatStore, navigateToConversation],
  );

  const handleNewChat = useCallback(() => {
    chatStore.createNewChat();
    navigateToConversation();
  }, [chatStore, navigateToConversation]);

  // Initialize stores when component mounts
  useEffect(() => {
    initializeChatStore();
    initializeModelsStore();
  }, [initializeChatStore, initializeModelsStore]);

  // Handle new thread navigation
  useEffect(() => {
    if (currentScreen === Screen.NEW_THREAD) {
      handleNewChat();
    }
  }, [currentScreen, handleNewChat]);

  const isLoading = isChatsLoading || isModelsLoading;
  const hasError = chatsLoadError || modelsLoadError;

  // Update the error message section to include a debug button
  if (hasError) {
    return (
      <Container>
        <Header title="Error" />
        <Content>
          <ErrorMessage>
            <h3>Error Loading Data</h3>
            <p>
              {chatsLoadError || modelsLoadError}
              <br />
              Using fallback data instead. Some features may be limited.
            </p>
            <DebugButton
              onClick={() => {
                console.log("Debug info:");
                console.log("- Window location:", window.location.href);
                console.log("- Base URL:", document.baseURI);
                alert("Debug info logged to console");
              }}
            >
              Debug Info
            </DebugButton>
            {typeof window !== "undefined" &&
              window.location.hostname === "localhost" && (
                <DebugButton
                  onClick={() => {
                    console.log("Forced reload");
                    window.location.reload();
                  }}
                >
                  Force Reload
                </DebugButton>
              )}
          </ErrorMessage>
        </Content>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <Header title="Loading..." />
        <Content>
          <LoadingIndicator>Loading data...</LoadingIndicator>
        </Content>
      </Container>
    );
  }

  // Render different screens based on routing state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case Screen.HISTORY:
        return (
          <HistoryView
            onBack={navigateToConversation}
            chats={chats}
            onSelectChat={handleSelectChatFromHistory}
          />
        );

      case Screen.SETTINGS:
        return <SettingsView onBack={navigateToConversation} />;

      case Screen.TECH_STACKS:
        return <TechStacksView />;

      case Screen.ADD_TECH_STACK:
        return <AddTechStackView />;

      case Screen.EDIT_TECH_STACK:
        return <EditTechStackView />;

      case Screen.TERMINAL:
        // Sample terminal logs for demonstration
        const sampleLogs = [
          {
            id: "log-1",
            type: "stdout" as const,
            content:
              "✓ Installing dependencies...\n✓ @chara/core@1.0.0 installed successfully",
            timestamp: new Date(Date.now() - 60000),
            exitCode: 0,
          },
          {
            id: "log-2",
            type: "stdout" as const,
            content:
              "Building application...\n✓ Build completed in 2.3s\n✓ Output: dist/",
            timestamp: new Date(Date.now() - 45000),
            exitCode: 0,
          },
          {
            id: "log-3",
            type: "stdout" as const,
            content:
              "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
            timestamp: new Date(Date.now() - 30000),
            exitCode: 0,
          },
          {
            id: "log-4",
            type: "stderr" as const,
            content:
              "Error: Command 'deploy' failed\nPermission denied: /var/www/html",
            timestamp: new Date(Date.now() - 15000),
            exitCode: 1,
          },
        ];

        // Sample server information
        const sampleServerInfo = {
          serverUrl: "https://api.chara.dev",
          name: "chara-dev-server",
          status: "active",
          os: "Ubuntu 22.04 LTS",
          shell: "/bin/bash",
          cwd: "/home/user/projects/chara",
          command: "npm run dev",
        };

        return (
          <TerminalView
            onBack={navigateToConversation}
            logs={sampleLogs}
            serverInfo={sampleServerInfo}
          />
        );

      default:
        return <ConversationView />;
    }
  };

  return (
    <Container>
      <Header />
      <Content>{renderCurrentScreen()}</Content>
    </Container>
  );
};
