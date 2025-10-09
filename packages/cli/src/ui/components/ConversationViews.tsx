import { Box, Text } from "ink";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ConversationViewsProps {
  messages?: Message[];
  isLoading?: boolean;
}

const ConversationViews = ({
  messages = [],
  isLoading = false,
}: ConversationViewsProps) => {
  const mockMessages: Message[] =
    messages.length > 0
      ? messages
      : [
          {
            id: "1",
            content: "Hello! How can I help you with your project today?",
            sender: "assistant",
            timestamp: new Date(),
          },
          {
            id: "2",
            content:
              "I need help setting up a new React component with TypeScript.",
            sender: "user",
            timestamp: new Date(),
          },
          {
            id: "3",
            content:
              "I'd be happy to help you create a React component with TypeScript. Let me guide you through the process step by step.",
            sender: "assistant",
            timestamp: new Date(),
          },
        ];

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      height="100%"
      flexGrow={1}
    >
      <Text bold color="white">
        Conversation Views
      </Text>

      <Box flexDirection="column" marginTop={1} height="100%" overflow="hidden">
        {mockMessages.length === 0 && !isLoading ? (
          <Box justifyContent="center" alignItems="center" height="100%">
            <Text color="gray" dimColor>
              Start a conversation...
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column" gap={1}>
            {mockMessages.map((message) => (
              <Box key={message.id} flexDirection="column" marginBottom={1}>
                <Box marginBottom={0}>
                  <Text
                    color={message.sender === "user" ? "blue" : "green"}
                    bold
                  >
                    {message.sender === "user" ? "You" : "Assistant"}
                  </Text>
                  <Text color="gray" dimColor marginLeft={1}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </Box>
                <Box paddingLeft={2}>
                  <Text wrap="wrap">{message.content}</Text>
                </Box>
              </Box>
            ))}

            {isLoading && (
              <Box paddingLeft={2}>
                <Text color="yellow">Assistant is typing...</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConversationViews;
