import {
  test,
  expect,
  describe,
  beforeEach,
  afterEach,
  mock,
  jest,
} from "bun:test";
import { Logger, logger, coloredConsoleTransport } from "./logger";
import { LogLevel, LogLevelSeverity, type TransportType } from "./types";

describe("Logger", () => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let mockTransport: any;
  let testLogger: Logger;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockTransport = mock(() => {});
    testLogger = new Logger({
      name: "test",
      levels: Object.values(LogLevel),
      transports: {
        [LogLevel.TRACE]: [mockTransport],
        [LogLevel.DEBUG]: [mockTransport],
        [LogLevel.INFO]: [mockTransport],
        [LogLevel.SUCCESS]: [mockTransport],
        [LogLevel.WARNING]: [mockTransport],
        [LogLevel.ERROR]: [mockTransport],
        [LogLevel.EVENT]: [mockTransport],
        [LogLevel.SERVER]: [mockTransport],
      },
    });
  });

  afterEach(() => {
    mockTransport.mockClear();
  });

  describe("Constructor", () => {
    test("should create logger with default config", () => {
      const defaultLogger = new Logger({ name: "default" });
      expect(defaultLogger).toBeInstanceOf(Logger);
      expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);
    });

    test("should create logger with custom levels", () => {
      const customLogger = new Logger({
        name: "custom",
        levels: [LogLevel.ERROR, LogLevel.WARNING],
      });
      expect(customLogger).toBeInstanceOf(Logger);
    });

    test("should create logger with custom transports", () => {
      const customTransport = mock(() => {});
      const customLogger = new Logger({
        name: "custom",
        transports: {
          [LogLevel.TRACE]: [],
          [LogLevel.DEBUG]: [],
          [LogLevel.INFO]: [customTransport],
          [LogLevel.SUCCESS]: [],
          [LogLevel.WARNING]: [],
          [LogLevel.ERROR]: [],
          [LogLevel.EVENT]: [],
          [LogLevel.SERVER]: [],
        },
      });
      customLogger.info("test message");
      expect(customTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        "test message",
        undefined,
      );
    });
  });

  describe("Log level methods", () => {
    test("should call transport for trace level", () => {
      testLogger.setLevel("TRACE");
      testLogger.trace("trace message", { meta: "data" });
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.TRACE,
        "trace message",
        { meta: "data" },
      );
    });

    test("should call transport for debug level", () => {
      testLogger.setLevel("DEBUG");
      testLogger.debug("debug message");
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        "debug message",
        undefined,
      );
    });

    test("should call transport for info level", () => {
      testLogger.info("info message", { data: 123 });
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        "info message",
        { data: 123 },
      );
    });

    test("should call transport for success level", () => {
      testLogger.success("success message");
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.SUCCESS,
        "success message",
        undefined,
      );
    });

    test("should call transport for warning level", () => {
      testLogger.warning("warning message", { warn: true });
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.WARNING,
        "warning message",
        { warn: true },
      );
    });

    test("should call transport for error level", () => {
      testLogger.error("error message", new Error("test error"));
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.ERROR,
        "error message",
        new Error("test error"),
      );
    });

    test("should call transport for event level", () => {
      testLogger.event("event message");
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.EVENT,
        "event message",
        undefined,
      );
    });

    test("should call transport for server level", () => {
      testLogger.server("server message", { port: 3000 });
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.SERVER,
        "server message",
        { port: 3000 },
      );
    });
  });

  describe("dump methods", () => {
    test("should call transport with formatted dump output", () => {
      const testData = { complex: { nested: "data" } };
      testLogger.dump(testData);

      expect(mockTransport).toHaveBeenCalledTimes(1);
      const call = mockTransport.mock.calls[0];
      console.log(call);
      expect(call[1]).toContain("Object (keys:");
    });

    test("should call dump with label", () => {
      const testData = { test: "value" };
      testLogger.dump(testData, "Test Variable");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        expect.stringContaining("Object (keys:"),
        undefined,
      );
    });

    test("should call dump with custom options", () => {
      const testData = { test: "value" };
      testLogger.dump(testData, undefined, { showTypes: false });

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        expect.stringContaining("value"),
        undefined,
      );
    });

    test("should call dumpError with error level", () => {
      const testData = { error: "details" };
      testLogger.dumpError(testData, "Error Data");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.ERROR,
        expect.stringContaining("details"),
        undefined,
      );
      const call = mockTransport.mock.calls[0];
      expect(call[1]).toContain("Object (keys:");
    });

    test("should call dumpDebug with debug level", () => {
      testLogger.setLevel("DEBUG");
      const testData = { debug: "info" };
      testLogger.dumpDebug(testData, "Debug Data");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        expect.stringContaining("debug"),
        undefined,
      );
    });

    test("should call dumpCompact with compact formatting", () => {
      const testData = { a: 1, b: 2 };
      testLogger.dumpCompact(testData, "Compact Data");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        expect.stringContaining("a"),
        undefined,
      );
    });

    test("should handle complex nested data in dump", () => {
      const complexData = {
        user: {
          name: "John",
          age: 30,
          hobbies: ["reading", "coding"],
          metadata: {
            lastLogin: new Date("2023-01-01"),
            settings: { theme: "dark", notifications: true },
          },
        },
        stats: [1, 2, 3, 4, 5],
      };

      testLogger.dump(complexData);

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        expect.stringContaining("theme"),
        undefined,
      );
    });

    test("should handle circular references in dump", () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const obj: any = { name: "test" };
      obj.self = obj;

      testLogger.dump(obj);

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        expect.stringContaining("name"),
        undefined,
      );
    });

    test("should handle different data types in dump", () => {
      const testCases = [
        null,
        undefined,
        "string",
        42,
        true,
        Symbol("test"),
        123n,
        new Date(),
        /regex/g,
        () => {},
        new Error("test error"),
        [1, 2, 3],
        new Map([["key", "value"]]),
        new Set([1, 2, 3]),
      ];

      testCases.forEach((testCase, index) => {
        mockTransport.mockClear();
        testLogger.dump(testCase, `Test Case ${index}`);

        expect(mockTransport).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("setLevel and getLevel", () => {
    test("should set and get log level correctly", () => {
      testLogger.setLevel("ERROR");
      expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
    });

    test("should handle lowercase level names", () => {
      testLogger.setLevel("warning");
      expect(testLogger.getLevel()).toBe(LogLevel.WARNING);
    });

    test("should default to INFO for unknown levels", () => {
      const consoleSpy = mock(() => {});
      const originalWarn = console.warn;
      console.warn = consoleSpy;

      testLogger.setLevel("UNKNOWN");
      expect(testLogger.getLevel()).toBe(LogLevel.INFO);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown log level: UNKNOWN. Setting to INFO.",
      );

      console.warn = originalWarn;
    });

    test("should filter logs based on severity level", () => {
      testLogger.setLevel("ERROR");

      testLogger.debug("debug message");
      testLogger.info("info message");
      testLogger.warning("warning message");
      testLogger.error("error message");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.ERROR,
        "error message",
        undefined,
      );
    });

    test("should allow lower severity logs when level is set to TRACE", () => {
      const freshLogger = new Logger({
        name: "trace-test",
        levels: Object.values(LogLevel),
        transports: {
          [LogLevel.TRACE]: [mockTransport],
          [LogLevel.DEBUG]: [mockTransport],
          [LogLevel.INFO]: [mockTransport],
          [LogLevel.SUCCESS]: [mockTransport],
          [LogLevel.WARNING]: [mockTransport],
          [LogLevel.ERROR]: [mockTransport],
          [LogLevel.EVENT]: [mockTransport],
          [LogLevel.SERVER]: [mockTransport],
        },
      });

      mockTransport.mockClear();
      freshLogger.setLevel("TRACE");

      freshLogger.trace("trace message");
      freshLogger.debug("debug message");
      freshLogger.info("info message");

      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.TRACE,
        "trace message",
        undefined,
      );
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        "debug message",
        undefined,
      );
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        "info message",
        undefined,
      );
      expect(mockTransport).toHaveBeenCalledTimes(3);
    });
  });

  describe("Level filtering", () => {
    test("should not log disabled levels", () => {
      const filteredLogger = new Logger({
        name: "filtered",
        levels: [LogLevel.ERROR, LogLevel.WARNING],
        transports: {
          [LogLevel.TRACE]: [],
          [LogLevel.DEBUG]: [],
          [LogLevel.INFO]: [mockTransport],
          [LogLevel.SUCCESS]: [],
          [LogLevel.WARNING]: [mockTransport],
          [LogLevel.ERROR]: [mockTransport],
          [LogLevel.EVENT]: [],
          [LogLevel.SERVER]: [],
        },
      });

      filteredLogger.info("info message");
      filteredLogger.error("error message");

      expect(mockTransport).toHaveBeenCalledTimes(1);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.ERROR,
        "error message",
        undefined,
      );
    });
  });

  describe("Multiple transports", () => {
    test("should call all transports for a level", () => {
      const transport1 = mock(() => {});
      const transport2 = mock(() => {});

      const multiTransportLogger = new Logger({
        name: "multi",
        transports: {
          [LogLevel.TRACE]: [],
          [LogLevel.DEBUG]: [],
          [LogLevel.INFO]: [transport1, transport2],
          [LogLevel.SUCCESS]: [],
          [LogLevel.WARNING]: [],
          [LogLevel.ERROR]: [],
          [LogLevel.EVENT]: [],
          [LogLevel.SERVER]: [],
        },
      });

      multiTransportLogger.info("test message");

      expect(transport1).toHaveBeenCalledWith(
        LogLevel.INFO,
        "test message",
        undefined,
      );
      expect(transport2).toHaveBeenCalledWith(
        LogLevel.INFO,
        "test message",
        undefined,
      );
    });
  });

  describe("Fallback behavior", () => {
    test("should use console.log when no transports configured", () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const consoleSpy = (jest as any)
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const noTransportLogger = new Logger({
        name: "fallback",
        transports: {
          [LogLevel.TRACE]: [],
          [LogLevel.DEBUG]: [],
          [LogLevel.INFO]: [],
          [LogLevel.SUCCESS]: [],
          [LogLevel.WARNING]: [],
          [LogLevel.ERROR]: [],
          [LogLevel.EVENT]: [],
          [LogLevel.SERVER]: [],
        },
      });

      noTransportLogger.info("fallback message", { meta: "data" });

      expect(consoleSpy).toHaveBeenCalledWith("fallback message", {
        meta: "data",
      });
      consoleSpy.mockRestore();
    });
  });

  describe("Edge cases", () => {
    test("should handle undefined metadata gracefully", () => {
      testLogger.info("message", undefined);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.INFO,
        "message",
        undefined,
      );
    });

    test("should handle complex metadata objects", () => {
      const complexMetadata = {
        nested: { deep: { object: "value" } },
        array: [1, 2, 3],
        func: () => "test",
        date: new Date(),
      };

      testLogger.error("complex metadata", complexMetadata);
      expect(mockTransport).toHaveBeenCalledWith(
        LogLevel.ERROR,
        "complex metadata",
        complexMetadata,
      );
    });

    test("should handle empty string messages", () => {
      testLogger.info("");
      expect(mockTransport).toHaveBeenCalledWith(LogLevel.INFO, "", undefined);
    });
  });
});

