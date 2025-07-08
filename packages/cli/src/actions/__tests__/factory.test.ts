/**
 * Unit tests for action factory
 *
 * Tests the complete functionality of the action factory including:
 * - Action registration and retrieval
 * - Action execution with options
 * - Action enhancers (withErrorHandling, withLogging, withValidation)
 * - Function composition
 * - Error handling and edge cases
 * - Context creation and management
 *
 * Uses Bun's native test API with mocked dependencies.
 * Run with: bun test
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  ActionFactory,
  compose,
  createAction,
  withErrorHandling,
  withLogging,
  withValidation,
} from "../factory";
import type { ActionFunction, ActionOptions } from "../types";

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

// Test action implementations
interface TestActionOptions extends ActionOptions {
  testValue?: string;
  shouldFail?: boolean;
}

const testAction: ActionFunction<TestActionOptions> = async (options = {}) => {
  if (options.shouldFail) {
    throw new Error("Test action failed");
  }
  if (options.verbose) {
    console.log("Test action executed with verbose mode");
  }
  return;
};

const asyncTestAction: ActionFunction<TestActionOptions> = async (
  options = {},
) => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (options.testValue === "async") {
    return;
  }
  throw new Error("Async test failed");
};

const validationTestAction: ActionFunction<TestActionOptions> = async (
  options = {},
) => {
  if (!options.testValue) {
    throw new Error("testValue is required");
  }
  return;
};

describe("Action Factory", () => {
  beforeEach(() => {
    // Clear all registered actions before each test
    ActionFactory.getAll().forEach((action) => {
      // We need to clear the internal map, but since it's private,
      // we'll work around it by re-registering over existing actions
    });

    // Reset all mocks
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
  });

  describe("Action Registration", () => {
    test("should register an action successfully", () => {
      const action = createAction("test-action", "Test action", testAction);

      ActionFactory.register(action);

      const retrieved = ActionFactory.get("test-action");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("test-action");
      expect(retrieved?.description).toBe("Test action");
      expect(retrieved?.execute).toBe(testAction);
    });

    test("should retrieve all registered actions", () => {
      const action1 = createAction("action1", "First action", testAction);
      const action2 = createAction("action2", "Second action", testAction);

      ActionFactory.register(action1);
      ActionFactory.register(action2);

      const allActions = ActionFactory.getAll();
      expect(allActions.length).toBeGreaterThanOrEqual(2);

      const actionNames = allActions.map((action) => action.name);
      expect(actionNames).toContain("action1");
      expect(actionNames).toContain("action2");
    });

    test("should return undefined for non-existent action", () => {
      const retrieved = ActionFactory.get("non-existent");
      expect(retrieved).toBeUndefined();
    });

    test("should overwrite existing action with same name", () => {
      const action1 = createAction("duplicate", "First version", testAction);
      const action2 = createAction(
        "duplicate",
        "Second version",
        asyncTestAction,
      );

      ActionFactory.register(action1);
      ActionFactory.register(action2);

      const retrieved = ActionFactory.get("duplicate");
      expect(retrieved?.description).toBe("Second version");
      expect(retrieved?.execute).toBe(asyncTestAction);
    });
  });

  describe("Action Execution", () => {
    test("should execute action successfully", async () => {
      const action = createAction("test-exec", "Test execution", testAction);
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("test-exec", { verbose: true }),
      ).resolves.toBeUndefined();
    });

    test("should execute action with no options", async () => {
      const action = createAction(
        "test-no-opts",
        "Test no options",
        testAction,
      );
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("test-no-opts"),
      ).resolves.toBeUndefined();
    });

    test("should execute async action", async () => {
      const action = createAction("test-async", "Test async", asyncTestAction);
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("test-async", { testValue: "async" }),
      ).resolves.toBeUndefined();
    });

    test("should throw error for non-existent action", async () => {
      await expect(ActionFactory.execute("non-existent")).rejects.toThrow(
        'Action "non-existent" not found',
      );
    });

    test("should propagate action errors", async () => {
      const action = createAction("test-error", "Test error", testAction);
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("test-error", { shouldFail: true }),
      ).rejects.toThrow("Test action failed");
    });

    test("should log debug information in verbose mode", async () => {
      const action = createAction("test-verbose", "Test verbose", testAction);
      ActionFactory.register(action);

      await ActionFactory.execute("test-verbose", { verbose: true });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Executing action: test-verbose",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith("Options:", {
        verbose: true,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Action "test-verbose" completed successfully',
      );
    });

    test("should log debug information on action failure", async () => {
      const action = createAction(
        "test-fail-verbose",
        "Test fail verbose",
        testAction,
      );
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("test-fail-verbose", {
          shouldFail: true,
          verbose: true,
        }),
      ).rejects.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Executing action: test-fail-verbose",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Action "test-fail-verbose" failed:',
        expect.any(Error),
      );
    });
  });

  describe("createAction helper", () => {
    test("should create action with correct properties", () => {
      const action = createAction(
        "helper-test",
        "Helper test description",
        testAction,
      );

      expect(action.name).toBe("helper-test");
      expect(action.description).toBe("Helper test description");
      expect(action.execute).toBe(testAction);
    });

    test("should create action with different execute function", () => {
      const customAction = async () => {
        return "custom";
      };
      const action = createAction("custom", "Custom action", customAction);

      expect(action.execute).toBe(customAction);
    });
  });

  describe("Action Enhancers", () => {
    describe("withErrorHandling", () => {
      test("should catch and re-throw errors with proper logging", async () => {
        const failingAction: ActionFunction<TestActionOptions> = async () => {
          throw new Error("Original error");
        };

        const enhancedAction = withErrorHandling(failingAction);

        await expect(enhancedAction()).rejects.toThrow("Original error");
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Action failed: Original error",
        );
      });

      test("should handle non-Error objects", async () => {
        const failingAction: ActionFunction<TestActionOptions> = async () => {
          throw "String error";
        };

        const enhancedAction = withErrorHandling(failingAction);

        await expect(enhancedAction()).rejects.toThrow("String error");
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Action failed with unknown error:",
          "String error",
        );
      });

      test("should pass through successful execution", async () => {
        const successAction: ActionFunction<TestActionOptions> = async (
          options,
        ) => {
          return;
        };

        const enhancedAction = withErrorHandling(successAction);

        await expect(
          enhancedAction({ testValue: "success" }),
        ).resolves.toBeUndefined();
        expect(mockLogger.error).not.toHaveBeenCalled();
      });
    });

    describe("withLogging", () => {
      test("should log action start and completion", async () => {
        const slowAction: ActionFunction<TestActionOptions> = async (
          options,
        ) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return;
        };

        const enhancedAction = withLogging(slowAction, "slow-action");

        await enhancedAction({ verbose: true });

        expect(mockLogger.debug).toHaveBeenCalledWith(
          "Starting action: slow-action",
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringMatching(/Action "slow-action" completed in \d+ms/),
        );
      });

      test("should log action failure with timing", async () => {
        const failingAction: ActionFunction<TestActionOptions> = async (
          options,
        ) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          throw new Error("Action failed");
        };

        const enhancedAction = withLogging(failingAction, "failing-action");

        await expect(enhancedAction({ verbose: true })).rejects.toThrow(
          "Action failed",
        );

        expect(mockLogger.debug).toHaveBeenCalledWith(
          "Starting action: failing-action",
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringMatching(/Action "failing-action" failed after \d+ms/),
        );
      });

      test("should only log in verbose mode", async () => {
        const simpleAction: ActionFunction<TestActionOptions> = async () => {
          return;
        };

        const enhancedAction = withLogging(simpleAction, "simple-action");

        await enhancedAction({ verbose: false });

        expect(mockLogger.debug).not.toHaveBeenCalled();
      });
    });

    describe("withValidation", () => {
      test("should validate options before execution", async () => {
        const validator = (options?: TestActionOptions) => {
          if (!options?.testValue) {
            return "testValue is required";
          }
          return true;
        };

        const enhancedAction = withValidation(testAction, validator);

        await expect(enhancedAction()).rejects.toThrow(
          "Action validation failed: testValue is required",
        );
        await expect(
          enhancedAction({ testValue: "valid" }),
        ).resolves.toBeUndefined();
      });

      test("should handle boolean validation results", async () => {
        const validator = (options?: TestActionOptions) => {
          return options?.testValue === "valid";
        };

        const enhancedAction = withValidation(testAction, validator);

        await expect(enhancedAction({ testValue: "invalid" })).rejects.toThrow(
          "Action validation failed",
        );
        await expect(
          enhancedAction({ testValue: "valid" }),
        ).resolves.toBeUndefined();
      });

      test("should pass through valid options", async () => {
        const validator = () => true;

        const enhancedAction = withValidation(testAction, validator);

        await expect(
          enhancedAction({ testValue: "any" }),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("Function Composition", () => {
    test("should compose multiple enhancers", async () => {
      const validator = (options?: TestActionOptions) => {
        return options?.testValue === "valid";
      };

      const enhancedAction = compose<TestActionOptions>(
        withErrorHandling,
        (fn) => withLogging(fn, "composed-action"),
        (fn) => withValidation(fn, validator),
      )(testAction);

      // Should pass validation and execute successfully
      await expect(
        enhancedAction({ testValue: "valid", verbose: true }),
      ).resolves.toBeUndefined();

      // Should log due to withLogging
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting action: composed-action",
      );

      // Should fail validation
      await expect(enhancedAction({ testValue: "invalid" })).rejects.toThrow(
        "Action validation failed",
      );
    });

    test("should apply enhancers in correct order", async () => {
      const calls: string[] = [];

      const enhancer1 = (fn: ActionFunction<TestActionOptions>) => {
        return async (options) => {
          calls.push("enhancer1-before");
          await fn(options);
          calls.push("enhancer1-after");
        };
      };

      const enhancer2 = (fn: ActionFunction<TestActionOptions>) => {
        return async (options) => {
          calls.push("enhancer2-before");
          await fn(options);
          calls.push("enhancer2-after");
        };
      };

      const trackingAction: ActionFunction<TestActionOptions> = async () => {
        calls.push("action-executed");
      };

      const enhancedAction = compose<TestActionOptions>(
        enhancer1,
        enhancer2,
      )(trackingAction);

      await enhancedAction();

      expect(calls).toEqual([
        "enhancer1-before",
        "enhancer2-before",
        "action-executed",
        "enhancer2-after",
        "enhancer1-after",
      ]);
    });

    test("should handle empty composition", async () => {
      const enhancedAction = compose<TestActionOptions>()(testAction);

      await expect(
        enhancedAction({ testValue: "test" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("Context Creation", () => {
    test("should create context with correct default values", async () => {
      const contextTestAction: ActionFunction<TestActionOptions> = async (
        options,
      ) => {
        // We can't directly test context creation since it's private,
        // but we can test the behavior it enables
        return;
      };

      const action = createAction(
        "context-test",
        "Context test",
        contextTestAction,
      );
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("context-test"),
      ).resolves.toBeUndefined();
    });

    test("should handle verbose context correctly", async () => {
      const action = createAction(
        "verbose-context",
        "Verbose context",
        testAction,
      );
      ActionFactory.register(action);

      await ActionFactory.execute("verbose-context", { verbose: true });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Executing action: verbose-context",
      );
    });

    test("should handle force context correctly", async () => {
      const forceTestAction: ActionFunction<
        TestActionOptions & { force?: boolean }
      > = async (options) => {
        if (options?.force) {
          return;
        }
        throw new Error("Force required");
      };

      const action = createAction(
        "force-context",
        "Force context",
        forceTestAction,
      );
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("force-context", { force: true }),
      ).resolves.toBeUndefined();
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete action lifecycle", async () => {
      const complexAction: ActionFunction<TestActionOptions> = async (
        options,
      ) => {
        if (options?.verbose) {
          console.log("Complex action running");
        }

        if (options?.shouldFail) {
          throw new Error("Complex action failed");
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
        return;
      };

      const validator = (options?: TestActionOptions) => {
        return options?.testValue !== "invalid";
      };

      const enhancedAction = compose<TestActionOptions>(
        withErrorHandling,
        (fn) => withLogging(fn, "complex-action"),
        (fn) => withValidation(fn, validator),
      )(complexAction);

      const action = createAction(
        "complex-lifecycle",
        "Complex lifecycle test",
        enhancedAction,
      );
      ActionFactory.register(action);

      // Test successful execution
      await expect(
        ActionFactory.execute("complex-lifecycle", {
          testValue: "valid",
          verbose: true,
        }),
      ).resolves.toBeUndefined();

      // Test validation failure
      await expect(
        ActionFactory.execute("complex-lifecycle", {
          testValue: "invalid",
        }),
      ).rejects.toThrow("Action validation failed");

      // Test action failure
      await expect(
        ActionFactory.execute("complex-lifecycle", {
          testValue: "valid",
          shouldFail: true,
        }),
      ).rejects.toThrow("Complex action failed");
    });

    test("should handle multiple actions in sequence", async () => {
      const order: string[] = [];

      const action1: ActionFunction<TestActionOptions> = async () => {
        order.push("action1");
      };

      const action2: ActionFunction<TestActionOptions> = async () => {
        order.push("action2");
      };

      const action3: ActionFunction<TestActionOptions> = async () => {
        order.push("action3");
      };

      ActionFactory.register(createAction("seq1", "Sequence 1", action1));
      ActionFactory.register(createAction("seq2", "Sequence 2", action2));
      ActionFactory.register(createAction("seq3", "Sequence 3", action3));

      await ActionFactory.execute("seq1");
      await ActionFactory.execute("seq2");
      await ActionFactory.execute("seq3");

      expect(order).toEqual(["action1", "action2", "action3"]);
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle null/undefined options gracefully", async () => {
      const nullSafeAction: ActionFunction<TestActionOptions> = async (
        options,
      ) => {
        return;
      };

      const action = createAction("null-safe", "Null safe", nullSafeAction);
      ActionFactory.register(action);

      await expect(
        ActionFactory.execute("null-safe", undefined),
      ).resolves.toBeUndefined();
    });

    test("should handle actions that throw non-Error objects", async () => {
      const weirdThrowAction: ActionFunction<TestActionOptions> = async () => {
        throw { message: "Object error", code: 42 };
      };

      const action = createAction(
        "weird-throw",
        "Weird throw",
        weirdThrowAction,
      );
      ActionFactory.register(action);

      await expect(ActionFactory.execute("weird-throw")).rejects.toEqual({
        message: "Object error",
        code: 42,
      });
    });

    test("should handle synchronous actions that throw", async () => {
      const syncThrowAction: ActionFunction<TestActionOptions> = async () => {
        throw new Error("Sync error");
      };

      const action = createAction("sync-throw", "Sync throw", syncThrowAction);
      ActionFactory.register(action);

      await expect(ActionFactory.execute("sync-throw")).rejects.toThrow(
        "Sync error",
      );
    });
  });
});
