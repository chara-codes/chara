import type { CommandModule } from "yargs";
import { startServer } from "../server";
import type { ServerConfig } from "../types/server.types";

interface ServerCommandArgs extends ServerConfig {}

export const serverCommand: CommandModule<{}, ServerCommandArgs> = {
  command: "server",
  describe:
    "Start Chara Codes Tunnel, expose the localhost to public, add a chara codes panel.",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: "p",
        type: "number",
        description: "Port to listen on",
        default: 1337,
      })
      .option("domain", {
        type: "string",
        description: "Root domain for generating subdomains",
        default: "chara-ai.dev",
      })
      .option("controlDomain", {
        type: "string",
        description: "Control domain for websocket connections",
        default: "control.chara-ai.dev",
      }),
  handler: async (argv) => {
    const config: ServerConfig = {
      port: argv.port,
      domain: argv.domain,
      controlDomain: argv.controlDomain,
    };

    startServer(config);
  },
};
