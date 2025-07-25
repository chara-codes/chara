import { defaultModelAction } from "./default-model";
import {
  ActionFactory,
  compose,
  createAction,
  withErrorHandling,
  withLogging,
} from "./factory";
import { initAction } from "./init";
import { initializeConfigAction } from "./initialize-config";
import { loadConfigAction } from "./load-config";
import { resetAction } from "./reset";
import { serveStaticAction, stopStaticAction } from "./serve-static";
import { setupLoggingAction } from "./setup-logging";
import { setupProjectAction } from "./setup-project";
import { showAction } from "./show";
import { startAgentsAction, stopAgentsAction } from "./start-agents";
import { startServerAction } from "./start-server";
import { stopServerAction } from "./stop-server";
import {
  startTunnelServerAction,
  stopTunnelServerAction,
} from "./tunnel-server";
import {
  startTunnelClientAction,
  stopTunnelClientAction,
} from "./tunnel-client";
import type {
  DefaultModelActionOptions,
  InitActionOptions,
  InitializeConfigActionOptions,
  LoadConfigActionOptions,
  ResetActionOptions,
  ServeStaticActionOptions,
  SetupLoggingActionOptions,
  SetupProjectActionOptions,
  ShowActionOptions,
  StartAgentsActionOptions,
  StartServerActionOptions,
  StartTunnelServerActionOptions,
  StartTunnelClientActionOptions,
  StopAgentsActionOptions,
  StopServerActionOptions,
  StopServeStaticActionOptions,
  StopTunnelServerActionOptions,
  StopTunnelClientActionOptions,
} from "./types";

// Register all actions with the factory
export function registerActions(): void {
  // Register init action
  ActionFactory.register(
    createAction(
      "init",
      "Initialize Chara configuration with AI provider settings",
      compose<InitActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "init")
      )(initAction)
    )
  );

  // Register reset action
  ActionFactory.register(
    createAction(
      "reset",
      "Reset/clear all configuration",
      compose<ResetActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "reset")
      )(resetAction)
    )
  );

  // Register show action
  ActionFactory.register(
    createAction(
      "show",
      "Show current configuration",
      compose<ShowActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "show")
      )(showAction)
    )
  );

  // Register default-model action
  ActionFactory.register(
    createAction(
      "default-model",
      "Set default AI model for Chara Codes",
      compose<DefaultModelActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "default-model")
      )(defaultModelAction)
    )
  );

  // Register start-agents action
  ActionFactory.register(
    createAction(
      "start-agents",
      "Start Chara agents server",
      compose<StartAgentsActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "start-agents")
      )(startAgentsAction)
    )
  );

  // Register stop-agents action
  ActionFactory.register(
    createAction(
      "stop-agents",
      "Stop Chara agents server",
      withLogging(
        withErrorHandling<StopAgentsActionOptions, void>(stopAgentsAction),
        "stop-agents"
      )
    )
  );

  // Register start-server action
  ActionFactory.register(
    createAction(
      "start-server",
      "Start Chara server",
      compose<StartServerActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "start-server")
      )(startServerAction)
    )
  );

  // Register stop-server action
  ActionFactory.register(
    createAction(
      "stop-server",
      "Stop Chara server",
      withLogging(
        withErrorHandling<StopServerActionOptions, void>(stopServerAction),
        "stop-server"
      )
    )
  );

  // Register setup-logging action
  ActionFactory.register(
    createAction(
      "setup-logging",
      "Setup logging configuration",
      compose<SetupLoggingActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "setup-logging")
      )(setupLoggingAction)
    )
  );

  // Register setup-project action
  ActionFactory.register(
    createAction(
      "setup-project",
      "Setup project directory",
      compose<SetupProjectActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "setup-project")
      )(setupProjectAction)
    )
  );

  // Register load-config action
  ActionFactory.register(
    createAction(
      "load-config",
      "Load project configuration",
      compose<LoadConfigActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "load-config")
      )(loadConfigAction)
    )
  );

  // Register initialize-config action
  ActionFactory.register(
    createAction(
      "initialize-config",
      "Initialize Chara configuration with default model from global config",
      compose<InitializeConfigActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "initialize-config")
      )(initializeConfigAction)
    )
  );

  // Register serve-static action
  ActionFactory.register(
    createAction(
      "serve-static",
      "Serve static HTML, CSS, and JavaScript files",
      compose<ServeStaticActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "serve-static")
      )(serveStaticAction)
    )
  );

  // Register stop-serve-static action
  ActionFactory.register(
    createAction(
      "stop-serve-static",
      "Stop Serve static HTML, CSS, and JavaScript files",
      compose<StopServeStaticActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "stop-serve-static")
      )(stopStaticAction)
    )
  );

  // Register start-tunnel-server action
  ActionFactory.register(
    createAction(
      "start-tunnel-server",
      "Start tunnel server to expose local development servers to the internet",
      compose<StartTunnelServerActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "start-tunnel-server")
      )(startTunnelServerAction)
    )
  );

  // Register stop-tunnel-server action
  ActionFactory.register(
    createAction(
      "stop-tunnel-server",
      "Stop tunnel server",
      compose<StopTunnelServerActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "stop-tunnel-server")
      )(stopTunnelServerAction)
    )
  );

  // Register start-tunnel-client action
  ActionFactory.register(
    createAction(
      "start-tunnel-client",
      "Start tunnel client to connect local development server to the internet",
      compose<StartTunnelClientActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "start-tunnel-client")
      )(startTunnelClientAction)
    )
  );

  // Register stop-tunnel-client action
  ActionFactory.register(
    createAction(
      "stop-tunnel-client",
      "Stop tunnel client",
      compose<StopTunnelClientActionOptions>(withErrorHandling, (fn) =>
        withLogging(fn, "stop-tunnel-client")
      )(stopTunnelClientAction)
    )
  );
}

// Auto-register actions when this module is imported
registerActions();

// Export the factory for external use
export * from "./types";
export { ActionFactory };
