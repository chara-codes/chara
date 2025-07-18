/**
 * Unit tests for action types and interfaces
 *
 * Tests the TypeScript type definitions and interfaces used in the action system:
 * - ActionOptions and derived interfaces
 * - ActionFunction type definitions
 * - BaseAction interface
 * - Action context types
 * - Type safety and inference
 * - Interface compatibility and extension
 *
 * Uses Bun's native test API with type checking utilities.
 * Run with: bun test
 */
import { describe, test, expect } from "bun:test";
import type {
  ActionOptions,
  ActionResult,
  ActionContext,
  ActionFunction,
  BaseAction,
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
} from "../types";

describe("Action Types", () => {
  describe("ActionOptions", () => {
    test("should have correct base structure", () => {
      const options: ActionOptions = {
        verbose: true,
      };

      expect(options.verbose).toBe(true);
      expect(typeof options.verbose).toBe("boolean");
    });

    test("should allow undefined verbose", () => {
      const options: ActionOptions = {};

      expect(options.verbose).toBeUndefined();
    });

    test("should allow additional properties in extended interfaces", () => {
      const initOptions: InitActionOptions = {
        verbose: true,
        force: false,
      };

      expect(initOptions.verbose).toBe(true);
      expect(initOptions.force).toBe(false);
    });
  });

  describe("ActionResult", () => {
    test("should have correct structure for success", () => {
      const result: ActionResult = {
        success: true,
        message: "Operation completed successfully",
        data: { key: "value" },
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe("Operation completed successfully");
      expect(result.data).toEqual({ key: "value" });
    });

    test("should have correct structure for failure", () => {
      const result: ActionResult = {
        success: false,
        message: "Operation failed",
      };

      expect(result.success).toBe(false);
      expect(result.message).toBe("Operation failed");
      expect(result.data).toBeUndefined();
    });

    test("should allow minimal structure", () => {
      const result: ActionResult = {
        success: true,
      };

      expect(result.success).toBe(true);
      expect(result.message).toBeUndefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe("ActionContext", () => {
    test("should have correct structure", () => {
      const context: ActionContext = {
        verbose: true,
        force: false,
      };

      expect(context.verbose).toBe(true);
      expect(context.force).toBe(false);
    });

    test("should allow minimal structure", () => {
      const context: ActionContext = {
        verbose: false,
      };

      expect(context.verbose).toBe(false);
      expect(context.force).toBeUndefined();
    });
  });

  describe("ActionFunction", () => {
    test("should accept function with no parameters", () => {
      const actionFn: ActionFunction = async () => {
        return;
      };

      expect(typeof actionFn).toBe("function");
    });

    test("should accept function with options parameter", () => {
      const actionFn: ActionFunction<ActionOptions> = async (options) => {
        if (options?.verbose) {
          console.log("Verbose mode");
        }
        return;
      };

      expect(typeof actionFn).toBe("function");
    });

    test("should accept function with custom options", () => {
      const actionFn: ActionFunction<InitActionOptions> = async (options) => {
        if (options?.force) {
          console.log("Force mode");
        }
        return;
      };

      expect(typeof actionFn).toBe("function");
    });

    test("should be callable with correct parameters", async () => {
      let called = false;
      const actionFn: ActionFunction<ActionOptions> = async (options) => {
        called = true;
        return;
      };

      await actionFn({ verbose: true });
      expect(called).toBe(true);
    });
  });

  describe("BaseAction", () => {
    test("should have correct structure", () => {
      const action: BaseAction = {
        name: "test-action",
        description: "A test action",
        execute: async () => {
          return;
        },
      };

      expect(action.name).toBe("test-action");
      expect(action.description).toBe("A test action");
      expect(typeof action.execute).toBe("function");
    });

    test("should allow complex execute function", () => {
      const action: BaseAction = {
        name: "complex-action",
        description: "A complex action",
        execute: async (options?: ActionOptions) => {
          if (options?.verbose) {
            console.log("Executing complex action");
          }
          return;
        },
      };

      expect(action.execute).toBeDefined();
      expect(typeof action.execute).toBe("function");
    });
  });

  describe("Extended Action Options", () => {
    test("InitActionOptions should extend ActionOptions", () => {
      const options: InitActionOptions = {
        verbose: true,
        force: false,
      };

      // Should be assignable to ActionOptions
      const baseOptions: ActionOptions = options;

      expect(baseOptions.verbose).toBe(true);
      expect(options.force).toBe(false);
    });

    test("ResetActionOptions should extend ActionOptions", () => {
      const options: ResetActionOptions = {
        verbose: false,
        confirm: true,
      };

      // Should be assignable to ActionOptions
      const baseOptions: ActionOptions = options;

      expect(baseOptions.verbose).toBe(false);
      expect(options.confirm).toBe(true);
    });

    test("ShowActionOptions should extend ActionOptions", () => {
      const options: ShowActionOptions = {
        verbose: true,
        format: "json",
      };

      // Should be assignable to ActionOptions
      const baseOptions: ActionOptions = options;

      expect(baseOptions.verbose).toBe(true);
      expect(options.format).toBe("json");
    });

    test("should allow format values", () => {
      const tableOptions: ShowActionOptions = {
        format: "table",
      };

      const jsonOptions: ShowActionOptions = {
        format: "json",
      };

      const yamlOptions: ShowActionOptions = {
        format: "yaml",
      };

      expect(tableOptions.format).toBe("table");
      expect(jsonOptions.format).toBe("json");
      expect(yamlOptions.format).toBe("yaml");
    });
  });

  describe("Type Inference and Compatibility", () => {
    test("should infer types correctly in function parameters", () => {
      const processInitOptions = (options: InitActionOptions) => {
        return {
          hasVerbose: options.verbose !== undefined,
          hasForce: options.force !== undefined,
        };
      };

      const result = processInitOptions({ verbose: true, force: false });

      expect(result.hasVerbose).toBe(true);
      expect(result.hasForce).toBe(true);
    });

    test("should work with generic constraints", () => {
      const createTypedAction = <T extends ActionOptions>(
        name: string,
        execute: ActionFunction<T>
      ): BaseAction => {
        return {
          name,
          description: `Action for ${name}`,
          execute: execute as ActionFunction,
        };
      };

      const initAction = createTypedAction<InitActionOptions>(
        "init",
        async (options) => {
          if (options?.force) {
            console.log("Force initialization");
          }
          return;
        }
      );

      expect(initAction.name).toBe("init");
      expect(typeof initAction.execute).toBe("function");
    });

    test("should handle union types", () => {
      type CombinedOptions = InitActionOptions | ResetActionOptions;

      const handleCombinedOptions = (options: CombinedOptions) => {
        if ('force' in options) {
          // TypeScript should narrow this to InitActionOptions
          return `Init with force: ${options.force}`;
        } else if ('confirm' in options) {
          // TypeScript should narrow this to ResetActionOptions
          return `Reset with confirm: ${options.confirm}`;
        }
        return "Unknown options";
      };

      expect(handleCombinedOptions({ force: true, verbose: false })).toBe("Init with force: true");
      expect(handleCombinedOptions({ confirm: false, verbose: true })).toBe("Reset with confirm: false");
    });
  });

  describe("Interface Extensibility", () => {
    test("should allow custom action options", () => {
      interface CustomActionOptions extends ActionOptions {
        customField: string;
        optionalField?: number;
      }

      const customOptions: CustomActionOptions = {
        verbose: true,
        customField: "test",
        optionalField: 42,
      };

      expect(customOptions.verbose).toBe(true);
      expect(customOptions.customField).toBe("test");
      expect(customOptions.optionalField).toBe(42);
    });

    test("should allow custom action results", () => {
      interface CustomActionResult extends ActionResult {
        customData?: {
          timestamp: number;
          userId: string;
        };
      }

      const result: CustomActionResult = {
        success: true,
        message: "Custom operation completed",
        data: { result: "success" },
        customData: {
          timestamp: Date.now(),
          userId: "user123",
        },
      };

      expect(result.success).toBe(true);
      expect(result.customData?.userId).toBe("user123");
    });

    test("should allow custom action contexts", () => {
      interface CustomActionContext extends ActionContext {
        userId?: string;
        sessionId?: string;
      }

      const context: CustomActionContext = {
        verbose: true,
        force: false,
        userId: "user123",
        sessionId: "session456",
      };

      expect(context.verbose).toBe(true);
      expect(context.userId).toBe("user123");
      expect(context.sessionId).toBe("session456");
    });
  });

  describe("Type Safety", () => {
    test("should enforce required properties", () => {
      // This test ensures that required properties are enforced at compile time
      // We can't test this directly at runtime, but we can verify the structure

      const validAction: BaseAction = {
        name: "test",
        description: "test description",
        execute: async () => {},
      };

      expect(validAction.name).toBeDefined();
      expect(validAction.description).toBeDefined();
      expect(validAction.execute).toBeDefined();
    });

    test("should handle optional properties correctly", () => {
      const minimalOptions: ActionOptions = {};
      const fullOptions: ActionOptions = { verbose: true };

      expect(minimalOptions.verbose).toBeUndefined();
      expect(fullOptions.verbose).toBe(true);
    });

    test("should maintain type safety in async functions", async () => {
      const typedAction: ActionFunction<InitActionOptions> = async (options) => {
        // This should be type-safe
        if (options?.force) {
          return;
        }
        if (options?.verbose) {
          console.log("Verbose mode");
        }
        return;
      };

      await expect(typedAction({ force: true, verbose: false })).resolves.toBeUndefined();
    });
  });

  describe("Real-world Usage Patterns", () => {
    test("should support action builder pattern", () => {
      class ActionBuilder {
        private action: Partial<BaseAction> = {};

        name(name: string): ActionBuilder {
          this.action.name = name;
          return this;
        }

        description(description: string): ActionBuilder {
          this.action.description = description;
          return this;
        }

        execute(execute: ActionFunction): ActionBuilder {
          this.action.execute = execute;
          return this;
        }

        build(): BaseAction {
          if (!this.action.name || !this.action.description || !this.action.execute) {
            throw new Error("Action is incomplete");
          }
          return this.action as BaseAction;
        }
      }

      const action = new ActionBuilder()
        .name("builder-test")
        .description("Test action built with builder")
        .execute(async () => {})
        .build();

      expect(action.name).toBe("builder-test");
      expect(action.description).toBe("Test action built with builder");
      expect(typeof action.execute).toBe("function");
    });

    test("should support action validation", () => {
      const validateActionOptions = (options: ActionOptions): boolean => {
        if (options.verbose !== undefined && typeof options.verbose !== "boolean") {
          return false;
        }
        return true;
      };

      expect(validateActionOptions({ verbose: true })).toBe(true);
      expect(validateActionOptions({ verbose: false })).toBe(true);
      expect(validateActionOptions({})).toBe(true);
    });

    test("should support action metadata", () => {
      interface ActionWithMetadata extends BaseAction {
        metadata: {
          version: string;
          author: string;
          tags: string[];
        };
      }

      const actionWithMetadata: ActionWithMetadata = {
        name: "metadata-action",
        description: "Action with metadata",
        execute: async () => {},
        metadata: {
          version: "1.0.0",
          author: "Test Author",
          tags: ["test", "metadata"],
        },
      };

      expect(actionWithMetadata.metadata.version).toBe("1.0.0");
      expect(actionWithMetadata.metadata.tags).toContain("test");
    });
  });
});
