import { Box, Text } from "ink";

interface ServerInfo {
  status: "running" | "stopped" | "error";
  port?: number;
  url?: string;
  uptime?: string;
  version?: string;
}

interface DevServerInfoProps {
  serverInfo?: ServerInfo;
}

const DevServerInfo = ({ serverInfo }: DevServerInfoProps) => {
  const mockServerInfo: ServerInfo = serverInfo || {
    status: "running",
    port: 3000,
    url: "http://localhost:3000",
    uptime: "2h 34m",
    version: "1.0.0",
  };

  const getStatusColor = (status: ServerInfo["status"]) => {
    switch (status) {
      case "running":
        return "green";
      case "stopped":
        return "red";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status: ServerInfo["status"]) => {
    switch (status) {
      case "running":
        return "● Running";
      case "stopped":
        return "● Stopped";
      case "error":
        return "● Error";
      default:
        return "● Unknown";
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      height={12}
      width={30}
    >
      <Text bold color="white">
        Dev Server Info
      </Text>

      <Box flexDirection="column" marginTop={1} gap={1}>
        <Box>
          <Text color="gray">Status: </Text>
          <Text color={getStatusColor(mockServerInfo.status)} bold>
            {getStatusText(mockServerInfo.status)}
          </Text>
        </Box>

        {mockServerInfo.port && (
          <Box>
            <Text color="gray">Port: </Text>
            <Text color="white">{mockServerInfo.port}</Text>
          </Box>
        )}

        {mockServerInfo.url && (
          <Box>
            <Text color="gray">URL: </Text>
            <Text color="cyan">{mockServerInfo.url}</Text>
          </Box>
        )}

        {mockServerInfo.uptime && (
          <Box>
            <Text color="gray">Uptime: </Text>
            <Text color="white">{mockServerInfo.uptime}</Text>
          </Box>
        )}

        {mockServerInfo.version && (
          <Box>
            <Text color="gray">Version: </Text>
            <Text color="white">{mockServerInfo.version}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DevServerInfo;
