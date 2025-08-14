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

// Helper function to format message with additional data
function formatMessageWithData(message: string, data: any): string {
  if (data !== undefined && data !== null) {
    return message + "\n" + dumperDump(data);
  }
  return message;
}

// Safe transport/stream creation with error handling
function createSafeDestination(transportConfig?: any) {
  try {
    if (!transportConfig) {
      return createConsoleTransport();
    }

    switch (transportConfig.type) {
      case "console":
        return createConsoleTransport(transportConfig.options);
      case "file":
        return createFileTransport(transportConfig.options);
      case "browser":
        return createBrowserTransport(transportConfig.options);
      default:
        return createConsoleTransport();
    }
  } catch (error) {
    // Fallback to stdout destination if transport creation fails
    console.warn("Warning: Failed to create transport, using fallback");
    return pino.destination({
      dest: 1, // stdout
      sync: false,
    });
  }
}

export class Logger {
  private pinoLogger: pino.Logger<"success" | "event" | "server">;

  constructor(config: LoggerConfig) {
    // Set up transports/streams with proper error handling
    let destination: any;

    try {
      if (config.transports && config.transports.length > 0) {
        if (config.transports.length === 1) {
          destination = createSafeDestination(config.transports[0]);
        } else {
          destination = createMultiTransport(config.transports);
        }
      } else {
        // Default to console transport
        destination = createSafeDestination();
      }
    } catch (error) {
      // If any transport setup fails, use safe fallback
      console.warn("Warning: Transport setup failed, using fallback");
      destination = pino.destination({
        dest: 1, // stdout
        sync: false,
      });
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
      destination
    ) as pino.Logger<"success" | "event" | "server">;
  }

  // Standard Pino methods
  log(message: string, data?: any): void;
  log(obj: object, message?: string, ...args: any[]): void;
  log(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.info(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.info(msgOrObj);
      }
    } else {
      this.pinoLogger.info(msgOrObj, messageOrData, ...args);
    }
  }

  trace(message: string, data?: any): void;
  trace(obj: object, message?: string, ...args: any[]): void;
  trace(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.trace(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.trace(msgOrObj);
      }
    } else {
      this.pinoLogger.trace(msgOrObj, messageOrData, ...args);
    }
  }

  debug(message: string, data?: any): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  debug(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.debug(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.debug(msgOrObj);
      }
    } else {
      this.pinoLogger.debug(msgOrObj, messageOrData, ...args);
    }
  }

  info(message: string, data?: any): void;
  info(obj: object, message?: string, ...args: any[]): void;
  info(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.info(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.info(msgOrObj);
      }
    } else {
      this.pinoLogger.info(msgOrObj, messageOrData, ...args);
    }
  }

  warn(message: string, data?: any): void;
  warn(obj: object, message?: string, ...args: any[]): void;
  warn(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.warn(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.warn(msgOrObj);
      }
    } else {
      this.pinoLogger.warn(msgOrObj, messageOrData, ...args);
    }
  }

  warning(message: string, data?: any): void;
  warning(obj: object, message?: string, ...args: any[]): void;
  warning(
    msgOrObj: string | object,
    messageOrData?: any,
    ...args: any[]
  ): void {
    this.warn(msgOrObj as any, messageOrData, ...args);
  }

  error(message: string, data?: any): void;
  error(obj: object, message?: string, ...args: any[]): void;
  error(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.error(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.error(msgOrObj);
      }
    } else {
      this.pinoLogger.error(msgOrObj, messageOrData, ...args);
    }
  }

  err(message: string, data?: any): void;
  err(obj: object, message?: string, ...args: any[]): void;
  err(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    this.error(msgOrObj as any, messageOrData, ...args);
  }

  fatal(message: string, data?: any): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
  fatal(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.fatal(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.fatal(msgOrObj);
      }
    } else {
      this.pinoLogger.fatal(msgOrObj, messageOrData, ...args);
    }
  }

  // Custom Chara methods
  success(message: string, data?: any): void;
  success(obj: object, message?: string, ...args: any[]): void;
  success(
    msgOrObj: string | object,
    messageOrData?: any,
    ...args: any[]
  ): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.info(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.info(msgOrObj);
      }
    } else {
      this.pinoLogger.info(msgOrObj, messageOrData, ...args);
    }
  }

  event(message: string, data?: any): void;
  event(obj: object, message?: string, ...args: any[]): void;
  event(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.info(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.info(msgOrObj);
      }
    } else {
      this.pinoLogger.info(msgOrObj, messageOrData, ...args);
    }
  }

  server(message: string, data?: any): void;
  server(obj: object, message?: string, ...args: any[]): void;
  server(msgOrObj: string | object, messageOrData?: any, ...args: any[]): void {
    if (typeof msgOrObj === "string") {
      if (messageOrData !== undefined) {
        this.pinoLogger.info(formatMessageWithData(msgOrObj, messageOrData));
      } else {
        this.pinoLogger.info(msgOrObj);
      }
    } else {
      this.pinoLogger.info(msgOrObj, messageOrData, ...args);
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

// Create default logger instance with safe configuration
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
