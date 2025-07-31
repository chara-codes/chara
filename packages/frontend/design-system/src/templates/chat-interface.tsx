"use client";

import type { Theme } from "@/theme";
import {
  Screen,
  useChatStore,
  useModelsStore,
  useNavigateToConversation,
  useRoutingStore,
  useRunnerConnect,
  useRunnerConnection,
} from "@chara-codes/core";
import type { ButtonConfig } from "@chara-codes/core";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import DebugPanel from "../molecules/debug-panel";
import Header from "../molecules/header";
import AddEditTechStackView from "../organisms/add-edit-tech-stack-view";
import ConversationView from "../organisms/conversation-view";
import HistoryView from "../organisms/history-view";
import SettingsView from "../organisms/settings-view";
import TechStacksView from "../organisms/tech-stacks-view";
import TerminalView from "../organisms/terminal-view";

const Container = styled.div`
  all: revert;
  * {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
      sans-serif;
    box-sizing: border-box;
  }

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => (theme as Theme).colors.background};
  border-width: 0px;
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
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    chatStoreInitialized: false,
    modelsStoreInitialized: false,
    chatStoreError: null as string | null,
    modelsStoreError: null as string | null,
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Get store initialization functions
  const initializeChatStore = useChatStore((state) => state.initializeStore);
  const initializeModelsStore = useModelsStore(
    (state) => state.initializeStore
  );

  const { isConnected, isConnecting } = useRunnerConnection();
  const connect = useRunnerConnect();

  // Connect to runner service on mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isConnected, isConnecting, connect]);

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
    async (chatId: string) => {
      try {
        await chatStore.setActiveChat(chatId);
        navigateToConversation();
      } catch (error) {
        console.error("Failed to load chat:", error);
        // Continue with navigation even if loading fails
        navigateToConversation();
      }
    },
    [chatStore, navigateToConversation]
  );

  const handleNewChat = useCallback(() => {
    chatStore.createNewChat();
    navigateToConversation();
  }, [chatStore, navigateToConversation]);

  // Initialize stores when component mounts
  useEffect(() => {
    const initializeStores = async () => {
      console.log("ChatInterface: Starting store initialization...");

      // Initialize chat store
      try {
        console.log("ChatInterface: Initializing chat store...");
        await initializeChatStore();
        setDebugInfo((prev) => ({ ...prev, chatStoreInitialized: true }));
        console.log("ChatInterface: Chat store initialized successfully");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "ChatInterface: Chat store initialization failed:",
          error
        );
        setDebugInfo((prev) => ({ ...prev, chatStoreError: errorMsg }));
      }

      // Initialize models store
      try {
        console.log("ChatInterface: Initializing models store...");
        await initializeModelsStore();
        setDebugInfo((prev) => ({ ...prev, modelsStoreInitialized: true }));
        console.log("ChatInterface: Models store initialized successfully");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "ChatInterface: Models store initialization failed:",
          error
        );
        setDebugInfo((prev) => ({ ...prev, modelsStoreError: errorMsg }));
      }

      console.log("ChatInterface: Store initialization complete");
    };

    initializeStores();
  }, [initializeChatStore, initializeModelsStore]);

  // Handle new thread navigation
  useEffect(() => {
    if (currentScreen === Screen.NEW_THREAD) {
      handleNewChat();
    }
  }, [currentScreen, handleNewChat]);

  const isLoading = isChatsLoading || isModelsLoading;
  const hasError = chatsLoadError || modelsLoadError;

  // Show error with options to continue or debug
  if (
    hasError &&
    !debugInfo.chatStoreInitialized &&
    !debugInfo.modelsStoreInitialized
  ) {
    return (
      <Container>
        <Header title="Connection Issues" />
        <Content>
          <ErrorMessage>
            <h3>Unable to Load Data</h3>
            <p>
              {chatsLoadError || modelsLoadError}
              <br />
              This might be due to network issues or the backend server being
              unavailable.
            </p>
            <div style={{ marginTop: "16px" }}>
              <DebugButton
                onClick={() => {
                  console.log("Debug info:");
                  console.log("- Window location:", window.location.href);
                  console.log("- Base URL:", document.baseURI);
                  console.log("- Chat store error:", debugInfo.chatStoreError);
                  console.log(
                    "- Models store error:",
                    debugInfo.modelsStoreError
                  );
                  console.log("- Runner connected:", isConnected);
                  alert("Debug info logged to console");
                }}
              >
                Debug Info
              </DebugButton>
              <DebugButton
                onClick={() => {
                  // Retry initialization
                  initializeChatStore().catch(console.error);
                  initializeModelsStore().catch(console.error);
                }}
              >
                Retry Connection
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
            </div>
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
          <LoadingIndicator>
            Loading data...
            <div style={{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}>
              Chat Store:{" "}
              {debugInfo.chatStoreInitialized
                ? "✓ Ready"
                : isChatsLoading
                ? "⏳ Loading..."
                : "❌ Failed"}
              {debugInfo.chatStoreError && ` (${debugInfo.chatStoreError})`}
              <br />
              Models Store:{" "}
              {debugInfo.modelsStoreInitialized
                ? "✓ Ready"
                : isModelsLoading
                ? "⏳ Loading..."
                : "❌ Failed"}
              {debugInfo.modelsStoreError && ` (${debugInfo.modelsStoreError})`}
              <br />
              Runner:{" "}
              {isConnected
                ? "✓ Connected"
                : isConnecting
                ? "⏳ Connecting..."
                : "❌ Disconnected"}
              <br />
              <br />
              {(isChatsLoading || isModelsLoading) && (
                <span style={{ color: "#666" }}>
                  This may take a few moments on first load...
                </span>
              )}
              <br />
              <DebugButton
                onClick={async () => {
                  console.log("🧪 Running WebSocket debug test...");
                  try {
                    // Import test dynamically
                    const { quickConnectionTest } = await import(
                      "@chara-codes/core"
                    );
                    const result = await quickConnectionTest();
                    console.log("Test result:", result);
                    alert(
                      `WebSocket test ${
                        result ? "passed" : "failed"
                      }. Check console for details.`
                    );
                  } catch (error) {
                    console.error("Debug test failed:", error);
                    alert("Debug test failed. Check console for details.");
                  }
                }}
              >
                Test Connection
              </DebugButton>
              <DebugButton onClick={() => setShowDebugPanel(true)}>
                Debug Panel
              </DebugButton>
            </div>
          </LoadingIndicator>
        </Content>
        <DebugPanel
          visible={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />
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
        return <AddEditTechStackView mode="add" />;

      case Screen.EDIT_TECH_STACK:
        return <AddEditTechStackView mode="edit" />;

      case Screen.TERMINAL: {
        // Sample terminal logs for demonstration
        return <TerminalView onBack={navigateToConversation} />;
      }

      default:
        return <ConversationView />;
    }
  };

  return (
    <Container>
      <Header />
      <Content>{renderCurrentScreen()}</Content>
      <DebugPanel
        visible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </Container>
  );
};
