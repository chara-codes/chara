import { join } from "node:path";
/**
 * MCPServer configuration
 */
export interface MCPServer {
  /** Command to execute */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables to pass to the command */
  env?: Record<string, string>;
}

/**
 * Chara CLI configuration
 */
export interface CharaConfig {
  /** Host to serve on */
  host: string;
  /** Port to serve on */
  port: number;
  /** Development command */
  dev: string;
  /** Model Context Protocol servers */
  mcpServers?: Record<string, MCPServer>;
}

/**
 * Default configuration values
 */
export const defaultConfig: CharaConfig = {
  host: "localhost",
  port: 3000,
  dev: "bun dev",
  mcpServers: {},
};

/**
 * Read and parse the Chara configuration file
 * @param configPath Path to the configuration file
 * @returns The parsed configuration
 */
export async function readConfig(
  configPath = ".chara.json",
): Promise<CharaConfig> {
  try {
    const configFile = Bun.file(join(process.cwd(), configPath));
    const config = await configFile.json();
    return {
      ...defaultConfig,
      ...config,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(
        `Config file not found at ${configPath}, using default configuration.`,
      );
      return defaultConfig;
    }
    throw error;
  }
}
