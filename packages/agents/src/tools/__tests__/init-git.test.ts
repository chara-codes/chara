import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { initGit } from "../init-git";
import { createTestFS } from "./test-utils";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import fs from "node:fs";
import git from "isomorphic-git";

describe("initGit tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should initialize git repository successfully", async () => {
    const result = await initGit.execute({
      workingDir: testFS.getPath(),
    });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Successfully initialized git repository");
    expect(result.path).toBe(join(testFS.getPath(), ".chara", "history"));

    // Verify git repository was created
    const gitDir = join(testFS.getPath(), ".chara", "history");
    const currentBranch = await git.currentBranch({ fs, dir: gitDir });
    expect(currentBranch).toBe("main");
  });

  test("should skip initialization if git already exists", async () => {
    const gitDir = join(testFS.getPath(), ".chara", "history");

    // First initialization
    const result1 = await initGit.execute({
      workingDir: testFS.getPath(),
    });
    expect(result1.status).toBe("success");

    // Second initialization should be skipped
    const result2 = await initGit.execute({
      workingDir: testFS.getPath(),
    });
    expect(result2.status).toBe("skipped");
    expect(result2.message).toContain("already initialized");
  });

  test("should create .chara/history directory if it doesn't exist", async () => {
    const gitDir = join(testFS.getPath(), ".chara", "history");

    // Directory shouldn't exist initially
    let dirExists = false;
    try {
      await stat(gitDir);
      dirExists = true;
    } catch {
      dirExists = false;
    }
    expect(dirExists).toBe(false);

    // Initialize git
    await initGit.execute({
      workingDir: testFS.getPath(),
    });

    // Directory should now exist
    const stats = await stat(gitDir);
    expect(stats.isDirectory()).toBe(true);
  });

  test("should use current working directory if no workingDir provided", async () => {
    const originalCwd = process.cwd();

    try {
      // Change to test directory
      process.chdir(testFS.getPath());

      const result = await initGit.execute({});

      expect(result.status).toBe("success");
      expect(result.path).toContain(".chara/history");
      expect(result.path.endsWith("/.chara/history")).toBe(true);
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  });

  test("should handle nested directory creation", async () => {
    const result = await initGit.execute({
      workingDir: testFS.getPath(),
    });

    expect(result.status).toBe("success");

    // Verify both .chara and .chara/history were created
    const charaDir = join(testFS.getPath(), ".chara");
    const historyDir = join(testFS.getPath(), ".chara", "history");

    const charaStat = await stat(charaDir);
    const historyStat = await stat(historyDir);

    expect(charaStat.isDirectory()).toBe(true);
    expect(historyStat.isDirectory()).toBe(true);
  });

  test("should have correct tool metadata", () => {
    expect(initGit.description).toContain("Initialize git repository");
    expect(initGit.description).toContain("isomorphic-git");
    expect(initGit.description).toContain(".chara/history");
    expect(initGit.parameters).toBeDefined();
  });

  test("should handle errors gracefully", async () => {
    // Try to initialize in a path that can't be created (like root without permissions)
    await expect(
      initGit.execute({
        workingDir: "/root/cannot-create-this-path",
      }),
    ).rejects.toThrow("Failed to initialize git repository");
  });

  test("should use main as default branch", async () => {
    await initGit.execute({
      workingDir: testFS.getPath(),
    });

    const gitDir = join(testFS.getPath(), ".chara", "history");
    const currentBranch = await git.currentBranch({ fs, dir: gitDir });
    expect(currentBranch).toBe("main");
  });

  test("should handle concurrent initialization attempts", async () => {
    const [result1, result2] = await Promise.all([
      initGit.execute({ workingDir: testFS.getPath() }),
      initGit.execute({ workingDir: testFS.getPath() }),
    ]);

    // One should succeed, one should be skipped (or both succeed if timing allows)
    expect([result1.status, result2.status]).toContain("success");

    // Verify repository is properly initialized
    const gitDir = join(testFS.getPath(), ".chara", "history");
    const currentBranch = await git.currentBranch({ fs, dir: gitDir });
    expect(currentBranch).toBe("main");
  });

  test("should handle deep directory structures", async () => {
    const deepPath = join(testFS.getPath(), "very", "deep", "project", "path");
    await testFS.createDir("very/deep/project/path");

    const result = await initGit.execute({
      workingDir: deepPath,
    });

    expect(result.status).toBe("success");
    expect(result.path).toBe(join(deepPath, ".chara", "history"));

    // Verify git repository was created in the deep path
    const gitDir = join(deepPath, ".chara", "history");
    const currentBranch = await git.currentBranch({ fs, dir: gitDir });
    expect(currentBranch).toBe("main");
  });

  test("should handle special characters in path", async () => {
    const specialPath = join(testFS.getPath(), "special-dir_with.chars");
    await testFS.createDir("special-dir_with.chars");

    const result = await initGit.execute({
      workingDir: specialPath,
    });

    expect(result.status).toBe("success");
    expect(result.path).toBe(join(specialPath, ".chara", "history"));
  });
});
