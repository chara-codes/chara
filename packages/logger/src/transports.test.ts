import { describe, expect, test } from "bun:test";
import {
  createBrowserTransport,
  createConsoleTransport,
  createFileTransport,
  createMultiTransport,
} from "./transports";
import type { LoggerTransportConfig } from "./types";

describe("Transport Creation", () => {
  describe("createConsoleTransport", () => {
    test("should create console transport with default options", () => {
      const transport = createConsoleTransport();
      expect(transport).toBeDefined();
    });

    test("should create console transport with custom options", () => {
      const options = {
        colorize: false,
        translateTime: false,
      };
      const transport = createConsoleTransport(options);
      expect(transport).toBeDefined();
    });

    test("should handle empty options object", () => {
      const transport = createConsoleTransport({});
      expect(transport).toBeDefined();
    });

    test("should detect browser environment correctly", () => {
      // Mock globalThis to simulate browser environment
      (globalThis as any).window = {};

      const transport = createConsoleTransport();
      expect(transport).toBeDefined();

      // Restore original globalThis
      delete (globalThis as any).window;
    });

    test("should handle fallback gracefully", () => {
      // Should not throw even if transports fail internally
      expect(() => createConsoleTransport()).not.toThrow();
    });
  });

  describe("createFileTransport", () => {
    test("should create file transport with default options", () => {
      const transport = createFileTransport();
      expect(transport).toBeDefined();
    });

    test("should create file transport with custom destination", () => {
      const options = {
        destination: "./custom.log",
        mkdir: false,
      };
      const transport = createFileTransport(options);
      expect(transport).toBeDefined();
    });

    test("should handle fallback gracefully", () => {
      // Should not throw even if file transport fails internally
      expect(() => createFileTransport()).not.toThrow();
    });
  });

  describe("createBrowserTransport", () => {
    test("should create browser transport with default options", () => {
      const transport = createBrowserTransport();
      expect(transport).toBeDefined();
    });

    test("should create browser transport with custom options", () => {
      const options = {
        asObject: true,
      };
      const transport = createBrowserTransport(options);
      expect(transport).toBeDefined();
    });

    test("should handle fallback gracefully", () => {
      // Should not throw even if browser transport fails internally
      expect(() => createBrowserTransport()).not.toThrow();
    });
  });

  describe("createMultiTransport", () => {
    test("should create multi-transport with console and file", () => {
      const transports: LoggerTransportConfig[] = [
        { type: "console", options: { colorize: true } },
        { type: "file", options: { destination: "./multi.log" } },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });

    test("should create multi-transport with all transport types", () => {
      const transports: LoggerTransportConfig[] = [
        { type: "console" },
        { type: "file", options: { destination: "./all.log" } },
        { type: "browser", options: { asObject: true } },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });

    test("should handle transports with specific levels", () => {
      const transports: LoggerTransportConfig[] = [
        {
          type: "console",
          levels: ["info", "warn", "error"],
          options: { colorize: true },
        },
        {
          type: "file",
          levels: ["error"],
          options: { destination: "./errors.log" },
        },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });

    test("should handle unknown transport type gracefully", () => {
      const transports: LoggerTransportConfig[] = [
        { type: "unknown" as any },
        { type: "console" },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });

    test("should handle browser environment in multi-transport", () => {
      // Mock browser environment
      (globalThis as any).window = {};

      const transports: LoggerTransportConfig[] = [
        { type: "console", options: { colorize: true } },
        { type: "browser", options: { asObject: false } },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();

      // Cleanup
      delete (globalThis as any).window;
    });

    test("should handle empty transports array", () => {
      const transport = createMultiTransport([]);
      expect(transport).toBeDefined();
    });

    test("should handle single transport configuration", () => {
      const transports: LoggerTransportConfig[] = [
        { type: "console", options: { colorize: true } },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });

    test("should handle complex multi-transport setup", () => {
      const transports: LoggerTransportConfig[] = [
        {
          type: "console",
          levels: ["trace", "debug", "info"],
          options: { colorize: true },
        },
        {
          type: "file",
          levels: ["warn", "error"],
          options: { destination: "./warnings.log" },
        },
        {
          type: "browser",
          options: { asObject: false },
        },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });
  });

  describe("Error resilience", () => {
    test("should handle all transport creation failures gracefully", () => {
      // Test each transport function should not throw
      expect(() => createConsoleTransport()).not.toThrow();
      expect(() => createFileTransport()).not.toThrow();
      expect(() => createBrowserTransport()).not.toThrow();
      expect(() => createMultiTransport([{ type: "console" }])).not.toThrow();
    });

    test("should work with various configurations", () => {
      // Test that different configurations don't break
      expect(() => createConsoleTransport({ colorize: false })).not.toThrow();
      expect(() =>
        createFileTransport({ destination: "./test.log" })
      ).not.toThrow();
      expect(() => createBrowserTransport({ asObject: true })).not.toThrow();
    });
  });

  describe("Options handling", () => {
    test("should merge custom options correctly", () => {
      const customOptions = {
        colorize: false,
        translateTime: "SYS:UTC",
        destination: "./custom-options.log",
        mkdir: false,
        asObject: true,
        customOption: "test",
      };

      expect(() => createConsoleTransport(customOptions)).not.toThrow();
      expect(() => createFileTransport(customOptions)).not.toThrow();
      expect(() => createBrowserTransport(customOptions)).not.toThrow();
    });

    test("should handle undefined options", () => {
      expect(() => createConsoleTransport(undefined)).not.toThrow();
      expect(() => createFileTransport(undefined)).not.toThrow();
      expect(() => createBrowserTransport(undefined)).not.toThrow();
    });

    test("should handle null options", () => {
      expect(() => createConsoleTransport(null as any)).not.toThrow();
      expect(() => createFileTransport(null as any)).not.toThrow();
      expect(() => createBrowserTransport(null as any)).not.toThrow();
    });

    test("should handle mixed option types", () => {
      const mixedOptions = {
        colorize: true,
        translateTime: false,
        destination: 42 as any, // Invalid type should not break
        mkdir: "yes" as any, // Invalid type should not break
        asObject: "true" as any, // Invalid type should not break
      };

      expect(() => createConsoleTransport(mixedOptions)).not.toThrow();
      expect(() => createFileTransport(mixedOptions)).not.toThrow();
      expect(() => createBrowserTransport(mixedOptions)).not.toThrow();
    });
  });

  describe("Stream-based pino-pretty", () => {
    test("should use pino-pretty as stream when available", () => {
      // This test verifies that the stream approach works
      const transport = createConsoleTransport({
        colorize: true,
        translateTime: "SYS:standard",
      });

      expect(transport).toBeDefined();
      // Should be a stream object (not a transport object)
      expect(typeof transport).toBe("object");
    });

    test("should fallback to stdout when pino-pretty is not available", () => {
      // Mock require to simulate pino-pretty not being available
      const originalRequire = global.require;
      global.require = ((id: string) => {
        if (id === "pino-pretty") {
          throw new Error("Cannot find module 'pino-pretty'");
        }
        return originalRequire(id);
      }) as any;

      // Should not throw and should return a valid stream
      expect(() => createConsoleTransport()).not.toThrow();
      const transport = createConsoleTransport();
      expect(transport).toBeDefined();

      // Restore original require
      global.require = originalRequire;
    });

    test("should handle stream options correctly", () => {
      const options = {
        colorize: false,
        translateTime: false,
        ignore: "pid,hostname,time",
        customColors: "info:blue,warn:yellow,error:red",
      };

      const transport = createConsoleTransport(options);
      expect(transport).toBeDefined();
    });

    test("should work with single transport in multi-transport", () => {
      // Single transport should use stream approach
      const transports = [
        {
          type: "console" as const,
          options: { colorize: true },
        },
      ];

      const transport = createMultiTransport(transports);
      expect(transport).toBeDefined();
    });
  });
});
