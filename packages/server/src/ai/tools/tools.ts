import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';

export const fileTool = async () => {
    // Initialize an MCP client to connect to a `stdio` MCP server:
    const transport = new Experimental_StdioMCPTransport({
      command: 'npx',
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/Andrii_Shutov/Git/chara"
      ],
    });
    const fileClient = await experimental_createMCPClient({
      transport,
    });
    return fileClient.tools();
}

export const sequintialThinking = async () => {
  const transport = new Experimental_StdioMCPTransport({
    command: 'npx',
    args: [
      "-y",
      "@modelcontextprotocol/server-sequential-thinking",
    ],
  });
  const st = await experimental_createMCPClient({
    transport,
  });
  return st.tools();
}