describe("coloredConsoleTransport", () => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let consoleSpy: any;

  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    consoleSpy = (jest as any)
      .spyOn(console, "log")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("should format INFO messages correctly", () => {
    coloredConsoleTransport(LogLevel.INFO, "info message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("info message");
  });

  test("should format SUCCESS messages correctly", () => {
    coloredConsoleTransport(LogLevel.SUCCESS, "success message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("success message");
  });

  test("should format WARNING messages correctly", () => {
    coloredConsoleTransport(LogLevel.WARNING, "warning message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("warning message");
  });

  test("should format ERROR messages correctly", () => {
    coloredConsoleTransport(LogLevel.ERROR, "error message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("error message");
  });

  test("should format DEBUG messages correctly", () => {
    coloredConsoleTransport(LogLevel.DEBUG, "debug message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("debug message");
  });

  test("should format TRACE messages correctly", () => {
    coloredConsoleTransport(LogLevel.TRACE, "trace message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("trace message");
  });

  test("should format EVENT messages correctly", () => {
    coloredConsoleTransport(LogLevel.EVENT, "event message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("event message");
  });

  test("should format SERVER messages correctly", () => {
    coloredConsoleTransport(LogLevel.SERVER, "server message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("server message");
  });

  test("should handle metadata correctly", () => {
    const metadata = { key: "value", number: 42 };
    coloredConsoleTransport(LogLevel.INFO, "message with metadata", metadata);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[0][0]).toContain("message with metadata");
    expect(consoleSpy.mock.calls[1][0]).toContain(
      JSON.stringify(metadata, null, 2),
    );
  });

  test("should not log metadata when empty", () => {
    coloredConsoleTransport(LogLevel.INFO, "message without metadata", {});
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  test("should handle null metadata", () => {
    coloredConsoleTransport(LogLevel.INFO, "message with null metadata", null);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});

describe("Default logger instance", () => {
  test("should export a default logger instance", () => {
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.getLevel()).toBe(LogLevel.INFO);
  });

  test("should work with default logger", () => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const consoleSpy = (jest as any)
      .spyOn(console, "log")
      .mockImplementation(() => {});

    logger.info("test default logger");

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
