/**
 * Unit tests for default-model command
 *
 * Tests the complete functionality of the default-model command including:
 * - Command builder options
 * - Handler execution
 * - Error handling
 * - Integration with ActionFactory
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { defaultModelCommand } from "../default-model";

// Mock the logger
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@chara/logger", () => ({
  logger: mockLogger,
}));

// Mock ActionFactory
const mockActionFactory = {
  execute: mock(() => Promise.resolve()),
};

mock.module("../../actions", () => ({
  ActionFactory: mockActionFactory,
}));

// Reset ActionFactory mock to resolve by default
beforeEach(() => {
  mockActionFactory.execute.mockImplementation(() => Promise.resolve());
});

// Mock process.exit
const mockProcessExit = mock((code: number) => {
  throw new Error(`Process exited with code ${code}`);
});

// @ts-ignore
global.process.exit = mockProcessExit;

describe("Default Model Command", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockActionFactory.execute.mockClear();
    mockProcessExit.mockClear();

    // Ensure ActionFactory.execute resolves by default
    mockActionFactory.execute.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    // Clean up after each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockActionFactory.execute.mockClear();
    mockProcessExit.mockClear();
  });

  describe("Command Definition", () => {
    test("should have correct command name", () => {
      expect(defaultModelCommand.command).toBe("default-model");
    });

    test("should have correct description", () => {
      expect(defaultModelCommand.describe).toBe(
        "Set default AI model for Chara Codes",
      );
    });

    test("should have builder function", () => {
      expect(typeof defaultModelCommand.builder).toBe("function");
    });

    test("should have handler function", () => {
      expect(typeof defaultModelCommand.handler).toBe("function");
    });
  });

  describe("Command Builder", () => {
    test("should configure options correctly", () => {
      const mockYargs = {
        option: mock((_name: string, _config: unknown) => mockYargs),
      };

      if (typeof defaultModelCommand.builder === "function") {
        defaultModelCommand.builder(mockYargs as any);
      }

      expect(mockYargs.option).toHaveBeenCalledTimes(2);

      // Check port option
      expect(mockYargs.option).toHaveBeenCalledWith("port", {
        describe: "Port to start server on",
        type: "number",
        default: 3031,
        alias: "p",
      });

      // Check verbose option
      expect(mockYargs.option).toHaveBeenCalledWith("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false,
        alias: "v",
      });
    });
  });

  describe("Command Handler", () => {
    test("should execute action with correct parameters", async () => {
      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockActionFactory.execute).toHaveBeenCalledTimes(1);
      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 3031,
        verbose: false,
      });
    });

    test("should execute action with custom port", async () => {
      const argv = {
        port: 8080,
        verbose: true,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 8080,
        verbose: true,
      });
    });

    test("should set verbose logging when verbose is true", async () => {
      const argv = {
        port: 3031,
        verbose: true,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("should not set verbose logging when verbose is false", async () => {
      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockLogger.setLevel).not.toHaveBeenCalled();
    });

    test("should handle action execution errors", async () => {
      const testError = new Error("Action execution failed");
      mockActionFactory.execute.mockImplementation(() =>
        Promise.reject(testError),
      );

      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      try {
        await defaultModelCommand.handler(argv);
        expect.unreachable("Should have thrown an error");
      } catch (error) {
        expect(error).toEqual(new Error("Process exited with code 1"));
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Command failed:",
        "Action execution failed",
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test("should handle non-Error objects", async () => {
      const testError = "String error";
      mockActionFactory.execute.mockImplementation(() =>
        Promise.reject(testError),
      );

      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      try {
        await defaultModelCommand.handler(argv);
        expect.unreachable("Should have thrown an error");
      } catch (error) {
        expect(error).toEqual(new Error("Process exited with code 1"));
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Command failed:",
        "String error",
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test("should handle null/undefined errors", async () => {
      mockActionFactory.execute.mockImplementation(() => Promise.reject(null));

      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      try {
        await defaultModelCommand.handler(argv);
        expect.unreachable("Should have thrown an error");
      } catch (error) {
        expect(error).toEqual(new Error("Process exited with code 1"));
      }

      expect(mockLogger.error).toHaveBeenCalledWith("Command failed:", null);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete command execution flow", async () => {
      const argv = {
        port: 3001,
        verbose: true,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      // Verify logger was set to debug
      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");

      // Verify action was executed with correct parameters
      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 3001,
        verbose: true,
      });

      // Verify no errors were logged
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    test("should handle default values correctly", async () => {
      const argv = {
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: undefined,
        verbose: undefined,
      });
    });

    test("should handle partial arguments", async () => {
      const argv = {
        verbose: true,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: undefined,
        verbose: true,
      });
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle action factory execution timeout", async () => {
      mockActionFactory.execute.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      try {
        await defaultModelCommand.handler(argv);
        expect.unreachable("Should have thrown an error");
      } catch (error) {
        expect(error).toEqual(new Error("Process exited with code 1"));
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Command failed:",
        "Timeout",
      );
    });

    test("should handle action factory being unavailable", async () => {
      mockActionFactory.execute.mockImplementation(() => {
        throw new Error("ActionFactory not available");
      });

      const argv = {
        port: 3031,
        verbose: false,
        _: [],
        $0: "chara",
      } as any;

      try {
        await defaultModelCommand.handler(argv);
        expect.unreachable("Should have thrown an error");
      } catch (error) {
        expect(error).toEqual(new Error("Process exited with code 1"));
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Command failed:",
        "ActionFactory not available",
      );
    });

    test("should handle concurrent command executions", async () => {
      const argv1 = { port: 3031, verbose: false, _: [], $0: "chara" } as any;
      const argv2 = { port: 3001, verbose: true, _: [], $0: "chara" } as any;

      const promises = [
        defaultModelCommand.handler(argv1),
        defaultModelCommand.handler(argv2),
      ];

      await Promise.all(promises);

      expect(mockActionFactory.execute).toHaveBeenCalledTimes(2);
      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 3031,
        verbose: false,
      });
      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 3001,
        verbose: true,
      });
    });
  });

  describe("Type Safety", () => {
    test("should handle command with correct TypeScript types", async () => {
      // This test ensures the command handler accepts the correct argument types
      const argv = {
        port: 3031,
        verbose: true,
        _: [],
        $0: "chara",
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: 3031,
        verbose: true,
      });
    });

    test("should handle optional arguments correctly", async () => {
      const argv = {
        verbose: true,
        _: [],
        $0: "chara",
        // port is optional
      } as any;

      await defaultModelCommand.handler(argv);

      expect(mockActionFactory.execute).toHaveBeenCalledWith("default-model", {
        port: undefined,
        verbose: true,
      });
    });
  });
});
