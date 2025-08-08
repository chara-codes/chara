import { dump as dumperDump } from "@poppinss/dumper/console";
import pino from "pino";
import {
  createBrowserTransport,
  createConsoleTransport,
  createFileTransport,
  createMultiTransport,
} from "./transports";
import type { DumpOptions, LoggerConfig } from "./types";

// Custom levels for Chara-specific log types
const customLevels = undefined as any;

export class Logger {
  private pinoLogger: pino.Logger<"success" | "event" | "server">;

  constructor(config: LoggerConfig) {
    // Set up transports
    let transport: any;
    if (config.transports && config.transports.length > 0) {
      if (config.transports.length === 1) {
        const transportConfig = config.transports[0];
        switch (transportConfig.type) {
          case "console":
            transport = createConsoleTransport(transportConfig.options);
            break;
          case "file":
            transport = createFileTransport(transportConfig.options);
            break;
          case "browser":
            transport = createBrowserTransport(transportConfig.options);
            break;
        }
      } else {
        transport = createMultiTransport(config.transports);
      }
    } else {
      // Default to console transport
      transport = createConsoleTransport();
    }

    // Create logger with custom levels
    this.pinoLogger = pino(
      {
        name: config.name,
        level: (config.level as string) || "info",
        customLevels,
        useOnlyCustomLevels: false,
        formatters: config.formatters as pino.LoggerOptions["formatters"],
        serializers: config.serializers,
        redact: config.redact,
      },
      transport
    ) as pino.Logger<"success" | "event" | "server">;
  }

  // Standard Pino methods
  log(message: string, ...args: any[]): void;
  log(obj: object, message?: string, ...args: any[]): void;
  log(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.info(msgOrObj, ...args);
    } else {
      this.pinoLogger.info(msgOrObj, message, ...args);
    }
  }

  trace(message: string, ...args: any[]): void;
  trace(obj: object, message?: string, ...args: any[]): void;
  trace(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.trace(msgOrObj, ...args);
    } else {
      this.pinoLogger.trace(msgOrObj, message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  debug(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.debug(msgOrObj, ...args);
    } else {
      this.pinoLogger.debug(msgOrObj, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void;
  info(obj: object, message?: string, ...args: any[]): void;
  info(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.info(msgOrObj, ...args);
    } else {
      this.pinoLogger.info(msgOrObj, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void;
  warn(obj: object, message?: any, ...args: any[]): void;
  warn(msgOrObj: string | object, message?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.warn(msgOrObj, { ...args, ...message });
    } else {
      this.pinoLogger.warn(msgOrObj, message, ...args);
    }
  }

  warning(message: string, ...args: any[]): void;
  warning(obj: object, message?: string, ...args: any[]): void;
  warning(msgOrObj: string | object, message?: string, ...args: any[]): void {
    this.warn(msgOrObj as any, message, ...args);
  }

  error(message: string, ...args: any[]): void;
  error(obj: object, message?: string, ...args: any[]): void;
  error(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.error(msgOrObj, ...args);
    } else {
      this.pinoLogger.error(msgOrObj, message, ...args);
    }
  }

  err(message: string, ...args: any[]): void;
  err(obj: object, message?: string, ...args: any[]): void;
  err(msgOrObj: string | object, message?: string, ...args: any[]): void {
    this.error(msgOrObj as any, message, ...args);
  }

  fatal(message: string, ...args: any[]): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
  fatal(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.fatal(msgOrObj, ...args);
    } else {
      this.pinoLogger.fatal(msgOrObj, message, ...args);
    }
  }

  // Custom Chara methods
  success(message: string, ...args: any[]): void;
  success(obj: object, message?: string, ...args: any[]): void;
  success(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.info(msgOrObj, ...args);
    } else {
      this.pinoLogger.info(msgOrObj, message, ...args);
    }
  }

  event(message: string, ...args: any[]): void;
  event(obj: object, message?: string, ...args: any[]): void;
  event(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.info(msgOrObj, ...args);
    } else {
      this.pinoLogger.info(msgOrObj, message, ...args);
    }
  }

  server(message: string, ...args: any[]): void;
  server(obj: object, message?: string, ...args: any[]): void;
  server(msgOrObj: string | object, message?: string, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      this.pinoLogger.info(msgOrObj, ...args);
    } else {
      this.pinoLogger.info(msgOrObj, message, ...args);
    }
  }

  dump(data: unknown, label?: string, _options?: DumpOptions): void {
    const formattedOutput =
      (label ? `${label}:\n` : "") + dumperDump(data as any);
    this.info(formattedOutput);
  }

  dumpError(data: unknown, label?: string): void {
    const formattedOutput =
      (label ? `${label}:\n` : "") + dumperDump(data as any);
    this.error(formattedOutput);
  }

  dumpDebug(data: unknown, label?: string): void {
    const formattedOutput =
      (label ? `${label}:\n` : "") + dumperDump(data as any);
    this.debug(formattedOutput);
  }

  dumpCompact(data: unknown, label?: string): void {
    const formattedOutput =
      (label ? `${label}:\n` : "") + dumperDump(data as any);
    this.info(formattedOutput);
  }

  // Level management
  setLevel(level: string): void {
    this.pinoLogger.level = level as any;
  }

  getLevel(): string {
    return this.pinoLogger.level;
  }

  // Access to underlying Pino logger
  get pino(): pino.Logger<"success" | "event" | "server"> {
    return this.pinoLogger;
  }

  // Child logger creation
  child(bindings: pino.Bindings): Logger {
    const childPino = this.pinoLogger.child(bindings) as pino.Logger<
      "success" | "event" | "server"
    >;
    const childLogger = Object.create(Logger.prototype);
    childLogger.pinoLogger = childPino;
    return childLogger;
  }
}

// Create default logger instance
export const logger = new Logger({
  name: "chara",
  level: "info",
  transports: [{ type: "console" }],
});

// Legacy transport for backward compatibility
export const coloredConsoleTransport = (
  level: string,
  message: string,
  metadata?: unknown
) => {
  const logMethod = (logger as any)[level] || logger.info;
  if (metadata) {
    logMethod.call(logger, { metadata }, message);
  } else {
    logMethod.call(logger, message);
  }
};
