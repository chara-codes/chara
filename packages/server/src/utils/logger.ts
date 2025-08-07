import path from "node:path";
import { Logger as BaseLogger } from "@chara-codes/logger";

const cwd = process.cwd();
const logDir = path.join(cwd, ".chara", "logs");
const errorLogFile = path.join(logDir, "server-errors.log");

const envLevel = (process.env.SERVER_LOG_LEVEL || process.env.LOG_LEVEL || "info").toLowerCase();

export const logger = new BaseLogger({
  name: "server",
  level: envLevel,
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
