import { logger } from "@chara/logger";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
} from "../utils/prompts";
import { bold, cyan, green, yellow } from "picocolors";
import {
  existsGlobalConfig,
  readGlobalConfig,
  updateGlobalConfig,
} from "@chara/settings";
import type { DefaultModelActionOptions } from "./types";
import { startServer } from "@chara/agents";

interface Model {
  id: string;
  name: string;
  provider: string;
  recommended?: boolean;
}

interface ApiModelsResponse {
  models: Model[];
}

/**
 * Helper function to safely stop the server
 */
function stopServer(server: any): void {
  if (server?.stop && typeof server.stop === "function") {
    try {
      server.stop();
    } catch (closeError) {
      logger.debug("Error stopping server:", closeError);
    }
  }
}

export async function defaultModelAction(
  options: DefaultModelActionOptions = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  intro(bold(cyan("🤖 Set Default Model")));

  // Check if config exists
  const configExists = await existsGlobalConfig();
  if (!configExists) {
    logger.error(
      "No configuration found. Run 'chara init' first to set up your providers.",
    );
    return;
  }

  let config: Record<string, unknown>;
  try {
    config = await readGlobalConfig();
  } catch (error) {
    logger.error("Error reading configuration:", error);
    throw error;
  }

  // Start server
  const s = spinner();
  s.start("Starting server...");

  let server: any;
  try {
    const port = options.port || 3031;
    server = await startServer({
      port,
      mcp: { enabled: false },
      runner: { enabled: false },
      websocket: { enabled: false },
    });
    s.stop(`Server started on port ${port}`);
  } catch (error) {
    s.stop("Failed to start server");
    logger.error("Error starting server:", error);
    throw error;
  }

  // Fetch models from API
  s.start("Fetching available models...");

  let models: Model[] = [];
  try {
    const port = options.port || 3031;
    const modelsUrl = `http://localhost:${port}/api/models`;
    console.log(modelsUrl);
    const response = await fetch(modelsUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiModelsResponse = await response.json();
    models = data.models;
    s.stop(`Found ${models.length} available models`);
  } catch (error) {
    s.stop("Failed to fetch models");
    logger.error("Error fetching models:", error);

    // Clean up server
    stopServer(server);
    throw error;
  }

  if (models.length === 0) {
    logger.info(
      "No models available. Please check your provider configuration.",
    );

    // Clean up server
    stopServer(server);
    return;
  }

  // Show current default model if exists
  const currentDefault = config.defaultModel as string | undefined;
  if (currentDefault) {
    logger.info(`\nCurrent default model: ${green(currentDefault)}`);
  }

  // Sort models: recommended first, then others
  const sortedModels = models.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return 0;
  });

  // Present model selection
  const modelOptions = sortedModels.map((model) => ({
    value: `${model.provider}:::${model.id}`,
    label: model.recommended
      ? `${yellow("★")} ${model.name} (${model.provider})`
      : `${model.name} (${model.provider})`,
    hint: model.provider,
  }));

  const selectedModel = await select({
    message: "Select a default model:",
    options: modelOptions,
    initialValue: currentDefault,
  });

  if (isCancel(selectedModel)) {
    cancel("Model selection cancelled.");

    // Clean up server
    stopServer(server);
    return;
  }

  // Confirm selection
  const shouldSave = await confirm({
    message: `Set "${selectedModel}" as your default model?`,
    initialValue: true,
  });

  if (isCancel(shouldSave) || !shouldSave) {
    cancel("Default model not saved.");

    // Clean up server
    stopServer(server);
    return;
  }

  // Save to config
  s.start("Saving default model...");

  try {
    const updatedConfig = {
      ...config,
      defaultModel: selectedModel,
    };

    await updateGlobalConfig(updatedConfig);
    s.stop("Default model saved successfully!");

    outro(
      `${bold(green("✅ Default model set!"))}

Your default model has been set to: ${bold(cyan(selectedModel))}

This model will be used by default in Chara Codes unless overridden by project-specific settings.`,
    );
  } catch (error) {
    s.stop("Failed to save default model");
    logger.error("Error saving default model:", error);
    throw error;
  } finally {
    // Clean up server
    stopServer(server);
  }
}
