import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { directoryTree } from "../directory-tree";
import { createTestFS } from "./test-utils";
import { mkdir } from "fs/promises";

describe("directoryTree tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should return JSON tree for simple directory structure", async () => {
    await testFS.createFile("file1.txt", "content1");
    await testFS.createFile("file2.js", "content2");
    await mkdir(testFS.getPath("subdir"));

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(Array.isArray(tree)).toBe(true);
    expect(tree).toHaveLength(3);

    const file1 = tree.find(item => item.name === "file1.txt");
    const file2 = tree.find(item => item.name === "file2.js");
    const subdir = tree.find(item => item.name === "subdir");

    expect(file1).toEqual({ name: "file1.txt", type: "file" });
    expect(file2).toEqual({ name: "file2.js", type: "file" });
    expect(subdir).toEqual({ name: "subdir", type: "directory", children: [] });
  });

  test("should handle empty directory", async () => {
    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(Array.isArray(tree)).toBe(true);
    expect(tree).toHaveLength(0);
  });

  test("should handle nested directory structure", async () => {
    await mkdir(testFS.getPath("level1"));
    await mkdir(testFS.getPath("level1/level2"));
    await testFS.createFile("level1/file1.txt", "content");
    await testFS.createFile("level1/level2/file2.txt", "content");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(1);

    const level1 = tree[0];
    expect(level1.name).toBe("level1");
    expect(level1.type).toBe("directory");
    expect(level1.children).toHaveLength(2);

    const file1 = level1.children.find(item => item.name === "file1.txt");
    const level2 = level1.children.find(item => item.name === "level2");

    expect(file1).toEqual({ name: "file1.txt", type: "file" });
    expect(level2.name).toBe("level2");
    expect(level2.type).toBe("directory");
    expect(level2.children).toHaveLength(1);
    expect(level2.children[0]).toEqual({ name: "file2.txt", type: "file" });
  });

  test("should handle deep nesting", async () => {
    const deepPath = "a/b/c/d/e";
    await mkdir(testFS.getPath(deepPath), { recursive: true });
    await testFS.createFile(`${deepPath}/deep-file.txt`, "content");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    // Navigate through the tree structure
    let current = tree[0]; // 'a'
    expect(current.name).toBe("a");
    expect(current.type).toBe("directory");

    current = current.children[0]; // 'b'
    expect(current.name).toBe("b");
    expect(current.type).toBe("directory");

    current = current.children[0]; // 'c'
    expect(current.name).toBe("c");
    expect(current.type).toBe("directory");

    current = current.children[0]; // 'd'
    expect(current.name).toBe("d");
    expect(current.type).toBe("directory");

    current = current.children[0]; // 'e'
    expect(current.name).toBe("e");
    expect(current.type).toBe("directory");
    expect(current.children[0]).toEqual({ name: "deep-file.txt", type: "file" });
  });

  test("should handle mixed content types", async () => {
    await testFS.createFile("readme.md", "# README");
    await testFS.createFile("package.json", "{}");
    await testFS.createFile("script.sh", "#!/bin/bash");
    await mkdir(testFS.getPath("src"));
    await mkdir(testFS.getPath("docs"));
    await testFS.createFile("src/index.js", "console.log('hello')");
    await testFS.createFile("docs/guide.md", "# Guide");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(5);

    const files = tree.filter(item => item.type === "file");
    const directories = tree.filter(item => item.type === "directory");

    expect(files).toHaveLength(3);
    expect(directories).toHaveLength(2);

    const srcDir = directories.find(dir => dir.name === "src");
    const docsDir = directories.find(dir => dir.name === "docs");

    expect(srcDir.children).toHaveLength(1);
    expect(srcDir.children[0]).toEqual({ name: "index.js", type: "file" });

    expect(docsDir.children).toHaveLength(1);
    expect(docsDir.children[0]).toEqual({ name: "guide.md", type: "file" });
  });

  test("should handle hidden files and directories", async () => {
    await testFS.createFile(".env", "SECRET=value");
    await testFS.createFile(".gitignore", "node_modules/");
    await mkdir(testFS.getPath(".git"));
    await testFS.createFile(".git/config", "[core]");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(3);

    const envFile = tree.find(item => item.name === ".env");
    const gitignoreFile = tree.find(item => item.name === ".gitignore");
    const gitDir = tree.find(item => item.name === ".git");

    expect(envFile).toEqual({ name: ".env", type: "file" });
    expect(gitignoreFile).toEqual({ name: ".gitignore", type: "file" });
    expect(gitDir.name).toBe(".git");
    expect(gitDir.type).toBe("directory");
    expect(gitDir.children).toHaveLength(1);
    expect(gitDir.children[0]).toEqual({ name: "config", type: "file" });
  });

  test("should handle special characters in names", async () => {
    await testFS.createFile("file with spaces.txt", "content");
    await testFS.createFile("file-with-dashes.txt", "content");
    await testFS.createFile("file_with_underscores.txt", "content");
    await testFS.createFile("café.txt", "content");
    await mkdir(testFS.getPath("dir with spaces"));

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(5);

    const names = tree.map(item => item.name);
    expect(names).toContain("file with spaces.txt");
    expect(names).toContain("file-with-dashes.txt");
    expect(names).toContain("file_with_underscores.txt");
    expect(names).toContain("café.txt");
    expect(names).toContain("dir with spaces");
  });

  test("should handle unicode characters", async () => {
    await testFS.createFile("测试.txt", "test content");
    await testFS.createFile("🚀rocket.txt", "rocket content");
    await mkdir(testFS.getPath("München"));
    await testFS.createFile("München/straße.txt", "german content");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    const names = tree.map(item => item.name);
    expect(names).toContain("测试.txt");
    expect(names).toContain("🚀rocket.txt");
    expect(names).toContain("München");

    const munichDir = tree.find(item => item.name === "München");
    expect(munichDir.children[0]).toEqual({ name: "straße.txt", type: "file" });
  });

  test("should throw error for non-existent directory", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist");

    await expect(directoryTree.execute({ path: nonExistentPath }))
      .rejects.toThrow("Failed to build directory tree");
  });

  test("should throw error when trying to get tree of a file", async () => {
    const filePath = await testFS.createFile("not-a-directory.txt", "content");

    await expect(directoryTree.execute({ path: filePath }))
      .rejects.toThrow("Failed to read directory");
  });

  test("should return valid JSON with proper formatting", async () => {
    await testFS.createFile("file.txt", "content");
    await mkdir(testFS.getPath("dir"));

    const result = await directoryTree.execute({ path: testFS.getPath() });

    // Should be valid JSON
    expect(() => JSON.parse(result)).not.toThrow();

    // Should be formatted with 2-space indentation
    expect(result).toContain("  ");
    expect(result.split('\n').length).toBeGreaterThan(1);
  });

  test("should handle large directory structures", async () => {
    // Create many files and directories
    for (let i = 0; i < 20; i++) {
      await testFS.createFile(`file${i}.txt`, `content${i}`);
      await mkdir(testFS.getPath(`dir${i}`));
      await testFS.createFile(`dir${i}/nested${i}.txt`, `nested content ${i}`);
    }

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(40); // 20 files + 20 directories

    const files = tree.filter(item => item.type === "file");
    const directories = tree.filter(item => item.type === "directory");

    expect(files).toHaveLength(20);
    expect(directories).toHaveLength(20);

    // Each directory should have one child
    directories.forEach(dir => {
      expect(dir.children).toHaveLength(1);
      expect(dir.children[0].type).toBe("file");
    });
  });

  test("should handle empty subdirectories", async () => {
    await mkdir(testFS.getPath("empty-dir"));
    await mkdir(testFS.getPath("parent"));
    await mkdir(testFS.getPath("parent/empty-child"));

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    const emptyDir = tree.find(item => item.name === "empty-dir");
    const parentDir = tree.find(item => item.name === "parent");

    expect(emptyDir).toEqual({ name: "empty-dir", type: "directory", children: [] });
    expect(parentDir.children).toHaveLength(1);
    expect(parentDir.children[0]).toEqual({ name: "empty-child", type: "directory", children: [] });
  });

  test("should have correct tool metadata", () => {
    expect(directoryTree.description).toBe("Get a recursive tree view of files and directories as a JSON structure");
    expect(directoryTree.parameters).toBeDefined();
  });

  test("should handle complex nested structure with mixed content", async () => {
    // Create a realistic project structure
    await mkdir(testFS.getPath("src"));
    await mkdir(testFS.getPath("src/components"));
    await mkdir(testFS.getPath("src/utils"));
    await mkdir(testFS.getPath("tests"));
    await mkdir(testFS.getPath("docs"));

    await testFS.createFile("package.json", '{"name": "test"}');
    await testFS.createFile("README.md", "# Test Project");
    await testFS.createFile("src/index.js", "console.log('main')");
    await testFS.createFile("src/components/Button.js", "export default Button");
    await testFS.createFile("src/utils/helpers.js", "export const helper = () => {}");
    await testFS.createFile("tests/index.test.js", "test('works', () => {})");
    await testFS.createFile("docs/api.md", "# API Documentation");

    const result = await directoryTree.execute({ path: testFS.getPath() });
    const tree = JSON.parse(result);

    expect(tree).toHaveLength(5); // 2 files + 3 directories

    const srcDir = tree.find(item => item.name === "src");
    expect(srcDir.children).toHaveLength(3); // index.js + 2 subdirs

    const componentsDir = srcDir.children.find(item => item.name === "components");
    expect(componentsDir.children).toHaveLength(1);
    expect(componentsDir.children[0].name).toBe("Button.js");

    const utilsDir = srcDir.children.find(item => item.name === "utils");
    expect(utilsDir.children).toHaveLength(1);
    expect(utilsDir.children[0].name).toBe("helpers.js");
  });

  test("should handle permission errors gracefully", async () => {
    // Try to access a restricted directory
    const restrictedPath = "/root";

    await expect(directoryTree.execute({ path: restrictedPath }))
      .rejects.toThrow("Failed to build directory tree");
  });
});
