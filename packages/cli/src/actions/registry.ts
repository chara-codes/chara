import { defaultModelAction } from "./default-model";
import { startAgentsAction, stopAgentsAction } from "./start-agents";
import { setupLoggingAction } from "./setup-logging";
import { setupProjectAction } from "./setup-project";
import { loadConfigAction } from "./load-config";
import { connectMcpAction } from "./connect-mcp";
import { connectEventsAction } from "./connect-events";
import { initApiAction } from "./init-api";
import { initMcpClientAction } from "./init-mcp-client";
import { initializeConfigAction } from "./initialize-config";
import {
  ActionFactory,
  compose,
  createAction,
  withErrorHandling,
  withLogging,
} from "./factory";
import { initAction } from "./init";
import { resetAction } from "./reset";
import { showAction } from "./show";
import type {
  DefaultModelActionOptions,
  StartAgentsActionOptions,
  StopAgentsActionOptions,
  SetupLoggingActionOptions,
  SetupProjectActionOptions,
  LoadConfigActionOptions,
  ConnectMcpActionOptions,
  ConnectEventsActionOptions,
  InitApiActionOptions,
  InitMcpClientActionOptions,
  InitializeConfigActionOptions,
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

  // Register default-model action
  ActionFactory.register(
    createAction(
      "default-model",
      "Set default AI model for Chara Codes",
      compose<DefaultModelActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "default-model"),
      )(defaultModelAction),
    ),
  );

  // Register start-agents action
  ActionFactory.register(
    createAction(
      "start-agents",
      "Start Chara agents server",
      compose<StartAgentsActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "start-agents"),
      )(startAgentsAction),
    ),
  );

  // Register stop-agents action
  ActionFactory.register(
    createAction(
      "stop-agents",
      "Stop Chara agents server",
      withLogging(
        withErrorHandling<StopAgentsActionOptions, void>(stopAgentsAction),
        "stop-agents",
      ),
    ),
  );

  // Register setup-logging action
  ActionFactory.register(
    createAction(
      "setup-logging",
      "Setup logging configuration",
      compose<SetupLoggingActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "setup-logging"),
      )(setupLoggingAction),
    ),
  );

  // Register setup-project action
  ActionFactory.register(
    createAction(
      "setup-project",
      "Setup project directory",
      compose<SetupProjectActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "setup-project"),
      )(setupProjectAction),
    ),
  );

  // Register load-config action
  ActionFactory.register(
    createAction(
      "load-config",
      "Load project configuration",
      compose<LoadConfigActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "load-config"),
      )(loadConfigAction),
    ),
  );

  // Register connect-mcp action
  ActionFactory.register(
    createAction(
      "connect-mcp",
      "Connect to MCP servers",
      compose<ConnectMcpActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "connect-mcp"),
      )(connectMcpAction),
    ),
  );

  // Register connect-events action
  ActionFactory.register(
    createAction(
      "connect-events",
      "Connect to server events",
      compose<ConnectEventsActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "connect-events"),
      )(connectEventsAction),
    ),
  );

  // Register init-api action
  ActionFactory.register(
    createAction(
      "init-api",
      "Initialize API client",
      compose<InitApiActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "init-api"),
      )(initApiAction),
    ),
  );

  // Register init-mcp-client action
  ActionFactory.register(
    createAction(
      "init-mcp-client",
      "Initialize MCP client",
      compose<InitMcpClientActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "init-mcp-client"),
      )(initMcpClientAction),
    ),
  );

  // Register initialize-config action
  ActionFactory.register(
    createAction(
      "initialize-config",
      "Initialize Chara configuration with default model from global config",
      compose<InitializeConfigActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "initialize-config"),
      )(initializeConfigAction),
    ),
  );
}

// Auto-register actions when this module is imported
registerActions();

// Export the factory for external use
export * from "./types";
export { ActionFactory };
