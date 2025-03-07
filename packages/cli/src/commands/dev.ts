import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CommandModule } from "yargs";
import { readConfig } from "../config";

export const devCommand: CommandModule = {
  command: "dev",
  describe: "Start development with Chara Codes",
  builder: (yargs) => yargs,
  handler: async (argv) => {
    const config = await readConfig();
    console.log("Starting development with Chara Codes...");
    console.log(config);
  },
};
