#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";

/**
 * Validates auto configuration files
 */

const CONFIG_FILES = [".autorc", "packages/cli/.autorc"];

const REQUIRED_FIELDS = ["plugins", "owner", "repo", "labels", "baseBranch"];

const REQUIRED_LABEL_FIELDS = ["name", "description", "releaseType"];

const VALID_RELEASE_TYPES = ["major", "minor", "patch", "skip"];

function main() {
  console.log("🔍 Validating auto configuration...");

  let hasErrors = false;

  for (const configFile of CONFIG_FILES) {
    console.log(`\n📁 Checking ${configFile}...`);

    if (!existsSync(configFile)) {
      console.error(`❌ Configuration file not found: ${configFile}`);
      hasErrors = true;
      continue;
    }

    try {
      const config = JSON.parse(readFileSync(configFile, "utf8"));
      const errors = validateConfig(config, configFile);

      if (errors.length > 0) {
        hasErrors = true;
        errors.forEach((error) => console.error(`❌ ${error}`));
      } else {
        console.log("✅ Configuration is valid");
      }
    } catch (error) {
      console.error(`❌ Failed to parse ${configFile}: ${error.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\n❌ Configuration validation failed");
    process.exit(1);
  } else {
    console.log("\n✅ All configurations are valid");
  }
}

function validateConfig(config, filePath) {
  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field} in ${filePath}`);
    }
  }

  // Validate plugins
  if (config.plugins) {
    if (!Array.isArray(config.plugins)) {
      errors.push(`plugins must be an array in ${filePath}`);
    } else {
      const requiredPlugins = ["npm", "released"];
      for (const plugin of requiredPlugins) {
        if (!config.plugins.includes(plugin)) {
          errors.push(`Missing required plugin: ${plugin} in ${filePath}`);
        }
      }
    }
  }

  // Validate labels
  if (config.labels) {
    if (!Array.isArray(config.labels)) {
      errors.push(`labels must be an array in ${filePath}`);
    } else {
      config.labels.forEach((label, index) => {
        // Check required label fields
        for (const field of REQUIRED_LABEL_FIELDS) {
          if (!label[field]) {
            errors.push(
              `Label ${index} missing required field: ${field} in ${filePath}`
            );
          }
        }

        // Validate release type
        if (
          label.releaseType &&
          !VALID_RELEASE_TYPES.includes(label.releaseType)
        ) {
          errors.push(
            `Invalid releaseType "${label.releaseType}" for label "${
              label.name
            }" in ${filePath}. Must be one of: ${VALID_RELEASE_TYPES.join(
              ", "
            )}`
          );
        }
      });

      // Check for required labels
      const requiredLabels = ["major", "minor", "patch"];
      const releaseTypes = config.labels.map((l) => l.releaseType);

      for (const type of requiredLabels) {
        if (!releaseTypes.includes(type)) {
          errors.push(
            `Missing label with releaseType "${type}" in ${filePath}`
          );
        }
      }
    }
  }

  // Validate owner/repo format
  if (config.owner && typeof config.owner !== "string") {
    errors.push(`owner must be a string in ${filePath}`);
  }

  if (config.repo && typeof config.repo !== "string") {
    errors.push(`repo must be a string in ${filePath}`);
  }

  // Validate baseBranch
  if (config.baseBranch && typeof config.baseBranch !== "string") {
    errors.push(`baseBranch must be a string in ${filePath}`);
  }

  // Validate prereleaseBranches
  if (config.prereleaseBranches) {
    if (!Array.isArray(config.prereleaseBranches)) {
      errors.push(`prereleaseBranches must be an array in ${filePath}`);
    }
  }

  return errors;
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as validateAutoConfig };
