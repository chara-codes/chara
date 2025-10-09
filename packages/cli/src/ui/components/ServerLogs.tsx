import { Box, Text } from "ink";

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: Date;
  source?: string;
}

interface ServerLogsProps {
  logs?: LogEntry[];
  maxLogs?: number;
}

const ServerLogs = ({ logs = [], maxLogs = 10 }: ServerLogsProps) => {
  const mockLogs: LogEntry[] =
    logs.length > 0
      ? logs
      : [
          {
            id: "1",
            level: "info",
            message: "Server started on port 3000",
            timestamp: new Date(Date.now() - 120000),
            source: "server",
          },
          {
            id: "2",
            level: "info",
            message: "Database connected successfully",
            timestamp: new Date(Date.now() - 100000),
            source: "db",
          },
          {
            id: "3",
            level: "warn",
            message: "API rate limit approaching",
            timestamp: new Date(Date.now() - 80000),
            source: "api",
          },
          {
            id: "4",
            level: "info",
            message: "New client connected",
            timestamp: new Date(Date.now() - 60000),
            source: "websocket",
          },
          {
            id: "5",
            level: "error",
            message: "Failed to load configuration file",
            timestamp: new Date(Date.now() - 40000),
            source: "config",
          },
          {
            id: "6",
            level: "info",
            message: "Compilation completed successfully",
            timestamp: new Date(Date.now() - 20000),
            source: "build",
          },
        ];

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "red";
      case "warn":
        return "yellow";
      case "info":
        return "white";
      case "debug":
        return "gray";
      default:
        return "white";
    }
  };

  const getLogIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "✗";
      case "warn":
        return "⚠";
      case "info":
        return "ℹ";
      case "debug":
        return "→";
      default:
        return "•";
    }
  };

  const displayLogs = mockLogs.slice(-maxLogs);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      height="100%"
      width={30}
    >
      <Text bold color="white">
        Server Logs
      </Text>

      <Box flexDirection="column" marginTop={1} overflow="hidden">
        {displayLogs.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height="100%">
            <Text color="gray" dimColor>
              No logs available
            </Text>
          </Box>
        ) : (
          displayLogs.map((log) => (
            <Box key={log.id} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={getLogColor(log.level)}>
                  {getLogIcon(log.level)}
                </Text>
                <Text color="gray" dimColor marginLeft={1}>
                  {log.timestamp.toLocaleTimeString()}
                </Text>
                {log.source && (
                  <Text color="blue" marginLeft={1}>
                    [{log.source}]
                  </Text>
                )}
              </Box>
              <Box paddingLeft={2}>
                <Text color={getLogColor(log.level)} wrap="wrap">
                  {log.message.length > 40
                    ? log.message.substring(0, 40) + "..."
                    : log.message}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {displayLogs.length} of {mockLogs.length} logs
        </Text>
      </Box>
    </Box>
  );
};

export default ServerLogs;
