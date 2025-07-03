/**
 * Test utilities for action testing
 *
 * Provides common utilities, mocks, and helpers for testing actions:
 * - Mock action implementations
 * - Test data generators
 * - Assertion helpers
 * - Common test patterns
 * - Mock factories
 *
 * Used across all action test files to maintain consistency and reduce duplication.
 */
import type {
  ActionOptions,
  ActionFunction,
  BaseAction,
  ActionResult,
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
} from "../types";

/**
 * Mock action implementations for testing
 */
export const mockActions = {
  /**
   * Simple mock action that succeeds by default
   */
  simple: async (options?: ActionOptions): Promise<void> => {
    if (options?.verbose) {
      console.log("Simple mock action executed");
    }
    return;
  },

  /**
   * Mock action that can be configured to fail
   */
  configurable: async (options?: ActionOptions & { shouldFail?: boolean }): Promise<void> => {
    if (options?.shouldFail) {
      throw new Error("Configurable mock action failed");
    }
    if (options?.verbose) {
      console.log("Configurable mock action executed");
    }
    return;
  },

  /**
   * Async mock action with delay
   */
  async: async (options?: ActionOptions & { delay?: number }): Promise<void> => {
    const delay = options?.delay || 10;
    await new Promise(resolve => setTimeout(resolve, delay));
    if (options?.verbose) {
      console.log(`Async mock action executed with ${delay}ms delay`);
    }
    return;
  },

  /**
   * Mock action that throws different error types
   */
  errorThrowing: async (options?: ActionOptions & { errorType?: 'string' | 'object' | 'error' | 'null' }): Promise<void> => {
    const errorType = options?.errorType || 'error';

    switch (errorType) {
      case 'string':
        throw "String error";
      case 'object':
        throw { code: 500, message: "Object error" };
      case 'null':
        throw null;
      case 'error':
      default:
        throw new Error("Standard error");
    }
  },
};

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate basic action options
   */
  actionOptions: (overrides?: Partial<ActionOptions>): ActionOptions => ({
    verbose: false,
    ...overrides,
  }),

  /**
   * Generate init action options
   */
  initOptions: (overrides?: Partial<InitActionOptions>): InitActionOptions => ({
    verbose: false,
    force: false,
    ...overrides,
  }),

  /**
   * Generate reset action options
   */
  resetOptions: (overrides?: Partial<ResetActionOptions>): ResetActionOptions => ({
    verbose: false,
    confirm: false,
    ...overrides,
  }),

  /**
   * Generate show action options
   */
  showOptions: (overrides?: Partial<ShowActionOptions>): ShowActionOptions => ({
    verbose: false,
    format: 'table',
    ...overrides,
  }),

  /**
   * Generate base action
   */
  baseAction: (overrides?: Partial<BaseAction>): BaseAction => ({
    name: "test-action",
    description: "Test action description",
    execute: mockActions.simple,
    ...overrides,
  }),

  /**
   * Generate action result
   */
  actionResult: (overrides?: Partial<ActionResult>): ActionResult => ({
    success: true,
    message: "Action completed successfully",
    data: { test: "data" },
    ...overrides,
  }),
};

/**
 * Mock factories for creating test doubles
 */
export const mockFactories = {
  /**
   * Create a spy function that tracks calls
   */
  createSpy: <T extends (...args: any[]) => any>(implementation?: T) => {
    const calls: Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: Error }> = [];

    const spy = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        const result = implementation ? await implementation(...args) : undefined;
        calls.push({ args, result });
        return result;
      } catch (error) {
        calls.push({ args, error: error as Error });
        throw error;
      }
    };

    spy.calls = calls;
    spy.callCount = () => calls.length;
    spy.calledWith = (...args: Parameters<T>) =>
      calls.some(call => JSON.stringify(call.args) === JSON.stringify(args));
    spy.lastCall = () => calls[calls.length - 1];
    spy.reset = () => calls.length = 0;

    return spy as T & {
      calls: typeof calls;
      callCount: () => number;
      calledWith: (...args: Parameters<T>) => boolean;
      lastCall: () => typeof calls[0] | undefined;
      reset: () => void;
    };
  },

  /**
   * Create a mock logger
   */
  createMockLogger: () => ({
    debug: mockFactories.createSpy((message: string, ...args: any[]) => {}),
    info: mockFactories.createSpy((message: string, ...args: any[]) => {}),
    warn: mockFactories.createSpy((message: string, ...args: any[]) => {}),
    error: mockFactories.createSpy((message: string, ...args: any[]) => {}),
    setLevel: mockFactories.createSpy((level: string) => {}),
  }),

  /**
   * Create a mock action factory
   */
  createMockActionFactory: () => {
    const actions = new Map<string, BaseAction>();

    return {
      register: mockFactories.createSpy((action: BaseAction) => {
        actions.set(action.name, action);
      }),
      get: mockFactories.createSpy((name: string) => actions.get(name)),
      getAll: mockFactories.createSpy(() => Array.from(actions.values())),
      execute: mockFactories.createSpy(async (name: string, options?: ActionOptions) => {
        const action = actions.get(name);
        if (!action) {
          throw new Error(`Action "${name}" not found`);
        }
        await action.execute(options);
      }),
      _actions: actions, // For testing purposes
    };
  },
};

