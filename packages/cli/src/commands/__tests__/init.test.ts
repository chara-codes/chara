/**
 * Unit tests for init command
 *
 * Tests the complete functionality of the init command including:
 * - Command builder options
 * - Handler execution with server lifecycle
 * - Error handling
 * - Integration with ActionFactory
 * - Server management for default-model setup
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { initCommand } from "../init";

// Mock the logger
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@apk/logger", () => ({
  logger: mockLogger,
}));

// Mock ActionFactory
const mockActionFactory = {
  execute: mock((actionName: string, options: any) => {
    if (actionName === "default-model") {
      return Promise.resolve();
    }
    if (actionName === "init") {
      return Promise.resolve();
    }
    if (actionName === "reset") {
      return Promise.resolve();
    }
    if (actionName === "show") {
      return Promise.resolve();
    }
    return Promise.resolve();
  }),
};

// Mock startAgentsAction
const mockStartAgentsAction = mock((options: any) => {
  return Promise.resolve({
    server: { stop: () => Promise.resolve() },
    port: options?.port || 3031,
  });
});

// Mock stopAgentsAction
const mockStopAgentsAction = mock((options: any) => {
  return Promise.resolve();
});

mock.module("../../actions", () => ({
  ActionFactory: mockActionFactory,
  startAgentsAction: mockStartAgentsAction,
  stopAgentsAction: mockStopAgentsAction,
}));

// Mock process.exit
const mockProcessExit = mock((code: number) => {
  throw new Error(`Process exited with code ${code}`);
});

// @ts-ignore
global.process.exit = mockProcessExit;

describe("Init Command", () => {
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
    mockActionFactory.execute.mockImplementation(
      (actionName: string, options: any) => {
        if (actionName === "default-model") {
          return Promise.resolve();
        }
        if (actionName === "init") {
          return Promise.resolve();
        }
        if (actionName === "reset") {
          return Promise.resolve();
        }
        if (actionName === "show") {
          return Promise.resolve();
        }
        return Promise.resolve();
      },
    );

    mockStartAgentsAction.mockImplementation((options: any) => {
      return Promise.resolve({
        server: { stop: () => Promise.resolve() },
        port: options?.port || 3031,
      });
    });

    mockStopAgentsAction.mockImplementation((options: any) => {
      return Promise.resolve();
    });
  });

  afterEach(() => {
    // Clean up after each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockActionFactory.execute.mockClear();
    mockStartAgentsAction.mockClear();
    mockStopAgentsAction.mockClear();
    mockProcessExit.mockClear();
  });

  describe("Command Definition", () => {
    test("should have correct command name", () => {
      expect(initCommand.command).toBe("init");
    });

    test("should have correct description", () => {
      expect(initCommand.describe).toBe(
        "Initialize Chara configuration with AI provider settings",
      );
    });

    test("should have builder function", () => {
      expect(typeof initCommand.builder).toBe("function");
    });

    test("should have handler function", () => {
      expect(typeof initCommand.handler).toBe("function");
    });
  });

  describe("Command Builder", () => {
    test("should configure options correctly", () => {
      const mockYargs = {
        option: mock((_name: string, _config: unknown) => mockYargs),
      };

      if (typeof initCommand.builder === "function") {
        initCommand.builder(mockYargs as any);
      }

      expect(mockYargs.option).toHaveBeenCalledTimes(4);

      // Check force option
      expect(mockYargs.option).toHaveBeenCalledWith("force", {
        describe: "Force initialization even if config exists",
        type: "boolean",
        default: false,
        alias: "f",
      });

      // Check verbose option
      expect(mockYargs.option).toHaveBeenCalledWith("verbose", {
        describe: "Enable verbose output",
        type: "boolean",
        default: false,
        alias: "v",
      });

      // Check show option
      expect(mockYargs.option).toHaveBeenCalledWith("show", {
        describe: "Show current configuration and exit",
        type: "boolean",
        default: false,
        alias: "s",
      });

      // Check reset option
      expect(mockYargs.option).toHaveBeenCalledWith("reset", {
        describe: "Reset/clear all configuration",
        type: "boolean",
        default: false,
        alias: "r",
      });
    });
  });

  describe("Command Handler", () => {
    describe("Main Init Flow", () => {
      test("should execute init and default-model actions", async () => {
        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledTimes(2);

        // Check init action
        expect(mockActionFactory.execute).toHaveBeenCalledWith("init", {
          force: false,
          verbose: false,
        });

        // Check start-agents action
        expect(mockStartAgentsAction).toHaveBeenCalledWith({
          port: 3031,
          mcp: false,
          runner: false,
          websocket: false,
          silent: true,
          verbose: false,
        });

        // Check default-model action
        expect(mockActionFactory.execute).toHaveBeenCalledWith(
          "default-model",
          {
            port: 3031,
            serverUrl: "http://localhost:3031",
            verbose: false,
          },
        );

        // Check stop-agents action
        expect(mockStopAgentsAction).toHaveBeenCalledWith({
          server: { stop: expect.any(Function) },
          silent: true,
          verbose: false,
        });
      });

      test("should execute with force option", async () => {
        const argv = {
          force: true,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledWith("init", {
          force: true,
          verbose: false,
        });
      });

      test("should set verbose logging when verbose is true", async () => {
        const argv = {
          force: false,
          verbose: true,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
        expect(mockActionFactory.execute).toHaveBeenCalledWith("init", {
          force: false,
          verbose: true,
        });
      });
    });

    describe("Reset Option", () => {
      test("should execute reset action and exit early", async () => {
        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: true,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledTimes(1);
        expect(mockActionFactory.execute).toHaveBeenCalledWith("reset", {
          verbose: false,
        });

        // Should not execute init or default-model actions
        expect(mockActionFactory.execute).not.toHaveBeenCalledWith(
          "init",
          expect.any(Object),
        );
      });

      test("should execute reset with verbose", async () => {
        const argv = {
          force: false,
          verbose: true,
          show: false,
          reset: true,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
        expect(mockActionFactory.execute).toHaveBeenCalledWith("reset", {
          verbose: true,
        });
      });
    });

    describe("Show Option", () => {
      test("should execute show action and exit early", async () => {
        const argv = {
          force: false,
          verbose: false,
          show: true,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledTimes(1);
        expect(mockActionFactory.execute).toHaveBeenCalledWith("show", {
          verbose: false,
        });

        // Should not execute init or default-model actions
        expect(mockActionFactory.execute).not.toHaveBeenCalledWith(
          "init",
          expect.any(Object),
        );
      });

      test("should execute show with verbose", async () => {
        const argv = {
          force: false,
          verbose: true,
          show: true,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
        expect(mockActionFactory.execute).toHaveBeenCalledWith("show", {
          verbose: true,
        });
      });
    });

    describe("Error Handling", () => {
      test("should handle init action errors", async () => {
        const testError = new Error("Init failed");
        mockActionFactory.execute.mockImplementation((actionName: string) => {
          if (actionName === "init") {
            return Promise.reject(testError);
          }
          return Promise.resolve();
        });

        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        try {
          await initCommand.handler(argv);
          expect.unreachable("Should have thrown an error");
        } catch (error) {
          expect(error).toEqual(new Error("Process exited with code 1"));
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Command failed:",
          "Init failed",
        );
        expect(mockProcessExit).toHaveBeenCalledWith(1);
      });

      test("should handle server start errors", async () => {
        const testError = new Error("Server start failed");
        mockActionFactory.execute.mockImplementation((actionName: string) => {
          if (actionName === "init") {
            return Promise.resolve();
          }
          return Promise.resolve();
        });

        mockStartAgentsAction.mockImplementation(() => {
          return Promise.reject(testError);
        });

        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        try {
          await initCommand.handler(argv);
          expect.unreachable("Should have thrown an error");
        } catch (error) {
          expect(error).toEqual(new Error("Process exited with code 1"));
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Command failed:",
          "Server start failed",
        );
      });

      test("should handle default-model action errors with server cleanup", async () => {
        const testError = new Error("Default model failed");
        mockActionFactory.execute.mockImplementation((actionName: string) => {
          if (actionName === "init") {
            return Promise.resolve();
          }
          if (actionName === "default-model") {
            return Promise.reject(testError);
          }
          return Promise.resolve();
        });

        mockStartAgentsAction.mockImplementation(() => {
          return Promise.resolve({
            server: { stop: () => Promise.resolve() },
            port: 3031,
          });
        });

        mockStopAgentsAction.mockImplementation(() => {
          return Promise.resolve();
        });

        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        try {
          await initCommand.handler(argv);
          expect.unreachable("Should have thrown an error");
        } catch (error) {
          expect(error).toEqual(new Error("Process exited with code 1"));
        }

        // Should still clean up server
        expect(mockStopAgentsAction).toHaveBeenCalledWith({
          server: { stop: expect.any(Function) },
          silent: true,
          verbose: false,
        });

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Command failed:",
          "Default model failed",
        );
      });

      test("should handle non-Error objects", async () => {
        const testError = "String error";
        mockActionFactory.execute.mockImplementation((actionName: string) => {
          if (actionName === "init") {
            return Promise.reject(testError);
          }
          return Promise.resolve();
        });

        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        try {
          await initCommand.handler(argv);
          expect.unreachable("Should have thrown an error");
        } catch (error) {
          expect(error).toEqual(new Error("Process exited with code 1"));
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Command failed:",
          "String error",
        );
      });
    });

    describe("Server Lifecycle Management", () => {
      test("should always clean up server even if not started", async () => {
        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        // Server should be cleaned up
        expect(mockStopAgentsAction).toHaveBeenCalledWith({
          server: { stop: expect.any(Function) },
          silent: true,
          verbose: false,
        });
      });

      test("should clean up server when default-model fails", async () => {
        const testError = new Error("Model selection failed");
        mockActionFactory.execute.mockImplementation((actionName: string) => {
          if (actionName === "init") {
            return Promise.resolve();
          }
          if (actionName === "default-model") {
            return Promise.reject(testError);
          }
          return Promise.resolve();
        });

        mockStartAgentsAction.mockImplementation(() => {
          return Promise.resolve({
            server: { stop: () => Promise.resolve() },
            port: 3031,
          });
        });

        mockStopAgentsAction.mockImplementation(() => {
          return Promise.resolve();
        });

        const argv = {
          force: false,
          verbose: false,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        try {
          await initCommand.handler(argv);
        } catch (error) {
          // Expected to throw
        }

        // Should have attempted to clean up server
        expect(mockStopAgentsAction).toHaveBeenCalledWith({
          server: { stop: expect.any(Function) },
          silent: true,
          verbose: false,
        });
      });
    });

    describe("Integration Tests", () => {
      test("should handle complete command execution flow", async () => {
        const argv = {
          force: true,
          verbose: true,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        // Verify logger was set to debug
        expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");

        // Verify complete action flow
        expect(mockActionFactory.execute).toHaveBeenCalledTimes(2);
        expect(mockActionFactory.execute).toHaveBeenCalledWith("init", {
          force: true,
          verbose: true,
        });
        expect(mockStartAgentsAction).toHaveBeenCalledWith({
          port: 3031,
          mcp: false,
          runner: false,
          websocket: false,
          silent: true,
          verbose: true,
        });
        expect(mockActionFactory.execute).toHaveBeenCalledWith(
          "default-model",
          {
            port: 3031,
            serverUrl: "http://localhost:3031",
            verbose: true,
          },
        );
        expect(mockStopAgentsAction).toHaveBeenCalledWith({
          server: { stop: expect.any(Function) },
          silent: true,
          verbose: false,
        });

        // Verify no errors were logged
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockProcessExit).not.toHaveBeenCalled();
      });

      test("should handle option precedence correctly", async () => {
        // Reset should take precedence over show
        const argv = {
          force: false,
          verbose: false,
          show: true,
          reset: true,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledTimes(1);
        expect(mockActionFactory.execute).toHaveBeenCalledWith("reset", {
          verbose: false,
        });

        // Should not execute show
        expect(mockActionFactory.execute).not.toHaveBeenCalledWith(
          "show",
          expect.any(Object),
        );
      });
    });

    describe("Type Safety", () => {
      test("should handle command with correct TypeScript types", async () => {
        const argv = {
          force: true,
          verbose: true,
          show: false,
          reset: false,
          _: [],
          $0: "chara",
        } as any;

        await initCommand.handler(argv);

        expect(mockActionFactory.execute).toHaveBeenCalledWith("init", {
          force: true,
          verbose: true,
        });
      });

      test("should handle optional arguments correctly", async () => {
        const argv = {
          verbose: true,
          _: [],
          $0: "chara",
          // Other options are optional
        } as any;

        await initCommand.handler(argv);

        expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      });
    });
  });
});
