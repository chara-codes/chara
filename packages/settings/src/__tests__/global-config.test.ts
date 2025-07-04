/**
 * Unit tests for global-config utility functions
 *
 * Tests the complete lifecycle of global configuration management including:
 * - Reading/writing configuration files
 * - Updating existing configurations with merging
 * - File existence checks
 * - Error handling for missing files
 * - File removal operations
 *
 * Uses Bun's native test API and mocks the environment utility.
 * Run with: bun test
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { resolve } from "node:path";
import { unlinkSync, mkdirSync, existsSync } from "node:fs";
import {
  getPathToGlobalConfig,
  readGlobalConfig,
  writeGlobalConfig,
  updateGlobalConfig,
  existsGlobalConfig,
  removeGlobalConfig,
} from "../global-config";

// Mock the env utility
const testHomeDir = "/tmp/test-home-bun";
const mockEnv = mock(() => ({
  publicUrl: "http://localhost:3000",
  apiUrl: "http://localhost:3001",
  homeDir: testHomeDir,
}));

mock.module("../env", () => ({
  env: mockEnv,
}));

describe("Global Config Utilities", () => {
  const testConfigFile = ".test-chararc";
  const testConfigPath = resolve(testHomeDir, testConfigFile);

  beforeEach(() => {
    // Ensure test directory exists
    if (!existsSync(testHomeDir)) {
      mkdirSync(testHomeDir, { recursive: true });
    }

    // Clean up any existing test config
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  afterEach(() => {
    // Clean up after each test
    try {
      unlinkSync(testConfigPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  describe("getPathToGlobalConfig", () => {
    test("should return default config path", () => {
      const result = getPathToGlobalConfig();
      expect(result).toBe(resolve(testHomeDir, ".chararc"));
    });

    test("should return custom config path", () => {
      const customFile = ".custom-config";
      const result = getPathToGlobalConfig(customFile);
      expect(result).toBe(resolve(testHomeDir, customFile));
    });
  });

  describe("existsGlobalConfig", () => {
    test("should return false for non-existent config", async () => {
      const exists = await existsGlobalConfig(testConfigFile);
      expect(exists).toBe(false);
    });

    test("should return true for existing config", async () => {
      // Create a test config file
      await writeGlobalConfig({ test: "value" }, testConfigFile);

      const exists = await existsGlobalConfig(testConfigFile);
      expect(exists).toBe(true);
    });
  });

  describe("writeGlobalConfig", () => {
    test("should write config to file", async () => {
      const testConfig = {
        name: "test-project",
        version: "1.0.0",
        settings: {
          debug: true,
          port: 3000,
        },
      };

      await writeGlobalConfig(testConfig, testConfigFile);

      // Verify file was created and has correct content
      const file = Bun.file(testConfigPath);
      expect(await file.exists()).toBe(true);

      const content = await file.json();
      expect(content).toEqual(testConfig);
    });

    test("should write pretty-printed JSON", async () => {
      const testConfig = { name: "test", nested: { value: 123 } };

      await writeGlobalConfig(testConfig, testConfigFile);

      const file = Bun.file(testConfigPath);
      const textContent = await file.text();

      // Should be formatted with proper indentation
      expect(textContent).toContain('{\n  "name"');
      expect(textContent).toContain('  "nested": {\n    "value"');
    });

    test("should overwrite existing config", async () => {
      const originalConfig = { original: true };
      const newConfig = { updated: true };

      await writeGlobalConfig(originalConfig, testConfigFile);
      await writeGlobalConfig(newConfig, testConfigFile);

      const file = Bun.file(testConfigPath);
      const content = await file.json();
      expect(content).toEqual(newConfig);
      expect(content).not.toHaveProperty("original");
    });
  });

  describe("readGlobalConfig", () => {
    test("should read existing config", async () => {
      const testConfig = {
        project: "test-app",
        features: ["auth", "database"],
        config: {
          timeout: 5000,
        },
      };

      await writeGlobalConfig(testConfig, testConfigFile);
      const readResult = await readGlobalConfig(testConfigFile);

      expect(readResult).toEqual(testConfig);
    });

    test("should throw error for non-existent config", async () => {
      try {
        await readGlobalConfig(testConfigFile);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as any).message).toBe(
          `Config file ${testConfigFile} does not exist`,
        );
      }
    });

    test("should handle complex nested objects", async () => {
      const complexConfig = {
        database: {
          host: "localhost",
          port: 5432,
          credentials: {
            username: "admin",
            password: "secret",
          },
        },
        features: ["auth", "logging"],
        metadata: null,
        enabled: true,
      };

      await writeGlobalConfig(complexConfig, testConfigFile);
      const result = await readGlobalConfig(testConfigFile);

      expect(result).toEqual(complexConfig);
    });
  });

  describe("updateGlobalConfig", () => {
    test("should create new config if none exists", async () => {
      const newConfig = { firstTime: true, version: "1.0.0" };

      await updateGlobalConfig(newConfig, testConfigFile);

      const result = await readGlobalConfig(testConfigFile);
      expect(result).toEqual(newConfig);
    });

    test("should merge with existing config", async () => {
      const existingConfig = {
        name: "existing-project",
        version: "1.0.0",
        settings: {
          debug: false,
          port: 3000,
        },
      };

      const updateData = {
        version: "1.1.0",
        settings: {
          debug: true,
          newSetting: "added",
        },
        newField: "new value",
      };

      await writeGlobalConfig(existingConfig, testConfigFile);
      await updateGlobalConfig(updateData, testConfigFile);

      const result = await readGlobalConfig(testConfigFile);

      expect(result).toEqual({
        name: "existing-project", // preserved
        version: "1.1.0", // updated
        settings: {
          debug: true, // updated
          newSetting: "added", // added
        },
        newField: "new value", // added
      });
    });

    test("should handle shallow merging (object replacement)", async () => {
      const existing = {
        level1: {
          existing: "value",
          toUpdate: "old",
        },
      };

      const update = {
        level1: {
          toUpdate: "new",
          added: "value",
        },
      };

      await writeGlobalConfig(existing, testConfigFile);
      await updateGlobalConfig(update, testConfigFile);

      const result = await readGlobalConfig(testConfigFile);
      expect(result.level1).toEqual({
        toUpdate: "new",
        added: "value",
      });
      // Note: With shallow merge, the "existing" key is lost
    });
  });

  describe("removeGlobalConfig", () => {
    test("should remove existing config file", async () => {
      const testConfig = { test: "value" };

      await writeGlobalConfig(testConfig, testConfigFile);
      expect(await existsGlobalConfig(testConfigFile)).toBe(true);

      await removeGlobalConfig(testConfigFile);
      expect(await existsGlobalConfig(testConfigFile)).toBe(false);
    });

    test("should handle removal of non-existent file gracefully", async () => {
      expect(await existsGlobalConfig(testConfigFile)).toBe(false);

      // Should not throw error
      await removeGlobalConfig(testConfigFile);
      expect(await existsGlobalConfig(testConfigFile)).toBe(false);
    });
  });

  describe("integration tests", () => {
    test("should handle complete config lifecycle", async () => {
      const initialConfig = {
        projectName: "test-project",
        version: "1.0.0",
      };

      // Create config
      await writeGlobalConfig(initialConfig, testConfigFile);
      expect(await existsGlobalConfig(testConfigFile)).toBe(true);

      // Read config
      let config = await readGlobalConfig(testConfigFile);
      expect(config).toEqual(initialConfig);

      // Update config
      await updateGlobalConfig(
        { version: "1.1.0", newFeature: true },
        testConfigFile,
      );
      config = await readGlobalConfig(testConfigFile);
      expect(config.version).toBe("1.1.0");
      expect(config.newFeature).toBe(true);
      expect(config.projectName).toBe("test-project"); // preserved

      // Remove config
      await removeGlobalConfig(testConfigFile);
      expect(await existsGlobalConfig(testConfigFile)).toBe(false);
    });

    test("should handle default file parameter across all functions", async () => {
      const defaultConfigPath = resolve(testHomeDir, ".chararc");
      const testConfig = { default: true };

      try {
        // Test default parameter usage
        await writeGlobalConfig(testConfig); // no file parameter
        expect(await existsGlobalConfig()).toBe(true); // no file parameter

        const config = await readGlobalConfig(); // no file parameter
        expect(config).toEqual(testConfig);

        await updateGlobalConfig({ updated: true }); // no file parameter
        const updatedConfig = await readGlobalConfig();
        expect(updatedConfig.default).toBe(true);
        expect(updatedConfig.updated).toBe(true);

        await removeGlobalConfig(); // no file parameter
        expect(await existsGlobalConfig()).toBe(false);
      } finally {
        // Cleanup default config file
        try {
          unlinkSync(defaultConfigPath);
        } catch {
          // Ignore if file doesn't exist
        }
      }
    });
  });
});