/**
 * Test assertion helpers
 */
export const assertions = {
  /**
   * Assert that an action has the correct structure
   */
  isValidAction: (action: any): action is BaseAction => {
    return (
      typeof action === 'object' &&
      typeof action.name === 'string' &&
      typeof action.description === 'string' &&
      typeof action.execute === 'function'
    );
  },

  /**
   * Assert that options extend ActionOptions correctly
   */
  isValidActionOptions: (options: any): options is ActionOptions => {
    return (
      typeof options === 'object' &&
      (options.verbose === undefined || typeof options.verbose === 'boolean')
    );
  },

  /**
   * Assert that a function is a valid ActionFunction
   */
  isValidActionFunction: (fn: any): fn is ActionFunction => {
    return typeof fn === 'function';
  },

  /**
   * Assert that an action result has the correct structure
   */
  isValidActionResult: (result: any): result is ActionResult => {
    return (
      typeof result === 'object' &&
      typeof result.success === 'boolean' &&
      (result.message === undefined || typeof result.message === 'string') &&
      (result.data === undefined || typeof result.data !== 'undefined')
    );
  },
};

/**
 * Common test patterns and utilities
 */
export const testPatterns = {
  /**
   * Test an action's basic functionality
   */
  testBasicAction: async (action: BaseAction, options?: ActionOptions) => {
    expect(assertions.isValidAction(action)).toBe(true);
    await expect(action.execute(options)).resolves.toBeUndefined();
  },

  /**
   * Test an action's error handling
   */
  testActionErrorHandling: async (
    action: BaseAction,
    errorOptions: ActionOptions,
    expectedError: string | RegExp
  ) => {
    expect(assertions.isValidAction(action)).toBe(true);
    await expect(action.execute(errorOptions)).rejects.toThrow(expectedError);
  },

  /**
   * Test action timing
   */
  testActionTiming: async (action: BaseAction, options?: ActionOptions) => {
    const startTime = Date.now();
    await action.execute(options);
    const endTime = Date.now();
    return endTime - startTime;
  },

  /**
   * Test action with different option combinations
   */
  testActionWithOptions: async (
    action: BaseAction,
    optionCombinations: ActionOptions[]
  ) => {
    for (const options of optionCombinations) {
      await expect(action.execute(options)).resolves.toBeUndefined();
    }
  },
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  /**
   * Measure action execution time
   */
  measureExecutionTime: async (action: BaseAction, options?: ActionOptions): Promise<number> => {
    const startTime = performance.now();
    await action.execute(options);
    const endTime = performance.now();
    return endTime - startTime;
  },

  /**
   * Test action under load
   */
  testActionLoad: async (
    action: BaseAction,
    concurrency: number,
    options?: ActionOptions
  ): Promise<number[]> => {
    const promises = Array(concurrency).fill(null).map(() =>
      performanceUtils.measureExecutionTime(action, options)
    );
    return Promise.all(promises);
  },

  /**
   * Memory usage estimation (basic)
   */
  estimateMemoryUsage: (): number => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  },
};

/**
 * Setup and teardown utilities
 */
export const setupUtils = {
  /**
   * Create a clean test environment
   */
  createTestEnvironment: () => {
    const mockLogger = mockFactories.createMockLogger();
    const mockFactory = mockFactories.createMockActionFactory();

    return {
      mockLogger,
      mockFactory,
      cleanup: () => {
        // Reset all mocks
        mockLogger.debug.reset();
        mockLogger.info.reset();
        mockLogger.warn.reset();
        mockLogger.error.reset();
        mockLogger.setLevel.reset();

        mockFactory.register.reset();
        mockFactory.get.reset();
        mockFactory.getAll.reset();
        mockFactory.execute.reset();
        mockFactory._actions.clear();
      },
    };
  },

  /**
   * Setup common test actions
   */
  setupTestActions: (factory: ReturnType<typeof mockFactories.createMockActionFactory>) => {
    const testActions = [
      testData.baseAction({ name: "test1", description: "Test action 1" }),
      testData.baseAction({ name: "test2", description: "Test action 2" }),
      testData.baseAction({ name: "test3", description: "Test action 3" }),
    ];

    testActions.forEach(action => factory.register(action));
    return testActions;
  },
};

/**
 * Default export with all utilities
 */
export default {
  mockActions,
  testData,
  mockFactories,
  assertions,
  testPatterns,
  performanceUtils,
  setupUtils,
};
