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

interface Model {
  id: string;
  name: string;
  provider: string;
  recommended?: boolean;
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

  // Check if serverUrl is provided, otherwise throw error
  if (!options.serverUrl) {
    throw new Error(
      "Server URL is required. Please start the server first or provide a serverUrl.",
    );
  }

  const serverUrl = options.serverUrl;

  // Fetch models from API
  const s = spinner();
  s.start("Fetching available models...");

  let models: Model[] = [];
  try {
    const modelsUrl = `${serverUrl}/api/models`;
    logger.debug(`Fetching models from: ${modelsUrl}`);
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
    throw error;
  }

  if (models.length === 0) {
    logger.info(
      "No models available. Please check your provider configuration.",
    );
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
    return;
  }

  // Confirm selection
  const shouldSave = await confirm({
    message: `Set "${selectedModel}" as your default model?`,
    initialValue: true,
  });

  if (isCancel(shouldSave) || !shouldSave) {
    cancel("Default model not saved.");
    return;
  }

  // Save to config
  const saveSpinner = spinner();
  saveSpinner.start("Saving default model...");

  try {
    const updatedConfig = {
      ...config,
      defaultModel: selectedModel,
    };

    await updateGlobalConfig(updatedConfig);
    saveSpinner.stop("Default model saved successfully!");

    outro(
      `${bold(green("✅ Default model set!"))}

Your default model has been set to: ${bold(cyan(selectedModel))}

This model will be used by default in Chara Codes unless overridden by project-specific settings.`,
    );
  } catch (error) {
    saveSpinner.stop("Failed to save default model");
    logger.error("Error saving default model:", error);
    throw error;
  }
}
