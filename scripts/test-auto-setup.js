#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Comprehensive test script for auto setup
 * Validates the entire auto configuration and setup
 */

const CLI_PACKAGE_PATH = "packages/cli";
const CONFIG_FILES = [".autorc", "packages/cli/.autorc"];
const REQUIRED_SCRIPTS = [
  "release",
  "release:check",
  "release:canary",
  "release:next",
  "release:dry-run",
  "release:labels",
  "validate:auto"
];

function main() {
  console.log("🧪 Testing auto setup...\n");

  let hasErrors = false;

  // Test 1: Check configuration files exist and are valid
  console.log("1️⃣ Testing configuration files...");
  if (!testConfigFiles()) {
    hasErrors = true;
  }

  // Test 2: Check package.json scripts
  console.log("\n2️⃣ Testing package.json scripts...");
  if (!testPackageScripts()) {
    hasErrors = true;
  }

  // Test 3: Check dependencies
  console.log("\n3️⃣ Testing dependencies...");
  if (!testDependencies()) {
    hasErrors = true;
  }

  // Test 4: Check auto CLI availability
  console.log("\n4️⃣ Testing auto CLI...");
  if (!testAutoCLI()) {
    hasErrors = true;
  }

  // Test 5: Check helper scripts
  console.log("\n5️⃣ Testing helper scripts...");
  if (!testHelperScripts()) {
    hasErrors = true;
  }

  // Test 6: Check GitHub workflow
  console.log("\n6️⃣ Testing GitHub workflow...");
  if (!testGitHubWorkflow()) {
    hasErrors = true;
  }

  // Test 7: Check documentation
  console.log("\n7️⃣ Testing documentation...");
  if (!testDocumentation()) {
    hasErrors = true;
  }

  console.log("\n" + "=".repeat(50));
  if (hasErrors) {
    console.error("❌ Auto setup test failed!");
    console.error("Please fix the issues above before proceeding.");
    process.exit(1);
  } else {
    console.log("✅ Auto setup test passed!");
    console.log("The auto configuration is ready for production use.");
  }
}

function testConfigFiles() {
  let success = true;

  for (const configFile of CONFIG_FILES) {
    if (!existsSync(configFile)) {
      console.error(`❌ Configuration file not found: ${configFile}`);
      success = false;
      continue;
    }

    try {
      const config = JSON.parse(readFileSync(configFile, "utf8"));

      // Check required fields
      const requiredFields = ["plugins", "owner", "repo", "labels", "baseBranch"];
      for (const field of requiredFields) {
        if (!config[field]) {
          console.error(`❌ Missing required field '${field}' in ${configFile}`);
          success = false;
        }
      }

      // Check plugins
      if (!config.plugins.includes("npm")) {
        console.error(`❌ Missing 'npm' plugin in ${configFile}`);
        success = false;
      }

      // Check labels format
      if (!Array.isArray(config.labels)) {
        console.error(`❌ Labels should be an array in ${configFile}`);
        success = false;
      }

      console.log(`✅ ${configFile} is valid`);
    } catch (error) {
      console.error(`❌ Failed to parse ${configFile}: ${error.message}`);
      success = false;
    }
  }

  return success;
}

function testPackageScripts() {
  let success = true;

  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    for (const script of REQUIRED_SCRIPTS) {
      if (!packageJson.scripts[script]) {
        console.error(`❌ Missing script '${script}' in package.json`);
        success = false;
      } else {
        console.log(`✅ Script '${script}' found`);
      }
    }

    // Check for removed changeset scripts
    const removedScripts = ["changeset", "changeset:version", "changeset:publish"];
    for (const script of removedScripts) {
      if (packageJson.scripts[script]) {
        console.error(`❌ Old changeset script '${script}' still exists`);
        success = false;
      }
    }

  } catch (error) {
    console.error(`❌ Failed to read package.json: ${error.message}`);
    success = false;
  }

  return success;
}

