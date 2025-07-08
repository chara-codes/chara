import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { MCPServer, ActiveClient } from '../types/index.ts';
import { logger } from "@apk/logger";


const WAIT_INTERVAL = 2500
const RETRIES = 3

const createClient = (name: string, server: MCPServer): { client: Client | undefined, transport: Transport | undefined } => {

  let transport: Transport | null = null
  try {
    if (server.type === 'sse') {
      transport = new SSEClientTransport(new URL(server.url as string));
    } else {
      let env = server.env as Record<string, string>;
      transport = new StdioClientTransport({
        command: server.command as string,
        args: server.args as string[],
        env: env ? env.reduce((o, v) => ({
          [v]: process.env[v] || ''
        }), {}) : undefined
      });
    }
  } catch (error) {
    logger.error(`Connect to ${name} failed with error:`, error);
  }

  if (!transport) {
    logger.error(`${name} could not be reached.`)
    return { transport: undefined, client: undefined };
  }

  const client = new Client({
    name: `chara-proxy-client-${name}`,
    version: '1.0.0',
  }, {
    capabilities: {
      prompts: {},
      resources: { subscribe: true },
      tools: {}
    }
  });

  return { client, transport };
}

export const prepareClients = async (servers: Record<string, MCPServer>): Promise<ActiveClient[]> => {
  const clients: ActiveClient[] = [];

  for (const name of Object.keys(servers)) {
    logger.info(`Connecting to server: ${name}`);

    let count = 0
    while (count < RETRIES) {

      const { client, transport } = createClient(name, servers[name])
      if (!client || !transport) {
        break
      }

      try {
        await client.connect(transport);
        logger.success(`Connected to server: ${name}`);

        clients.push({
          client,
          name: name,
          cleanup: async () => {
            await client.close();
          }
        });

        break

      } catch (error) {
        logger.error(`Failed to connect to ${name}:`, error);
        count++
        try {
          await client.close()
        } catch { }
        logger.info(`Retry connection to ${name} in ${WAIT_INTERVAL}ms (${count}/${RETRIES})`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), WAIT_INTERVAL));
      }

    }

  }

  return clients;
};
