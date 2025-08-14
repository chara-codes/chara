import pino from "pino";
import "pino-pretty";
import type { LoggerTransportConfig } from "./types";

export function createConsoleTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  return pino.transport({
    target: "pino-pretty",
    options: {
      colorize: options.colorize ?? true,
      translateTime: options.translateTime ?? "SYS:standard",
      ignore: "pid,hostname,time",
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
    const levels = transport.levels?.length
      ? { levels: transport.levels }
      : undefined;
    switch (transport.type) {
      case "console":
        return {
          target: "pino-pretty",
          options: {
            colorize: transport.options?.colorize ?? true,
            translateTime: transport.options?.translateTime ?? "SYS:standard",
            ignore: "pid,hostname,time",
            customColors:
              "trace:gray,debug:gray,info:cyan,warn:yellow,error:red",
            customLevels: undefined as any,
            ...transport.options,
          },
          level: transport.levels ? transport.levels[0] : undefined,
          ...levels,
        } as any;
      case "file":
        return {
          target: "pino/file",
          options: {
            destination: transport.options?.destination || "./logs/app.log",
            mkdir: transport.options?.mkdir ?? true,
          },
          level: transport.levels ? transport.levels[0] : undefined,
          ...levels,
        } as any;
      case "browser":
        return {
          target: "pino/browser",
          options: {
            asObject: transport.options?.asObject ?? false,
          },
          level: transport.levels ? transport.levels[0] : undefined,
          ...levels,
        } as any;
      default:
        throw new Error(`Unknown transport type: ${transport.type}`);
    }
  });

  return pino.transport({
    targets: targets as any,
  });
}
