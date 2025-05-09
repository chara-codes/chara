import { join } from "node:path";
import { type CharaConfig, defaultConfig } from "./types/index.ts";

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
