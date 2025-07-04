import { logger } from "@chara/logger";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
} from "@clack/prompts";
import { bold, cyan, green } from "picocolors";
import {
  existsGlobalConfig,
  readGlobalConfig,
  updateGlobalConfig,
} from "@chara/settings";
import type { DefaultModelActionOptions } from "./types";

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ApiModelsResponse {
  models: Model[];
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
    const { startServer } = await import("@chara/agents");
    const port = options.port || 3031;
    server = await startServer({ port });
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
    const response = await fetch(`http://localhost:${port}/api/models`);

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
    if (server?.stop && typeof server.stop === "function") {
      try {
        server.stop();
      } catch (closeError) {
        logger.debug("Error stopping server:", closeError);
      }
    }
    throw error;
  }

  if (models.length === 0) {
    logger.info(
      "No models available. Please check your provider configuration.",
    );

    // Clean up server
    if (server?.stop && typeof server.stop === "function") {
      try {
        server.stop();
      } catch (closeError) {
        logger.debug("Error stopping server:", closeError);
      }
    }
    return;
  }

  // Show current default model if exists
  const currentDefault = config.defaultModel as string | undefined;
  if (currentDefault) {
    logger.info(`\nCurrent default model: ${green(currentDefault)}`);
  }

  // Present model selection
  const modelOptions = models.map((model) => ({
    value: `${model.provider}:::${model.id}`,
    label: `${model.name} (${model.provider})`,
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
    if (server?.stop && typeof server.stop === "function") {
      try {
        server.stop();
      } catch (closeError) {
        logger.debug("Error stopping server:", closeError);
      }
    }
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
    if (server?.stop && typeof server.stop === "function") {
      try {
        server.stop();
      } catch (closeError) {
        logger.debug("Error stopping server:", closeError);
      }
    }
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
    if (server?.stop && typeof server.stop === "function") {
      try {
        s.start("Stopping server...");
        server.stop();
        s.stop("Server stopped");
      } catch (closeError) {
        s.stop("Error stopping server");
        logger.debug("Error stopping server:", closeError);
      }
    }
  }
}
