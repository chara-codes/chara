import pino from "pino";
import type { LoggerTransportConfig } from "./types";

/**
 * Create pino-pretty as a stream instead of transport target.
 * This approach solves the "unable to determine transport target" error
 * by using pino-pretty as a destination stream rather than a transport.
 *
 * Reference: https://stackoverflow.com/questions/71938587/unable-to-determine-transport-target-for-pino-pretty
 */
function createPrettyStream(options: LoggerTransportConfig["options"] = {}) {
  try {
    // Import pino-pretty dynamically to handle cases where it might not be available
    const pinoPretty = require("pino-pretty");

    return pinoPretty({
      colorize: options.colorize ?? true,
      translateTime: options.translateTime ?? "SYS:standard",
      ignore: "pid,hostname,time",
      customColors: "trace:gray,debug:gray,info:cyan,warn:yellow,error:red",
      ...options,
    });
  } catch (error) {
    // If pino-pretty is not available, return process.stdout
    console.warn("Warning: pino-pretty not available, using basic stdout");
    return process.stdout;
  }
}

// Simple console transport using built-in destination
function createSimpleConsoleTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  // Use destination: 1 for stdout with basic formatting
  return pino.destination({
    dest: 1, // stdout
    sync: false,
  });
}

export function createConsoleTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  // For browser environments, use browser transport
  if (typeof globalThis !== "undefined" && "window" in globalThis) {
    try {
      return pino.transport({
        target: "pino/browser",
        options: {
          asObject: options.asObject ?? false,
          ...options,
        },
      });
    } catch (error) {
      return createSimpleConsoleTransport(options);
    }
  }

  // For Node.js environments, use pino-pretty as a stream (not transport)
  // This avoids module resolution issues with transport targets
  try {
    return createPrettyStream(options);
  } catch (error) {
    // Final fallback to simple console
    return createSimpleConsoleTransport(options);
  }
}

export function createFileTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  try {
    return pino.transport({
      target: "pino/file",
      options: {
        destination: options.destination || "./.chara/logs/app.log",
        mkdir: options.mkdir ?? true,
        ...options,
      },
    });
  } catch (error) {
    // Fallback to stdout if file transport fails
    console.warn("Warning: File transport failed, using console fallback");
    return createSimpleConsoleTransport(options);
  }
}

export function createBrowserTransport(
  options: LoggerTransportConfig["options"] = {}
) {
  try {
    return pino.transport({
      target: "pino/browser",
      options: {
        asObject: options.asObject ?? false,
        ...options,
      },
    });
  } catch (error) {
    // Fallback to simple console transport
    console.warn("Warning: Browser transport failed, using console fallback");
    return createSimpleConsoleTransport(options);
  }
}

export function createMultiTransport(transports: LoggerTransportConfig[]) {
  // For single transport, use stream-based approach to avoid transport target issues
  if (transports.length === 1) {
    const transport = transports[0];
    switch (transport.type) {
      case "console":
        return createConsoleTransport(transport.options);
      case "file":
        return createFileTransport(transport.options);
      case "browser":
        return createBrowserTransport(transport.options);
      default:
        console.warn(
          `Unknown transport type: ${transport.type}, using console transport`
        );
        return createConsoleTransport();
    }
  }

  // For multiple transports, use transport targets approach
  try {
    const targets = transports.map((transport) => {
      const levels = transport.levels?.length
        ? { levels: transport.levels }
        : undefined;

      switch (transport.type) {
        case "console":
          // For browser environments
          if (typeof globalThis !== "undefined" && "window" in globalThis) {
            return {
              target: "pino/browser",
              options: {
                asObject: transport.options?.asObject ?? false,
                ...transport.options,
              },
              level: transport.levels ? transport.levels[0] : undefined,
              ...levels,
            } as any;
          }

          // For Node.js, try to use pino-pretty as transport
          return {
            target: "pino-pretty",
            options: {
              colorize: transport.options?.colorize ?? true,
              translateTime: transport.options?.translateTime ?? "SYS:standard",
              ignore: "pid,hostname,time",
              customColors:
                "trace:gray,debug:gray,info:cyan,warn:yellow,error:red",
              ...transport.options,
            },
            level: transport.levels ? transport.levels[0] : undefined,
            ...levels,
          } as any;

        case "file":
          return {
            target: "pino/file",
            options: {
              destination:
                transport.options?.destination || "./.chara/logs/app.log",
              mkdir: transport.options?.mkdir ?? true,
              ...transport.options,
            },
            level: transport.levels ? transport.levels[0] : undefined,
            ...levels,
          } as any;

        case "browser":
          return {
            target: "pino/browser",
            options: {
              asObject: transport.options?.asObject ?? false,
              ...transport.options,
            },
            level: transport.levels ? transport.levels[0] : undefined,
            ...levels,
          } as any;

        default:
          // For unknown transport types, use browser transport as fallback
          console.warn(
            `Unknown transport type: ${transport.type}, using browser transport`
          );
          return {
            target: "pino/browser",
            options: {},
            level: transport.levels ? transport.levels[0] : undefined,
            ...levels,
          } as any;
      }
    });

    return pino.transport({
      targets: targets as any,
    });
  } catch (error) {
    // If multi-transport setup fails completely, return simple console transport
    console.warn(
      "Warning: Multi-transport setup failed, using simple console transport"
    );
    return createSimpleConsoleTransport();
  }
}
