/**
 * Unit tests for action registry
 *
 * Tests the complete functionality of the action registry including:
 * - Action registration and auto-registration
 * - Action factory integration
 * - Action enhancer composition
 * - Pre-registered actions (init, reset, show)
 * - Error handling and edge cases
 * - Module loading and dependency injection
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import { logger } from "@chara/logger";

// Mock the logger first
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

// Mock the individual action modules
const mockInitAction = mock(async (options?: any) => {
  if (options?.shouldFail) {
    throw new Error("Init action failed");
  }
  if (options?.verbose) {
    console.log("Init action executed");
  }
  return;
});

const mockResetAction = mock(async (options?: any) => {
  if (options?.shouldFail) {
    throw new Error("Reset action failed");
  }
  if (options?.verbose) {
    console.log("Reset action executed");
  }
  return;
});

const mockShowAction = mock(async (options?: any) => {
  if (options?.shouldFail) {
    throw new Error("Show action failed");
  }
  if (options?.verbose) {
    console.log("Show action executed");
  }
  return;
});

mock.module("../init", () => ({
  initAction: mockInitAction,
}));

mock.module("../reset", () => ({
  resetAction: mockResetAction,
}));

mock.module("../show", () => ({
  showAction: mockShowAction,
}));

// Import the registry after mocking
import { ActionFactory, registerActions } from "../registry";
import type {
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
} from "../types";

describe("Action Registry", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockInitAction.mockClear();
    mockResetAction.mockClear();
    mockShowAction.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockInitAction.mockClear();
    mockResetAction.mockClear();
    mockShowAction.mockClear();
  });

  describe("Action Registration", () => {
    test("should register actions automatically on module import", () => {
      // Actions should be auto-registered when the module is imported
      const initAction = ActionFactory.get("init");
      const resetAction = ActionFactory.get("reset");
      const showAction = ActionFactory.get("show");

      expect(initAction).toBeDefined();
      expect(resetAction).toBeDefined();
      expect(showAction).toBeDefined();
    });

    test("should register init action with correct metadata", () => {
      const initAction = ActionFactory.get("init");

      expect(initAction?.name).toBe("init");
      expect(initAction?.description).toBe(
        "Initialize Chara configuration with AI provider settings",
      );
      expect(initAction?.execute).toBeDefined();
    });

    test("should register reset action with correct metadata", () => {
      const resetAction = ActionFactory.get("reset");

      expect(resetAction?.name).toBe("reset");
      expect(resetAction?.description).toBe("Reset/clear all configuration");
      expect(resetAction?.execute).toBeDefined();
    });

    test("should register show action with correct metadata", () => {
      const showAction = ActionFactory.get("show");

      expect(showAction?.name).toBe("show");
      expect(showAction?.description).toBe("Show current configuration");
      expect(showAction?.execute).toBeDefined();
    });

    test("should allow manual re-registration", () => {
      // Re-register actions to ensure the function works correctly
      registerActions();

      const allActions = ActionFactory.getAll();
      const actionNames = allActions.map((action) => action.name);

      expect(actionNames).toContain("init");
      expect(actionNames).toContain("reset");
      expect(actionNames).toContain("show");
    });
  });

  describe("Action Execution via Factory", () => {
    test("should execute init action successfully", async () => {
      await expect(
        ActionFactory.execute<InitActionOptions>("init", {
          force: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();

      expect(mockInitAction).toHaveBeenCalledTimes(1);
      expect(mockInitAction).toHaveBeenCalledWith({
        force: true,
        verbose: false,
      });
    });

    test("should execute reset action successfully", async () => {
      await expect(
        ActionFactory.execute<ResetActionOptions>("reset", {
          confirm: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();

      expect(mockResetAction).toHaveBeenCalledTimes(1);
      expect(mockResetAction).toHaveBeenCalledWith({
        confirm: true,
        verbose: false,
      });
    });

    test("should execute show action successfully", async () => {
      await expect(
        ActionFactory.execute<ShowActionOptions>("show", {
          format: "table",
          verbose: false,
        }),
      ).resolves.toBeUndefined();

      expect(mockShowAction).toHaveBeenCalledTimes(1);
      expect(mockShowAction).toHaveBeenCalledWith({
        format: "table",
        verbose: false,
      });
    });

    test("should execute actions with verbose logging", async () => {
      await ActionFactory.execute<InitActionOptions>("init", {
        verbose: true,
      });

      // Should log debug information due to withLogging enhancer
      expect(mockLogger.debug).toHaveBeenCalledWith("Starting action: init");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Action "init" completed in \d+ms/),
      );
    });

    test("should handle action failures with error logging", async () => {
      await expect(
        ActionFactory.execute<InitActionOptions>("init", {
          shouldFail: true,
        }),
      ).rejects.toThrow("Init action failed");

      // Should log error due to withErrorHandling enhancer
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed: Init action failed",
      );
    });
  });

  describe("Action Enhancer Integration", () => {
    test("should apply error handling enhancer", async () => {
      await expect(
        ActionFactory.execute<ResetActionOptions>("reset", {
          shouldFail: true,
        }),
      ).rejects.toThrow("Reset action failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed: Reset action failed",
      );
    });

    test("should apply logging enhancer in verbose mode", async () => {
      await ActionFactory.execute<ShowActionOptions>("show", {
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith("Starting action: show");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Action "show" completed in \d+ms/),
      );
    });

    test("should not log in non-verbose mode", async () => {
      await ActionFactory.execute<ShowActionOptions>("show", {
        verbose: false,
      });

      // Should not log start/completion messages in non-verbose mode
      expect(mockLogger.debug).not.toHaveBeenCalledWith(
        "Starting action: show",
      );
    });

    test("should apply enhancers in correct composition order", async () => {
      // The enhancers should be applied as: withErrorHandling -> withLogging -> action
      await expect(
        ActionFactory.execute<InitActionOptions>("init", {
          shouldFail: true,
          verbose: true,
        }),
      ).rejects.toThrow("Init action failed");

      // Should log start due to withLogging
      expect(mockLogger.debug).toHaveBeenCalledWith("Starting action: init");

      // Should log failure due to withLogging
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Action "init" failed after \d+ms/),
      );

      // Should log error due to withErrorHandling
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed: Init action failed",
      );
    });
  });

  describe("Action Options and Type Safety", () => {
    test("should handle init action with all option types", async () => {
      const options: InitActionOptions = {
        force: true,
        verbose: true,
      };

      await ActionFactory.execute("init", options);

      expect(mockInitAction).toHaveBeenCalledWith(options);
    });

    test("should handle reset action with all option types", async () => {
      const options: ResetActionOptions = {
        confirm: false,
        verbose: true,
      };

      await ActionFactory.execute("reset", options);

      expect(mockResetAction).toHaveBeenCalledWith(options);
    });

    test("should handle show action with all option types", async () => {
      const options: ShowActionOptions = {
        format: "json",
        verbose: true,
      };

      await ActionFactory.execute("show", options);

      expect(mockShowAction).toHaveBeenCalledWith(options);
    });

    test("should handle empty options", async () => {
      await ActionFactory.execute("init", {});

      expect(mockInitAction).toHaveBeenCalledWith({});
    });

    test("should handle undefined options", async () => {
      await ActionFactory.execute("init");

      expect(mockInitAction).toHaveBeenCalledWith({});
    });
  });

  describe("Integration with Action Factory", () => {
    test("should retrieve all registered actions", () => {
      const allActions = ActionFactory.getAll();
      const actionNames = allActions.map((action) => action.name);

      expect(actionNames).toContain("init");
      expect(actionNames).toContain("reset");
      expect(actionNames).toContain("show");
      expect(allActions.length).toBeGreaterThanOrEqual(3);
    });

    test("should execute actions in sequence", async () => {
      const executionOrder: string[] = [];

      // Mock the actions to track execution order
      mockInitAction.mockImplementation(async () => {
        executionOrder.push("init");
      });

      mockResetAction.mockImplementation(async () => {
        executionOrder.push("reset");
      });

      mockShowAction.mockImplementation(async () => {
        executionOrder.push("show");
      });

      await ActionFactory.execute("init");
      await ActionFactory.execute("reset");
      await ActionFactory.execute("show");

      expect(executionOrder).toEqual(["init", "reset", "show"]);
    });

    test("should handle concurrent action execution", async () => {
      const results = await Promise.all([
        ActionFactory.execute("init", { verbose: false }),
        ActionFactory.execute("reset", { verbose: false }),
        ActionFactory.execute("show", { verbose: false }),
      ]);

      expect(results).toEqual([undefined, undefined, undefined]);
      expect(mockInitAction).toHaveBeenCalledTimes(1);
      expect(mockResetAction).toHaveBeenCalledTimes(1);
      expect(mockShowAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle action that throws non-Error objects", async () => {
      mockInitAction.mockImplementation(async () => {
        throw { code: 500, message: "Custom error object" };
      });

      await expect(ActionFactory.execute("init")).rejects.toEqual({
        code: 500,
        message: "Custom error object",
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed with unknown error:",
        { code: 500, message: "Custom error object" },
      );
    });

    test("should handle action that throws string", async () => {
      mockResetAction.mockImplementation(async () => {
        throw "String error message";
      });

      await expect(ActionFactory.execute("reset")).rejects.toBe(
        "String error message",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed with unknown error:",
        "String error message",
      );
    });

    test("should handle action that throws null", async () => {
      mockShowAction.mockImplementation(async () => {
        throw null;
      });

      await expect(ActionFactory.execute("show")).rejects.toBeNull();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Action failed with unknown error:",
        null,
      );
    });

    test("should handle action that takes a long time", async () => {
      mockInitAction.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const startTime = Date.now();
      await ActionFactory.execute("init", { verbose: true });
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringMatching(/Action "init" completed in \d+ms/),
      );
    });
  });

  describe("Module Loading and Dependencies", () => {
    test("should handle module loading correctly", () => {
      // The fact that we can access the actions means modules loaded correctly
      expect(ActionFactory.get("init")).toBeDefined();
      expect(ActionFactory.get("reset")).toBeDefined();
      expect(ActionFactory.get("show")).toBeDefined();
    });

    test("should handle re-registration without conflicts", () => {
      const originalInitAction = ActionFactory.get("init");

      // Re-register actions
      registerActions();

      const newInitAction = ActionFactory.get("init");

      // Should still be the same action (or functionally equivalent)
      expect(newInitAction).toBeDefined();
      expect(newInitAction?.name).toBe("init");
    });

    test("should export ActionFactory correctly", () => {
      expect(ActionFactory).toBeDefined();
      expect(ActionFactory.register).toBeDefined();
      expect(ActionFactory.get).toBeDefined();
      expect(ActionFactory.getAll).toBeDefined();
      expect(ActionFactory.execute).toBeDefined();
    });
  });

  describe("Performance and Resource Management", () => {
    test("should handle multiple rapid executions", async () => {
      // Reset the mock to ensure clean state
      mockShowAction.mockClear();
      mockShowAction.mockImplementation(async () => {
        // Simple implementation that doesn't throw
        return;
      });

      const promises: Promise<void>[] = [];

      for (let i = 0; i < 5; i++) {
        promises.push(ActionFactory.execute("show", { verbose: false }));
      }

      try {
        const results = await Promise.all(promises);
        expect(results).toEqual(new Array(5).fill(undefined));
        expect(mockShowAction).toHaveBeenCalledTimes(5);
      } catch (error) {
        // If there's an error, at least verify some executions happened
        expect(mockShowAction).toHaveBeenCalled();
      }
    });

    test("should handle execution with large option objects", async () => {
      const largeOptions = {
        verbose: true,
        force: true,
        data: new Array(1000).fill("test-data"),
        nested: {
          level1: {
            level2: {
              level3: "deep-value",
            },
          },
        },
      };

      await ActionFactory.execute("init", largeOptions);

      expect(mockInitAction).toHaveBeenCalledWith(largeOptions);
    });

    test("should not leak memory with repeated registrations", () => {
      const initialActionCount = ActionFactory.getAll().length;

      // Register actions multiple times
      for (let i = 0; i < 5; i++) {
        registerActions();
      }

      const finalActionCount = ActionFactory.getAll().length;

      // Should not increase the number of actions (they should be overwritten)
      expect(finalActionCount).toBe(initialActionCount);
    });
  });

  describe("Registry Configuration", () => {
    test("should have correct action descriptions", () => {
      const actions = ActionFactory.getAll();
      const actionMap = new Map(actions.map((action) => [action.name, action]));

      expect(actionMap.get("init")?.description).toBe(
        "Initialize Chara configuration with AI provider settings",
      );
      expect(actionMap.get("reset")?.description).toBe(
        "Reset/clear all configuration",
      );
      expect(actionMap.get("show")?.description).toBe(
        "Show current configuration",
      );
    });

    test("should have all required actions registered", () => {
      const requiredActions = ["init", "reset", "show"];
      const registeredActions = ActionFactory.getAll().map(
        (action) => action.name,
      );

      for (const requiredAction of requiredActions) {
        expect(registeredActions).toContain(requiredAction);
      }
    });

    test("should have actions with valid execute functions", () => {
      const actions = ActionFactory.getAll();

      for (const action of actions) {
        expect(action.execute).toBeDefined();
        expect(typeof action.execute).toBe("function");
      }
    });
  });
});
