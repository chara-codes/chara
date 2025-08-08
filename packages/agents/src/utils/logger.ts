import path from "node:path";
import { Logger as BaseLogger, LogLevel } from "@chara-codes/logger";

const cwd = process.cwd();
const logDir = path.join(cwd, ".chara", "logs");
const errorLogFile = path.join(logDir, "agents-errors.log");

const envLevel = (
  process.env.AGENTS_LOG_LEVEL ||
  process.env.LOG_LEVEL ||
  "info"
).toLowerCase();

export const logger = new BaseLogger({
  name: "agents",
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

export { LogLevel };
