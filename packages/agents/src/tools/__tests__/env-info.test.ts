import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { envInfo } from "../env-info";

describe("envInfo tool", () => {
  const testDir = "/tmp/test-env-info";
  const charaConfigPath = join(testDir, ".chara.json");

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      require("node:fs").mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(charaConfigPath)) {
      unlinkSync(charaConfigPath);
    }
  });

  test("should return environment info with system and project data", async () => {
    // Create a test .chara.json file
    const testConfig = {
      dev: "npm run dev",
      info: {
        name: "test-project",
        description: "A test project",
        version: "1.0.0",
        frameworks: ["react", "typescript"],
        tools: ["vite", "eslint"],
        stack: ["frontend"],
        packageManager: "npm",
        scripts: {
          dev: "vite",
          build: "vite build",
        },
        dependencies: ["react", "react-dom"],
        devDependencies: ["typescript", "@types/react"],
        languages: ["typescript", "javascript"],
        projectType: "web",
      },
    };

    writeFileSync(charaConfigPath, JSON.stringify(testConfig, null, 2));

    const result = await envInfo.execute({
      workingDir: testDir,
      includeSystem: true,
      includeProject: true,
    });

    // Check basic structure
    expect(result).toBeDefined();
    expect(result.workingDirectory).toBe(testDir);
    expect(result.timestamp).toBeDefined();

    // Check project information
    expect(result.project).toBeDefined();
    expect(result.project.hasCharaConfig).toBe(true);
    expect(result.project.dev).toBe("npm run dev");
    expect(result.project.info).toEqual(testConfig.info);
    expect(result.project.files).toBeDefined();

    // Check system information
    expect(result.system).toBeDefined();
    expect(result.system.platform).toBeDefined();
    expect(result.system.architecture).toBeDefined();
    expect(result.system.nodeVersion).toBeDefined();
    expect(result.system.cpu).toBeDefined();
    expect(result.system.memory).toBeDefined();

    // Check runtime information
    expect(result.runtime).toBeDefined();
    expect(typeof result.runtime.isBun).toBe("boolean");
    expect(typeof result.runtime.isNode).toBe("boolean");
    expect(result.runtime.nodeVersion).toBeDefined();
    expect(result.runtime.processId).toBeDefined();

    // Check environment variables
    expect(result.environment).toBeDefined();
  });

  test("should handle missing .chara.json file", async () => {
    const result = await envInfo.execute({
      workingDir: testDir,
      includeSystem: false,
      includeProject: true,
    });

    expect(result.project).toBeDefined();
    expect(result.project.hasCharaConfig).toBe(false);
    expect(result.project.message).toContain(".chara.json file not found");
    expect(result.system).toBeUndefined();
  });

  test("should handle invalid .chara.json file", async () => {
    // Create invalid JSON file
    writeFileSync(charaConfigPath, "invalid json content");

    const result = await envInfo.execute({
      workingDir: testDir,
      includeProject: true,
      includeSystem: false,
    });

    expect(result.project).toBeDefined();
    expect(result.project.hasCharaConfig).toBe(false);
    expect(result.project.error).toContain("Failed to read .chara.json");
  });

  test("should work with includeSystem=false", async () => {
    const result = await envInfo.execute({
      workingDir: testDir,
      includeSystem: false,
      includeProject: true,
    });

    expect(result.system).toBeUndefined();
    expect(result.runtime).toBeUndefined();
    expect(result.environment).toBeUndefined();
    expect(result.project).toBeDefined();
  });

  test("should work with includeProject=false", async () => {
    const result = await envInfo.execute({
      workingDir: testDir,
      includeProject: false,
      includeSystem: true,
    });

    expect(result.project).toBeUndefined();
    expect(result.system).toBeDefined();
    expect(result.runtime).toBeDefined();
    expect(result.environment).toBeDefined();
  });

  test("should use current directory as default", async () => {
    const result = await envInfo.execute({});

    expect(result.workingDirectory).toBe(process.cwd());
  });

  test("should have correct tool metadata", () => {
    expect(envInfo.description).toContain(
      "comprehensive environment information",
    );
    expect(envInfo.parameters).toBeDefined();
  });

  test("should detect common project files", async () => {
    // Create some common project files
    const packageJsonPath = join(testDir, "package.json");
    const readmePath = join(testDir, "README.md");
    const gitignorePath = join(testDir, ".gitignore");

    writeFileSync(packageJsonPath, "{}");
    writeFileSync(readmePath, "# Test Project");
    writeFileSync(gitignorePath, "node_modules/");

    const result = await envInfo.execute({
      workingDir: testDir,
      includeProject: true,
      includeSystem: false,
    });

    expect(result.project.files.packageJson).toBe(true);
    expect(result.project.files.readme).toBe(true);
    expect(result.project.files.gitignore).toBe(true);
    expect(result.project.files.tsconfig).toBe(false);

    // Clean up
    unlinkSync(packageJsonPath);
    unlinkSync(readmePath);
    unlinkSync(gitignorePath);
  });

  test("should format memory in GB", async () => {
    const result = await envInfo.execute({
      includeSystem: true,
      includeProject: false,
    });

    expect(result.system.memory.total).toBeGreaterThan(0);
    expect(result.system.memory.free).toBeGreaterThan(0);
    expect(result.system.memory.used).toBeGreaterThan(0);
    expect(typeof result.system.memory.total).toBe("number");
  });

  test("should include safe environment variables only", async () => {
    const result = await envInfo.execute({
      includeSystem: true,
      includeProject: false,
    });

    const envKeys = Object.keys(result.environment);
    const unsafeKeys = ["API_KEY", "SECRET", "PASSWORD", "TOKEN"];

    // Check that no unsafe keys are included
    unsafeKeys.forEach((key) => {
      expect(envKeys).not.toContain(key);
    });

    // Check that some safe keys might be included (if they exist)
    const safeKeys = ["NODE_ENV", "PATH", "HOME"];
    safeKeys.forEach((key) => {
      if (process.env[key]) {
        expect(result.environment[key]).toBe(process.env[key]);
      }
    });
  });
});
