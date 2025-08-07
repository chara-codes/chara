import pino from "pino";
import type { LoggerTransportConfig } from "./types";

export function createConsoleTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  return pino.transport({
    target: "pino-pretty",
    options: {
      colorize: options.colorize ?? true,
      translateTime: options.translateTime ?? "SYS:standard",
      ignore: "pid,hostname",
      customColors: "trace:gray,debug:gray,info:cyan,warn:yellow,error:red",
      customLevels: undefined as any,
      ...options,
    },
  });
}

export function createFileTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  return pino.transport({
    target: "pino/file",
    options: {
      destination: options.destination || "./logs/app.log",
      mkdir: options.mkdir ?? true,
      ...options,
    },
  });
}

export function createBrowserTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  return pino.transport({
    target: "pino/browser",
    options: {
      asObject: options.asObject ?? false,
      ...options,
    },
  });
}

export function createMultiTransport(transports: LoggerTransportConfig[]) {
  const targets = transports.map((transport) => {
    switch (transport.type) {
      case "console":
        return {
          target: "pino-pretty",
          options: {
            colorize: transport.options?.colorize ?? true,
            translateTime: transport.options?.translateTime ?? "SYS:standard",
            ignore: "pid,hostname",
            customColors:
              "trace:gray,debug:gray,info:cyan,warn:yellow,error:red",
            customLevels: undefined as any,
            ...transport.options,
          },
        };
      case "file":
        return {
          target: "pino/file",
          options: {
            destination: transport.options?.destination || "./logs/app.log",
            mkdir: transport.options?.mkdir ?? true,
          },
        };
      case "browser":
        return {
          target: "pino/browser",
          options: {
            asObject: transport.options?.asObject ?? false,
          },
        };
      default:
        throw new Error(`Unknown transport type: ${transport.type}`);
    }
  });

  return pino.transport({
    targets: targets as any,
  });
}
