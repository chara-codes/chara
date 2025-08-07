import path from "node:path";
import { Logger as BaseLogger } from "@chara-codes/logger";

const cwd = process.cwd();
const logDir = path.join(cwd, ".chara", "logs");
const errorLogFile = path.join(logDir, "server-errors.log");

export const logger = new BaseLogger({
  name: "server",
  level: "info",
  transports: [
    {
      type: "console",
      options: { colorize: true },
      levels: ["trace", "debug", "info", "warn", "error", "fatal"],
    },
    {
      type: "file",
      options: { destination: errorLogFile, mkdir: true },
      levels: ["error", "fatal"],
    },
  ],
});
