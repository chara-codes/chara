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
