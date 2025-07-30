import { Box, Text } from "ink";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  isActive?: boolean;
}

interface ChatsHistoryProps {
  chats?: Chat[];
  onChatSelect?: (chatId: string) => void;
}

const ChatsHistory = ({ chats = [], onChatSelect }: ChatsHistoryProps) => {
  const mockChats: Chat[] =
    chats.length > 0
      ? chats
      : [
          {
            id: "1",
            title: "Setup Project",
            timestamp: new Date(),
            isActive: true,
          },
          { id: "2", title: "Debug API Issue", timestamp: new Date() },
          { id: "3", title: "Code Review", timestamp: new Date() },
          { id: "4", title: "Database Schema", timestamp: new Date() },
          { id: "5", title: "Performance Optimization", timestamp: new Date() },
        ];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      height="100%"
      width={25}
    >
      <Text bold color="white">
        Chats History
      </Text>

      <Box flexDirection="column" marginTop={1}>
        {mockChats.map((chat, index) => (
          <Box
            key={chat.id}
            marginBottom={index < mockChats.length - 1 ? 1 : 0}
          >
            <Text color={chat.isActive ? "blue" : "gray"} bold={chat.isActive}>
              {chat.title.length > 20
                ? chat.title.substring(0, 20) + "..."
                : chat.title}
            </Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {mockChats.length} conversation{mockChats.length !== 1 ? "s" : ""}
        </Text>
      </Box>
    </Box>
  );
};

export default ChatsHistory;
