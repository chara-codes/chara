#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Auto release helper script
 * Provides utilities for managing releases with auto
 */

const CLI_PACKAGE_PATH = "packages/cli";

function main() {
  const command = process.argv[2];

  switch (command) {
    case "check":
      checkReleaseStatus();
      break;
    case "labels":
      setupLabels();
      break;
    case "dry-run":
      dryRun();
      break;
    case "canary":
      canaryRelease();
      break;
    case "next":
      nextRelease();
      break;
    case "shipit":
      shipit();
      break;
    default:
      printHelp();
  }
}

function checkReleaseStatus() {
  console.log("🔍 Checking release status...");

  try {
    const currentBranch = getCurrentBranch();
    const cliVersion = getCliVersion();

    console.log(`Current branch: ${currentBranch}`);
    console.log(`CLI version: ${cliVersion}`);

    // Check if there are any PRs ready for release
    execSync("npx auto version", { stdio: "inherit", cwd: CLI_PACKAGE_PATH });
  } catch (error) {
    console.error("❌ Error checking release status:", error.message);
    process.exit(1);
  }
}

function setupLabels() {
  console.log("🏷️  Setting up GitHub labels...");

  try {
    execSync("npx auto create-labels", {
      stdio: "inherit",
      cwd: CLI_PACKAGE_PATH,
    });
    console.log("✅ Labels setup complete");
  } catch (error) {
    console.error("❌ Error setting up labels:", error.message);
    process.exit(1);
  }
}

function dryRun() {
  console.log("🧪 Running dry-run release...");

  try {
    execSync("npx auto shipit --dry-run", {
      stdio: "inherit",
      cwd: CLI_PACKAGE_PATH,
    });
  } catch (error) {
    console.error("❌ Dry run failed:", error.message);
    process.exit(1);
  }
}

function canaryRelease() {
  console.log("🐤 Creating canary release...");

  try {
    const currentBranch = getCurrentBranch();

    if (currentBranch === "main") {
      console.error("❌ Cannot create canary release from main branch");
      process.exit(1);
    }

    execSync("npx auto canary --force", {
      stdio: "inherit",
      cwd: CLI_PACKAGE_PATH,
    });
    console.log("✅ Canary release created");
  } catch (error) {
    console.error("❌ Canary release failed:", error.message);
    process.exit(1);
  }
}

function nextRelease() {
  console.log("⏭️  Creating next release...");

  try {
    execSync("npx auto next", { stdio: "inherit", cwd: CLI_PACKAGE_PATH });
    console.log("✅ Next release created");
  } catch (error) {
    console.error("❌ Next release failed:", error.message);
    process.exit(1);
  }
}

function shipit() {
  console.log("🚀 Shipping release...");

  try {
    const currentBranch = getCurrentBranch();

    if (currentBranch !== "main") {
      console.error("❌ Can only ship releases from main branch");
      process.exit(1);
    }

    execSync("npx auto shipit", { stdio: "inherit", cwd: CLI_PACKAGE_PATH });
    console.log("✅ Release shipped successfully");
  } catch (error) {
    console.error("❌ Release failed:", error.message);
    process.exit(1);
  }
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

function getCliVersion() {
  try {
    const packageJsonPath = join(CLI_PACKAGE_PATH, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
  } catch {
    return "unknown";
  }
}

function printHelp() {
  console.log(`
Auto Release Helper

Usage: node scripts/auto-release.js <command>

Commands:
  check     Check current release status
  labels    Setup GitHub labels for auto
  dry-run   Run a dry-run release
  canary    Create a canary release (for feature branches)
  next      Create a next release
  shipit    Ship a production release (main branch only)

Examples:
  node scripts/auto-release.js check
  node scripts/auto-release.js labels
  node scripts/auto-release.js dry-run
  node scripts/auto-release.js canary
  node scripts/auto-release.js shipit
  `);
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as autoRelease };
