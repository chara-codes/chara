import { logger } from "@chara/logger";
import type {
  ActionContext,
  ActionFunction,
  ActionOptions,
  BaseAction,
} from "./types";

const actions = new Map<string, BaseAction>();

export const ActionFactory = {
  register(action: BaseAction): void {
    actions.set(action.name, action);
  },

  get(name: string): BaseAction | undefined {
    return actions.get(name);
  },

  getAll(): BaseAction[] {
    return Array.from(actions.values());
  },

  async execute<T extends ActionOptions = ActionOptions>(
    name: string,
    options: T = {} as T,
  ): Promise<any> {
    logger.info("Execute action:", name);
    const action = ActionFactory.get(name);
    if (!action) {
      throw new Error(`Action "${name}" not found`);
    }

    const context = createContext(options);

    if (context.verbose) {
      logger.debug(`Executing action: ${name}`);
      logger.debug(`Options:`, options);
    }

    try {
      const result = await action.execute(options);
      if (context.verbose) {
        logger.debug(`Action "${name}" completed successfully`);
      }
      return result;
    } catch (error) {
      if (context.verbose) {
        logger.debug(`Action "${name}" failed:`, error);
      }
      throw error;
    }
  },
};

function createContext(options: ActionOptions): ActionContext {
  return {
    verbose: options.verbose ?? false,
    force: (options as { force?: boolean }).force ?? false,
  };
}

export function createAction(
  name: string,
  description: string,
  execute: ActionFunction,
): BaseAction {
  return {
    name,
    description,
    execute,
  };
}

export function withErrorHandling<T extends ActionOptions, R = void>(
  actionFn: ActionFunction<T, R>,
): ActionFunction<T, R> {
  return async (options?: T) => {
    try {
      return await actionFn(options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Action failed: ${error.message}`);
      } else {
        logger.error("Action failed with unknown error:", error);
      }
      throw error;
    }
  };
}

export function withLogging<T extends ActionOptions, R = void>(
  actionFn: ActionFunction<T, R>,
  actionName: string,
): ActionFunction<T, R> {
  return async (options?: T) => {
    const startTime = Date.now();

    if (options?.verbose) {
      logger.debug(`Starting action: ${actionName}`);
    }

    try {
      const result = await actionFn(options);

      if (options?.verbose) {
        const duration = Date.now() - startTime;
        logger.debug(`Action "${actionName}" completed in ${duration}ms`);
      }

      return result;
    } catch (error) {
      if (options?.verbose) {
        const duration = Date.now() - startTime;
        logger.debug(`Action "${actionName}" failed after ${duration}ms`);
      }
      throw error;
    }
  };
}

export function withValidation<T extends ActionOptions, R = void>(
  actionFn: ActionFunction<T, R>,
  validator: (options?: T) => boolean | string,
): ActionFunction<T, R> {
  return async (options?: T) => {
    const validationResult = validator(options);

    if (validationResult === false) {
      throw new Error("Action validation failed");
    }

    if (typeof validationResult === "string") {
      throw new Error(`Action validation failed: ${validationResult}`);
    }

    return await actionFn(options);
  };
}

// Decorator for composing multiple action enhancers
export function compose<T extends ActionOptions, R = void>(
  ...enhancers: Array<(fn: ActionFunction<T, R>) => ActionFunction<T, R>>
): (actionFn: ActionFunction<T, R>) => ActionFunction<T, R> {
  return (actionFn: ActionFunction<T, R>) => {
    return enhancers.reduceRight((acc, enhancer) => enhancer(acc), actionFn);
  };
}
