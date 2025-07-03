import {
  ActionFactory,
  createAction,
  withErrorHandling,
  withLogging,
  compose,
} from "./factory";
import { initAction } from "./init";
import { resetAction } from "./reset";
import { showAction } from "./show";
import type {
  InitActionOptions,
  ResetActionOptions,
  ShowActionOptions,
} from "./types";

// Register all actions with the factory
export function registerActions(): void {
  // Register init action
  ActionFactory.register(
    createAction(
      "init",
      "Initialize Chara configuration with AI provider settings",
      compose<InitActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "init"),
      )(initAction),
    ),
  );

  // Register reset action
  ActionFactory.register(
    createAction(
      "reset",
      "Reset/clear all configuration",
      compose<ResetActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "reset"),
      )(resetAction),
    ),
  );

  // Register show action
  ActionFactory.register(
    createAction(
      "show",
      "Show current configuration",
      compose<ShowActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "show"),
      )(showAction),
    ),
  );
}

// Auto-register actions when this module is imported
registerActions();

// Export the factory for external use
export { ActionFactory };
export * from "./types";
