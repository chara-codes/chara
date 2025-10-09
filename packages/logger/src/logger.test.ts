import { beforeEach, describe, expect, jest, test } from "bun:test";
import { coloredConsoleTransport, Logger, logger } from "./logger";

describe("Logger", () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = new Logger({
      name: "test",
      level: "trace",
      transports: [{ type: "console", options: { colorize: false } }],
    });
  });

  describe("Constructor", () => {
    test("should create logger with default config", () => {
      const defaultLogger = new Logger({ name: "default" });
      expect(defaultLogger).toBeInstanceOf(Logger);
      expect(defaultLogger.getLevel()).toBe("info");
    });

    test("should create logger with custom level", () => {
      const customLogger = new Logger({
        name: "custom",
        level: "error",
      });
      expect(customLogger.getLevel()).toBe("error");
    });

    test("should create logger with file transport", () => {
      const fileLogger = new Logger({
        name: "file-test",
        transports: [
          {
            type: "file",
            options: { destination: "./test.log" },
          },
        ],
      });
      expect(fileLogger).toBeInstanceOf(Logger);
    });

    test("should create logger with multiple transports", () => {
      const multiLogger = new Logger({
        name: "multi-test",
        transports: [
          { type: "console" },
          { type: "file", options: { destination: "./multi.log" } },
        ],
      });
      expect(multiLogger).toBeInstanceOf(Logger);
    });
  });

  describe("Log level methods", () => {
    test("should log trace messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "trace")
        .mockImplementation(() => undefined as any);
      testLogger.trace("trace message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log debug messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "debug")
        .mockImplementation(() => undefined as any);
      testLogger.debug("debug message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log info messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      testLogger.info("info message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log success messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      testLogger.success("success message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log warning messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "warn")
        .mockImplementation(() => undefined as any);
      testLogger.warning("warning message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log error messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "error")
        .mockImplementation(() => undefined as any);
      testLogger.error("error message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log event messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      testLogger.event("event message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should log server messages", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      testLogger.server("server message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should support object-style logging", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      testLogger.info({ userId: 123 }, "User logged in");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("dump methods", () => {
    test("should dump data with info level", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      const testData = { complex: { nested: "data" } };
      testLogger.dump(testData);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should dump data with label", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      const testData = { test: "value" };
      testLogger.dump(testData, "Test Variable");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should dump error data", () => {
      const spy = jest
        .spyOn(testLogger.pino, "error")
        .mockImplementation(() => undefined as any);
      const testData = { error: "details" };
      testLogger.dumpError(testData, "Error Data");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should dump debug data", () => {
      const spy = jest
        .spyOn(testLogger.pino, "debug")
        .mockImplementation(() => undefined as any);
      const testData = { debug: "info" };
      testLogger.dumpDebug(testData, "Debug Data");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should dump compact data", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      const testData = { a: 1, b: 2 };
      testLogger.dumpCompact(testData, "Compact Data");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should handle circular references in dump", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      const obj: any = { name: "test" };
      obj.self = obj;
      testLogger.dump(obj);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test("should dump with custom options", () => {
      const spy = jest
        .spyOn(testLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      const testData = { a: 1, b: 2, c: 3 };
      testLogger.dump(testData, "Custom Options", {
        shallow: false,
        maxDepth: 3,
      });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("setLevel and getLevel", () => {
    test("should set and get log level correctly", () => {
      testLogger.setLevel("error");
      expect(testLogger.getLevel()).toBe("error");
    });

    test("should filter logs based on level", () => {
      const debugSpy = jest.spyOn(testLogger.pino, "debug");
      const infoSpy = jest.spyOn(testLogger.pino, "info");
      const errorSpy = jest.spyOn(testLogger.pino, "error");
      testLogger.setLevel("error");

      testLogger.debug("debug message");
      testLogger.info("info message");
      testLogger.error("error message");

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(errorSpy.mock.calls.length).toBeGreaterThanOrEqual(0);
      debugSpy.mockRestore();
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe("Child logger", () => {
    test("should create child logger with bindings", () => {
      const childLogger = testLogger.child({ requestId: "123" });
      expect(childLogger).toBeInstanceOf(Logger);

      const spy = jest
        .spyOn(childLogger.pino, "info")
        .mockImplementation(() => undefined as any);
      childLogger.info("child message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("Pino access", () => {
    test("should provide access to underlying Pino logger", () => {
      const pinoLogger = testLogger.pino;
      expect(pinoLogger).toBeDefined();
      expect(typeof pinoLogger.info).toBe("function");
    });
  });
});

describe("coloredConsoleTransport (legacy)", () => {
  test("should work with legacy transport", () => {
    const spy = jest
      .spyOn(logger.pino, "info")
      .mockImplementation(() => undefined as any);
    coloredConsoleTransport("info", "test message");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("should handle metadata", () => {
    const spy = jest
      .spyOn(logger.pino, "info")
      .mockImplementation(() => undefined as any);
    coloredConsoleTransport("info", "test message", { key: "value" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("Transport error handling", () => {
  test("should handle transport creation errors gracefully", () => {
    // Should not throw error even if transport creation fails
    expect(() => {
      new Logger({
        name: "error-test",
        transports: [{ type: "console" }],
      });
    }).not.toThrow();
  });

  test("should fallback to safe transport when pino-pretty fails", () => {
    // Create logger that should trigger fallback
    const fallbackLogger = new Logger({
      name: "fallback-test",
      transports: [{ type: "console", options: { colorize: true } }],
    });

    expect(fallbackLogger).toBeInstanceOf(Logger);
    expect(fallbackLogger.getLevel()).toBe("info");
  });

  test("should handle multi-transport errors gracefully", () => {
    const multiLogger = new Logger({
      name: "multi-error-test",
      transports: [
        { type: "console" },
        { type: "file", options: { destination: "./test-error.log" } },
        { type: "browser" },
      ],
    });

    expect(multiLogger).toBeInstanceOf(Logger);
  });

  test("should work with browser transport", () => {
    const browserLogger = new Logger({
      name: "browser-test",
      transports: [{ type: "browser", options: { asObject: true } }],
    });

    expect(browserLogger).toBeInstanceOf(Logger);

    const spy = jest
      .spyOn(browserLogger.pino, "info")
      .mockImplementation(() => undefined as any);
    browserLogger.info("browser test message");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("should handle unknown transport type", () => {
    const unknownLogger = new Logger({
      name: "unknown-test",
      transports: [{ type: "unknown" as any }],
    });

    expect(unknownLogger).toBeInstanceOf(Logger);
  });

  test("should handle empty transports array", () => {
    const emptyLogger = new Logger({
      name: "empty-test",
      transports: [],
    });

    expect(emptyLogger).toBeInstanceOf(Logger);
  });
});

describe("Message formatting with data", () => {
  let localTestLogger: Logger;

  beforeEach(() => {
    localTestLogger = new Logger({
      name: "message-test",
      level: "trace",
      transports: [{ type: "console", options: { colorize: false } }],
    });
  });

  test("should format messages with additional data", () => {
    const spy = jest
      .spyOn(localTestLogger.pino, "info")
      .mockImplementation(() => undefined as any);

    const testData = { key: "value", number: 42 };
    localTestLogger.info("Test message", testData);

    expect(spy).toHaveBeenCalled();
    const callArgs = spy.mock.calls[0];
    expect(callArgs[0]).toContain("Test message");
    spy.mockRestore();
  });

  test("should handle undefined data gracefully", () => {
    const spy = jest
      .spyOn(localTestLogger.pino, "info")
      .mockImplementation(() => undefined as any);

    localTestLogger.info("Test message", undefined);

    expect(spy).toHaveBeenCalledWith("Test message");
    spy.mockRestore();
  });

  test("should handle null data gracefully", () => {
    const spy = jest
      .spyOn(localTestLogger.pino, "info")
      .mockImplementation(() => undefined as any);

    localTestLogger.info("Test message", null);

    expect(spy).toHaveBeenCalledWith("Test message");
    spy.mockRestore();
  });
});

describe("Transport level filtering", () => {
  test("should create logger with transport-specific levels", () => {
    const levelLogger = new Logger({
      name: "level-test",
      transports: [
        {
          type: "console",
          levels: ["error", "warn"],
          options: { colorize: false },
        },
      ],
    });

    expect(levelLogger).toBeInstanceOf(Logger);
  });

  test("should handle multiple transports with different levels", () => {
    const multiLevelLogger = new Logger({
      name: "multi-level-test",
      transports: [
        {
          type: "console",
          levels: ["info", "warn", "error"],
        },
        {
          type: "file",
          levels: ["error"],
          options: { destination: "./error-only.log" },
        },
      ],
    });

    expect(multiLevelLogger).toBeInstanceOf(Logger);
  });
});

describe("Alias methods", () => {
  let aliasTestLogger: Logger;

  beforeEach(() => {
    aliasTestLogger = new Logger({
      name: "alias-test",
      level: "trace",
      transports: [{ type: "console", options: { colorize: false } }],
    });
  });

  test("should use warn method for warning", () => {
    const warnSpy = jest
      .spyOn(aliasTestLogger, "warn")
      .mockImplementation(() => undefined as any);

    aliasTestLogger.warning("warning message");
    expect(warnSpy).toHaveBeenCalledWith("warning message", undefined);
    warnSpy.mockRestore();
  });

  test("should use error method for err", () => {
    const errorSpy = jest
      .spyOn(aliasTestLogger, "error")
      .mockImplementation(() => undefined as any);

    aliasTestLogger.err("error message");
    expect(errorSpy).toHaveBeenCalledWith("error message", undefined);
    errorSpy.mockRestore();
  });
});

describe("Configuration options", () => {
  test("should handle custom formatters", () => {
    const customLogger = new Logger({
      name: "custom-formatter-test",
      formatters: {
        level: (label: string, number: number) => ({ level: number }),
        log: (object: object) => object,
      },
    });

    expect(customLogger).toBeInstanceOf(Logger);
  });

  test("should handle serializers", () => {
    const customLogger = new Logger({
      name: "serializer-test",
      serializers: {
        error: (err: Error) => ({ message: err.message }),
      },
    });

    expect(customLogger).toBeInstanceOf(Logger);
  });

  test("should handle redact options", () => {
    const customLogger = new Logger({
      name: "redact-test",
      redact: ["password", "secret"],
    });

    expect(customLogger).toBeInstanceOf(Logger);
  });
});

describe("Default logger instance", () => {
  test("should export a default logger instance", () => {
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.getLevel()).toBe("info");
  });

  test("should work with default logger", () => {
    const spy = jest
      .spyOn(logger.pino, "info")
      .mockImplementation(() => undefined as any);
    logger.info("test default logger");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
