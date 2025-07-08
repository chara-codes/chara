#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the directory of this script
const scriptDir = path.dirname(__filename);
const packageDir = path.dirname(scriptDir);
const packageJsonPath = path.join(packageDir, 'package.json');

function readPackageJson() {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

function writePackageJson(packageJson) {
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  } catch (error) {
    console.error('Error writing package.json:', error.message);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packageJson = readPackageJson();
  return packageJson.version;
}

function bumpVersion(versionType) {
  const validTypes = ['patch', 'minor', 'major'];
  if (!validTypes.includes(versionType)) {
    console.error(`Invalid version type: ${versionType}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}`);

  try {
    // Use npm version to bump the version
    const result = execSync(`npm version ${versionType} --no-git-tag-version`, {
      cwd: packageDir,
      encoding: 'utf8'
    });

    const newVersion = result.trim().replace('v', '');
    console.log(`New version: ${newVersion}`);

    return newVersion;
  } catch (error) {
    console.error('Error bumping version:', error.message);
    process.exit(1);
  }
}

function setVersion(version) {
  const packageJson = readPackageJson();
  const currentVersion = packageJson.version;

  console.log(`Current version: ${currentVersion}`);
  console.log(`Setting version to: ${version}`);

  packageJson.version = version;
  writePackageJson(packageJson);

  return version;
}

function showHelp() {
  console.log(`
Chara CLI Version Bump Script

Usage:
  node bump-version.js <command> [options]

Commands:
  patch           Bump patch version (x.x.X)
  minor           Bump minor version (x.X.x)
  major           Bump major version (X.x.x)
  set <version>   Set specific version
  current         Show current version
  help            Show this help message

Examples:
  node bump-version.js patch      # 1.0.0 → 1.0.1
  node bump-version.js minor      # 1.0.0 → 1.1.0
  node bump-version.js major      # 1.0.0 → 2.0.0
  node bump-version.js set 1.2.3  # Set to 1.2.3
  node bump-version.js current    # Show current version
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case 'patch':
    case 'minor':
    case 'major':
      bumpVersion(command);
      break;

    case 'set':
      if (args.length < 2) {
        console.error('Error: Version required for set command');
        console.error('Usage: node bump-version.js set <version>');
        process.exit(1);
      }
      setVersion(args[1]);
      break;

    case 'current':
      console.log(getCurrentVersion());
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  bumpVersion,
  setVersion
};
