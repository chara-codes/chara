import { render } from "ink";
import { Layout } from "./components/index.js";

export interface UIOptions {
  onMessageSubmit?: (message: string) => void;
  onChatSelect?: (chatId: string) => void;
  isLoading?: boolean;
  currentFolder?: string;
  currentModel?: string;
}

export const startUI = (options: UIOptions = {}) => {
  const {
    onMessageSubmit,
    onChatSelect,
    isLoading,
    currentFolder,
    currentModel,
  } = options;

  const app = render(
    <Layout
      onMessageSubmit={onMessageSubmit}
      onChatSelect={onChatSelect}
      isLoading={isLoading}
      currentFolder={currentFolder}
      currentModel={currentModel}
    />
  );

  return {
    unmount: () => {
      app.unmount();
    },
    rerender: (newOptions: UIOptions) => {
      app.rerender(
        <Layout
          onMessageSubmit={newOptions.onMessageSubmit}
          onChatSelect={newOptions.onChatSelect}
          isLoading={newOptions.isLoading}
          currentFolder={newOptions.currentFolder}
          currentModel={newOptions.currentModel}
        />
      );
    },
  };
};

// Export components for external use
export * from "./components/index.js";

// Default export for convenience
export default startUI;