function testDependencies() {
  let success = true;

  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    const requiredDeps = [
      "@auto-it/core",
      "@auto-it/npm",
      "@auto-it/released",
      "@auto-it/first-time-contributor",
      "@auto-it/all-contributors"
    ];

    for (const dep of requiredDeps) {
      if (!packageJson.devDependencies[dep]) {
        console.error(`❌ Missing dependency '${dep}'`);
        success = false;
      } else {
        console.log(`✅ Dependency '${dep}' found`);
      }
    }

    // Check for removed changeset dependencies
    const removedDeps = ["@changesets/cli", "@changesets/changelog-github"];
    for (const dep of removedDeps) {
      if (packageJson.devDependencies[dep] || packageJson.dependencies[dep]) {
        console.error(`❌ Old changeset dependency '${dep}' still exists`);
        success = false;
      }
    }

  } catch (error) {
    console.error(`❌ Failed to check dependencies: ${error.message}`);
    success = false;
  }

  return success;
}

function testAutoCLI() {
  let success = true;

  try {
    // Test auto CLI is available
    execSync("npx auto --version", {
      stdio: "pipe",
      cwd: CLI_PACKAGE_PATH
    });
    console.log("✅ Auto CLI is available");

    // Test auto can read config without errors
    try {
      execSync("npx auto --help", {
        stdio: "pipe",
        cwd: CLI_PACKAGE_PATH
      });
      console.log("✅ Auto CLI can read configuration");
    } catch (error) {
      console.error("❌ Auto CLI configuration error:", error.message);
      success = false;
    }

  } catch (error) {
    console.error("❌ Auto CLI not available:", error.message);
    success = false;
  }

  return success;
}

function testHelperScripts() {
  let success = true;

  const helperScripts = [
    "scripts/auto-release.js",
    "scripts/validate-auto-config.js",
    "scripts/test-auto-setup.js"
  ];

  for (const script of helperScripts) {
    if (!existsSync(script)) {
      console.error(`❌ Helper script not found: ${script}`);
      success = false;
    } else {
      console.log(`✅ Helper script found: ${script}`);
    }
  }

  // Test validation script
  try {
    execSync("node scripts/validate-auto-config.js", { stdio: "pipe" });
    console.log("✅ Auto config validation script works");
  } catch (error) {
    console.error("❌ Auto config validation script failed");
    success = false;
  }

  return success;
}

function testGitHubWorkflow() {
  let success = true;

  const workflowFile = ".github/workflows/publish.yml";

  if (!existsSync(workflowFile)) {
    console.error(`❌ GitHub workflow not found: ${workflowFile}`);
    return false;
  }

  try {
    const workflow = readFileSync(workflowFile, "utf8");

    // Check for auto commands
    if (!workflow.includes("npx auto shipit")) {
      console.error("❌ Missing 'npx auto shipit' in workflow");
      success = false;
    }

    if (!workflow.includes("npx auto canary")) {
      console.error("❌ Missing 'npx auto canary' in workflow");
      success = false;
    }

    // Check for removed changeset references
    if (workflow.includes("changesets/action")) {
      console.error("❌ Old changeset action still in workflow");
      success = false;
    }

    if (workflow.includes("changeset:publish")) {
      console.error("❌ Old changeset:publish still in workflow");
      success = false;
    }

    console.log("✅ GitHub workflow updated for auto");

  } catch (error) {
    console.error(`❌ Failed to read workflow: ${error.message}`);
    success = false;
  }

  return success;
}

function testDocumentation() {
  let success = true;

  const docFiles = [
    "docs/RELEASES.md",
    "docs/MIGRATION_TO_AUTO.md",
    "docs/MIGRATION_SUMMARY.md"
  ];

  for (const docFile of docFiles) {
    if (!existsSync(docFile)) {
      console.error(`❌ Documentation file not found: ${docFile}`);
      success = false;
    } else {
      console.log(`✅ Documentation file found: ${docFile}`);
    }
  }

  // Check README for auto references
  if (existsSync("README.md")) {
    const readme = readFileSync("README.md", "utf8");
    if (readme.includes("Release Management")) {
      console.log("✅ README updated with release management info");
    } else {
      console.error("❌ README missing release management section");
      success = false;
    }
  }

  return success;
}

function getCurrentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as testAutoSetup };
