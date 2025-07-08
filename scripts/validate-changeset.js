#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Validates that appropriate changesets exist for CLI changes
 * Run this script before pushing changes to ensure proper versioning
 */

const CHANGESET_DIR = '.changeset';
const CLI_PACKAGE_PATH = 'packages/cli';
const CLI_PACKAGE_NAME = 'chara';

function main() {
  console.log('🔍 Validating changeset requirements...');

  try {
    // Check if we're in a git repository
    const hasGitChanges = checkForGitChanges();

    if (!hasGitChanges) {
      console.log('✅ No git changes detected, skipping changeset validation');
      return;
    }

    // Check if CLI package has changes
    const hasCliChanges = checkForCliChanges();

    if (!hasCliChanges) {
      console.log('✅ No CLI changes detected, no changeset required');
      return;
    }

    // Check if changeset exists
    const hasChangeset = checkForChangeset();

    if (!hasChangeset) {
      console.error('❌ CLI changes detected but no changeset found!');
      console.error('');
      console.error('Please create a changeset by running:');
      console.error('  bun run changeset');
      console.error('');
      console.error('Then select the "chara" package and describe your changes.');
      process.exit(1);
    }

    console.log('✅ Changeset validation passed');

  } catch (error) {
    console.error('❌ Error during changeset validation:', error.message);
    process.exit(1);
  }
}

function checkForGitChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    // If git command fails, assume we're not in a git repo
    return false;
  }
}

function checkForCliChanges() {
  try {
    // Check for staged changes in CLI package
    const stagedChanges = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const unstagedChanges = execSync('git diff --name-only', { encoding: 'utf8' });

    const allChanges = (stagedChanges + unstagedChanges).split('\n').filter(Boolean);

    // Check if any changes are in the CLI package
    return allChanges.some(file =>
      file.startsWith(CLI_PACKAGE_PATH) &&
      !file.includes('node_modules') &&
      !file.includes('.turbo')
    );
  } catch (error) {
    // If git commands fail, assume there are changes to be safe
    return true;
  }
}

function checkForChangeset() {
  try {
    // Check if changeset directory exists
    if (!existsSync(CHANGESET_DIR)) {
      return false;
    }

    // Get all changeset files
    const changesetFiles = execSync(`find ${CHANGESET_DIR} -name "*.md" -not -name "README.md"`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);

    // Check if any changeset mentions the CLI package
    return changesetFiles.some(file => {
      try {
        const content = readFileSync(file, 'utf8');
        return content.includes(`"${CLI_PACKAGE_NAME}"`);
      } catch (error) {
        return false;
      }
    });
  } catch (error) {
    return false;
  }
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getCliVersion() {
  try {
    const packageJsonPath = join(CLI_PACKAGE_PATH, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as validateChangeset };
