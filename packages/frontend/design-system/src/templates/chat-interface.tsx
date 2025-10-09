"use client";

import type { Theme } from "@/theme";
import {
  Screen,
  useChatStore,
  useModelsStore,
  useNavigateToConversation,
  useNavigateToServerConnection,
  useProvidersStore,
  useRoutingStore,
  useRunnerConnect,
  useRunnerConnection,
  useWebSocketStatus,
} from "@chara-codes/core";
import type { ButtonConfig } from "@chara-codes/core";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import DebugPanel from "../molecules/debug-panel";
import Header from "../molecules/header";
import AddEditTechStackView from "../organisms/add-edit-tech-stack-view";
import ConversationView from "../organisms/conversation-view";
import HistoryView from "../organisms/history-view";
import ServerConnectionView from "../organisms/server-connection-view";
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
    providersStoreInitialized: false,
    chatStoreError: null as string | null,
    modelsStoreError: null as string | null,
    providersStoreError: null as string | null,
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Get store initialization functions
  const initializeChatStore = useChatStore((state) => state.initializeStore);
  const initializeModelsStore = useModelsStore(
    (state) => state.initializeStore
  );
  const initializeProvidersStore = useProvidersStore(
    (state) => state.initializeStore
  );

  const { isConnected, isConnecting } = useRunnerConnection();
  const connect = useRunnerConnect();

  // Also monitor WebSocket connection for comprehensive connection detection
  const wsStatus = useWebSocketStatus();

  // Connect to runner service on mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect().catch(console.error);
    }
  }, [isConnected, isConnecting, connect]);

  // Get routing state
  const currentScreen = useRoutingStore((state) => state.currentScreen);
  const navigateToConversation = useNavigateToConversation();
  const navigateToServerConnection = useNavigateToServerConnection();

  // Get chat store state
  const chats = useChatStore((state) => state.chats);
  const activeChat = useChatStore((state) => state.activeChat);
  const currentMessages = useChatStore((state) => state.currentMessages);
  const isChatsLoading = useChatStore((state) => state.isLoading);
  const chatsLoadError = useChatStore((state) => state.loadError);

  // Get models store state
  const isModelsLoading = useModelsStore((state) => state.isLoading);
  const modelsLoadError = useModelsStore((state) => state.loadError);

  // Get chat store actions using getState to avoid subscription issues
  const chatStore = useChatStore.getState();

  // Track previous connection state to detect connection loss
  const wasConnectedRef = useRef(isConnected);
  const wasWsConnectedRef = useRef(wsStatus.connected);
  const connectionLostTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSelectChatFromHistory = useCallback(
    async (chatId: string) => {
      try {
        await chatStore.setActiveChat(chatId);
        navigateToConversation();
      } catch (error) {
        console.error("Failed to load chat:", error);
        // Continue with navigation even if loading fails
      }
    },
    [chatStore, navigateToConversation]
  );

  const handleNewChat = useCallback(() => {
    // Don't create a new chat if the current chat is already "New Chat" with no messages
    if (activeChat) {
      const currentChat = chats.find((chat) => chat.id === activeChat);
      const hasNoMessages =
        currentMessages.length === 0 &&
        (!currentChat || currentChat.messages.length === 0);

      if (currentChat?.title === "New Chat" && hasNoMessages) {
        // Just navigate to conversation view without creating a new chat
        navigateToConversation();
        return;
      }
    }

    // Check if the last created chat in history is "New Chat" with no messages
    // Since chats are ordered with newest first, check the first chat in the array
    const lastCreatedChat = chats[0];
    if (
      lastCreatedChat?.title === "New Chat" &&
      lastCreatedChat.messages.length === 0
    ) {
      // Switch to the last created "New Chat" instead of creating a new one
      handleSelectChatFromHistory(lastCreatedChat.id);
      return;
    }

    chatStore.createNewChat("New Chat");
    navigateToConversation();
  }, [
    chatStore,
    navigateToConversation,
    activeChat,
    chats,
    currentMessages,
    handleSelectChatFromHistory,
  ]);

  // Initialize stores when component mounts
  useEffect(() => {
    const initializeStores = async () => {
      // Initialize chat store
      try {
        await initializeChatStore();
        setDebugInfo((prev) => ({ ...prev, chatStoreInitialized: true }));
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
        await initializeModelsStore();
        setDebugInfo((prev) => ({ ...prev, modelsStoreInitialized: true }));
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "ChatInterface: Models store initialization failed:",
          error
        );
        setDebugInfo((prev) => ({ ...prev, modelsStoreError: errorMsg }));
      }

      // Initialize providers store
      try {
        await initializeProvidersStore();
        setDebugInfo((prev) => ({ ...prev, providersStoreInitialized: true }));
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "ChatInterface: Providers store initialization failed:",
          error
        );
        setDebugInfo((prev) => ({ ...prev, providersStoreError: errorMsg }));
      }
    };

    initializeStores();
  }, [initializeChatStore, initializeModelsStore, initializeProvidersStore]);

  /**
   * Monitor connection loss and navigate to SERVER_CONNECTION screen with delay.
   *
   * This effect implements a 0.5 second delay before redirecting to the SERVER_CONNECTION
   * screen when connection is lost. This prevents immediate redirection for brief
   * connection drops and allows for quick reconnections without disrupting the user.
   *
   * Behavior:
   * - When connection is lost: Sets a 0.5s timeout before navigation
   * - If connection is restored before timeout: Cancels the navigation
   * - Prevents duplicate timeouts if effect runs multiple times
   * - Cleans up timeout on unmount or screen change
   */
  useEffect(() => {
    // Check if either Runner or WebSocket connection was lost
    const hadRunnerConnection = wasConnectedRef.current;
    const hadWsConnection = wasWsConnectedRef.current;
    const hasRunnerConnection = isConnected;
    const hasWsConnection = wsStatus.connected;

    // Connection is considered lost if we had either connection before but both are now down
    const connectionLost =
      (hadRunnerConnection || hadWsConnection) &&
      !hasRunnerConnection &&
      !hasWsConnection &&
      !isConnecting &&
      !wsStatus.reconnecting;

    // Connection is restored if we have any connection now
    const connectionRestored = hasRunnerConnection || hasWsConnection;

    if (connectionLost) {
      // Only set timeout if one isn't already pending
      if (connectionLostTimeoutRef.current) {
        console.log(
          "Connection lost timeout already pending, skipping duplicate"
        );
      } else {
        console.log(
          "Connection lost detected, starting 0.5s delay (Runner:",
          !hasRunnerConnection,
          ", WebSocket:",
          !hasWsConnection,
          ")"
        );

        // Set a timeout to navigate after 0.5 seconds
        connectionLostTimeoutRef.current = setTimeout(() => {
          // Double-check connection status before navigating
          const currentHasConnection = isConnected || wsStatus.connected;

          if (
            !currentHasConnection &&
            currentScreen !== Screen.SERVER_CONNECTION &&
            (debugInfo.chatStoreInitialized ||
              debugInfo.modelsStoreInitialized ||
              debugInfo.providersStoreInitialized)
          ) {
            navigateToServerConnection();
          }
          connectionLostTimeoutRef.current = null;
        }, 500); // 0.5 second delay
      }
    } else if (connectionRestored && connectionLostTimeoutRef.current) {
      // Connection was restored before timeout, cancel the navigation
      clearTimeout(connectionLostTimeoutRef.current);
      connectionLostTimeoutRef.current = null;
    }

    // Update the refs with current connection status
    wasConnectedRef.current = hasRunnerConnection;
    wasWsConnectedRef.current = hasWsConnection;
  }, [
    isConnected,
    isConnecting,
    wsStatus.connected,
    wsStatus.reconnecting,
    currentScreen,
    navigateToServerConnection,
    debugInfo.chatStoreInitialized,
    debugInfo.modelsStoreInitialized,
    debugInfo.providersStoreInitialized,
  ]);

  /**
   * Navigate back to conversation when connection is restored from SERVER_CONNECTION screen.
   *
   * This effect monitors for connection restoration and automatically returns the user
   * to the conversation view when any connection (Runner or WebSocket) is re-established.
   */
  useEffect(() => {
    // Connection is considered restored if either Runner or WebSocket is connected
    const hasAnyConnection = isConnected || wsStatus.connected;

    if (
      hasAnyConnection &&
      currentScreen === Screen.SERVER_CONNECTION &&
      (debugInfo.chatStoreInitialized ||
        debugInfo.modelsStoreInitialized ||
        debugInfo.providersStoreInitialized)
    ) {
      navigateToConversation();
    }
  }, [
    isConnected,
    wsStatus.connected,
    currentScreen,
    navigateToConversation,
    debugInfo.chatStoreInitialized,
    debugInfo.modelsStoreInitialized,
    debugInfo.providersStoreInitialized,
  ]);

  /**
   * Cleanup connection timeout on component unmount.
   *
   * Ensures that any pending connection loss timeout is cleared when the component
   * is unmounted to prevent memory leaks and unexpected navigation.
   */
  useEffect(() => {
    return () => {
      if (connectionLostTimeoutRef.current) {
        clearTimeout(connectionLostTimeoutRef.current);
      }
    };
  }, []);

  // Handle new thread navigation
  useEffect(() => {
    if (currentScreen === Screen.NEW_THREAD) {
      handleNewChat();
    }
  }, [currentScreen, handleNewChat]);

  const isLoading = isChatsLoading || isModelsLoading;
  const hasError = chatsLoadError || modelsLoadError;

  // Connection status variables (kept for potential future use)
  // const hasAnyConnection = isConnected || wsStatus.connected;
  // const isAnyConnecting = isConnecting || wsStatus.reconnecting;
  // const hasAnyConnectionError = connectionError || wsStatus.error;

  // Check if we have any active connection
  const hasAnyConnection = isConnected || wsStatus.connected;

  // Show ServerConnectionView when no connection (blocks all other views)
  if (!hasAnyConnection) {
    return (
      <Container>
        <Content>
          <ServerConnectionView onBack={navigateToConversation} />
        </Content>
      </Container>
    );
  }

  // Only show ServerConnectionView when explicitly on that screen
  if (currentScreen === Screen.SERVER_CONNECTION) {
    return (
      <Container>
        <Content>
          <ServerConnectionView onBack={navigateToConversation} />
        </Content>
      </Container>
    );
  }

  // Only show critical errors if we're stuck and can't proceed
  if (
    hasError &&
    !debugInfo.chatStoreInitialized &&
    !debugInfo.modelsStoreInitialized &&
    !debugInfo.providersStoreInitialized &&
    !isLoading &&
    currentScreen === Screen.CONVERSATION
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
                  console.log(
                    "- Providers store error:",
                    debugInfo.providersStoreError
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
                  initializeProvidersStore().catch(console.error);
                }}
              >
                Retry Connection
              </DebugButton>
              <DebugButton onClick={() => navigateToConversation()}>
                Continue Anyway
              </DebugButton>
            </div>
          </ErrorMessage>
        </Content>
      </Container>
    );
  }

  // Show loading only during true initial load
  if (
    isLoading &&
    !debugInfo.chatStoreInitialized &&
    !debugInfo.modelsStoreInitialized &&
    !debugInfo.providersStoreInitialized &&
    (isChatsLoading || isModelsLoading)
  ) {
    return (
      <Container>
        <Header title="Loading..." />
        <Content>
          <LoadingIndicator>
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
                <span>This may take a few moments on first load...</span>
              )}
            </div>
          </LoadingIndicator>
        </Content>
      </Container>
    );
  }

  // Render different screens based on routing state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case Screen.CONVERSATION:
      case Screen.NEW_THREAD:
        return <ConversationView />;

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
