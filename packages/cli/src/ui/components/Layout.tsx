import { Box } from "ink";
import ChatsHistory from "./ChatsHistory.js";
import ConversationViews from "./ConversationViews.js";
import DevServerInfo from "./DevServerInfo.js";
import ServerLogs from "./ServerLogs.js";
import TextInput from "./TextInput.js";

interface LayoutProps {
  onMessageSubmit?: (message: string) => void;
  onChatSelect?: (chatId: string) => void;
  isLoading?: boolean;
  currentFolder?: string;
  currentModel?: string;
}

const Layout = ({
  onMessageSubmit,
  onChatSelect,
  isLoading = false,
  currentFolder,
  currentModel,
}: LayoutProps) => {
  return (
    <Box flexDirection="column" height="100%" width="100%">
      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1} height="85%">
        {/* Left sidebar - Chats History */}
        <ChatsHistory onChatSelect={onChatSelect} />

        {/* Center area - Conversation Views */}
        <Box flexGrow={1}>
          <ConversationViews isLoading={isLoading} />
        </Box>

        {/* Right sidebar */}
        <Box flexDirection="column" width={30}>
          {/* Top right - Dev Server Info */}
          <DevServerInfo />

          {/* Bottom right - Server Logs */}
          <Box flexGrow={1} marginTop={1}>
            <ServerLogs />
          </Box>
        </Box>
      </Box>

      {/* Bottom area - Text Input */}
      <Box height="15%" marginTop={1}>
        <TextInput
          onSubmit={onMessageSubmit}
          currentFolder={currentFolder}
          currentModel={currentModel}
          placeholder="Type your message and press Enter..."
        />
      </Box>
    </Box>
  );
};

export default Layout;
