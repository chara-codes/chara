import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { directory } from "../directory";

// Mock filesystem data structure
interface MockFileSystemNode {
  type: "file" | "directory";
  content?: string;
  size?: number;
  children?: Map<string, MockFileSystemNode>;
}

class MockFileSystem {
  private fs: Map<string, MockFileSystemNode> = new Map();
  private cwd: string = "/test-dir";

  constructor() {
    this.reset();
  }

  reset(): void {
    this.fs.clear();
    // Create root directory
    this.fs.set("/", {
      type: "directory",
      children: new Map(),
    });
    // Create mock current working directory
    this.createDir("/test-dir");
  }

  private normalizePath(path: string): string {
    if (path.startsWith("/")) return path;
    return `${this.cwd}/${path}`.replace(/\/+/g, "/");
  }

  private getParentPath(path: string): string {
    const parts = path.split("/").filter(Boolean);
    if (parts.length <= 1) return "/";
    return "/" + parts.slice(0, -1).join("/");
  }

  private getFileName(path: string): string {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  createFile(path: string, content: string = ""): void {
    const normalizedPath = this.normalizePath(path);
    const parentPath = this.getParentPath(normalizedPath);
    const fileName = this.getFileName(normalizedPath);

    // Ensure parent directory exists
    this.createDir(parentPath);

    const parent = this.fs.get(parentPath);
    if (!parent || parent.type !== "directory" || !parent.children) {
      throw new Error(`Parent directory does not exist: ${parentPath}`);
    }

    parent.children.set(fileName, {
      type: "file",
      content,
      size: content.length,
    });
  }

  createDir(path: string): void {
    const normalizedPath = this.normalizePath(path);

    if (this.fs.has(normalizedPath)) return;

    const parentPath = this.getParentPath(normalizedPath);
    const dirName = this.getFileName(normalizedPath);

    // Recursively create parent directories
    if (parentPath !== "/" && !this.fs.has(parentPath)) {
      this.createDir(parentPath);
    }

    const parent = this.fs.get(parentPath);
    if (!parent || parent.type !== "directory" || !parent.children) {
      throw new Error(`Parent directory does not exist: ${parentPath}`);
    }

    const newDir: MockFileSystemNode = {
      type: "directory",
      children: new Map(),
    };

    parent.children.set(dirName, newDir);
    this.fs.set(normalizedPath, newDir);
  }

  findInTree(path: string): MockFileSystemNode | null {
    const normalizedPath = this.normalizePath(path);
    const parts = normalizedPath.split("/").filter(Boolean);
    let current = this.fs.get("/");

    if (!current) return null;

    for (const part of parts) {
      if (!current.children || !current.children.has(part)) {
        return null;
      }
      current = current.children.get(part)!;
    }

    return current;
  }

  stat(path: string): {
    isDirectory: () => boolean;
    isFile: () => boolean;
    size: number;
  } {
    const node = this.findInTree(path);

    if (!node) {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }

    return {
      isDirectory: () => node.type === "directory",
      isFile: () => node.type === "file",
      size: node.size || 0,
    };
  }

  readdir(path: string): Array<{
    name: string;
    isDirectory: () => boolean;
    isFile: () => boolean;
  }> {
    const node = this.findInTree(path);

    if (!node) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }

    if (node.type !== "directory" || !node.children) {
      throw new Error(`ENOTDIR: not a directory, scandir '${path}'`);
    }

    return Array.from(node.children.entries()).map(([name, childNode]) => ({
      name,
      isDirectory: () => childNode.type === "directory",
      isFile: () => childNode.type === "file",
    }));
  }

  getTestPath(): string {
    return this.cwd;
  }

  // Generate ignore-walk compatible file list
  getIgnoreWalkFiles(respectGitignore: boolean = true): string[] {
    const allFiles: string[] = [];

    const collectFiles = (
      node: MockFileSystemNode,
      currentPath: string = ""
    ) => {
      if (!node.children) return;

      for (const [name, childNode] of node.children) {
        const relPath = currentPath ? `${currentPath}/${name}` : name;

        // Skip common ignored directories and files
        if (respectGitignore && this.shouldIgnoreFile(relPath)) {
          continue;
        }

        allFiles.push(relPath);

        if (childNode.type === "directory") {
          collectFiles(childNode, relPath);
        }
      }
    };

    const rootNode = this.findInTree(this.cwd);
    if (rootNode) {
      collectFiles(rootNode);
    }

    return allFiles;
  }

  private shouldIgnoreFile(path: string): boolean {
    const ignoredPatterns = [
      "node_modules",
      ".git",
      ".chara",
      "dist",
      "build",
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
    ];

    // Check if any part of the path matches ignored patterns
    const parts = path.split("/");
    return parts.some((part) => ignoredPatterns.includes(part));
  }
}

// Global mock filesystem instance
const mockFS = new MockFileSystem();

describe("directory tool", () => {
  let readdirSpy: any;
  let statSpy: any;
  let ignoreWalkSpy: any;

  beforeEach(async () => {
    mockFS.reset();

    // Import the modules to spy on
    const fsPromises = await import("fs/promises");
    const ignoreWalk = await import("ignore-walk");

    // Setup filesystem spies
    readdirSpy = spyOn(fsPromises, "readdir").mockImplementation(
      (path: string, options?: any) => {
        const entries = mockFS.readdir(path);
        return Promise.resolve(entries);
      }
    );

    statSpy = spyOn(fsPromises, "stat").mockImplementation((path: string) => {
      const stats = mockFS.stat(path);
      return Promise.resolve(stats);
    });

    // Setup ignore-walk spy
    ignoreWalkSpy = spyOn(ignoreWalk, "default").mockImplementation(
      ({ path }: { path: string }) => {
        const files = mockFS.getIgnoreWalkFiles(true);
        return Promise.resolve(files);
      }
    );

    // Mock process.cwd to return our test directory
    spyOn(process, "cwd").mockReturnValue(mockFS.getTestPath());
  });

  afterEach(() => {
    // Restore all spies
    readdirSpy?.mockRestore();
    statSpy?.mockRestore();
    ignoreWalkSpy?.mockRestore();
  });

  describe("list operation", () => {
    test("should list files and directories", async () => {
      // Setup mock filesystem
      mockFS.createFile("file1.txt", "content1");
      mockFS.createFile("file2.js", "console.log('hello');");
      mockFS.createDir("subdir");
      mockFS.createFile("subdir/nested.txt", "nested content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeHidden: false,
        includeSize: false,
        respectGitignore: false,
      });

      expect(result).toMatchObject({
        operation: "list",
        path: mockFS.getTestPath(),
        count: 3,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(3);
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual(["file1.txt", "file2.js", "subdir"]);
      }
    });

    test("should handle empty directory", async () => {
      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      expect(result).toMatchObject({
        operation: "list",
        count: 0,
        formatted: "Directory is empty",
      });
    });

    test("should include hidden files when requested", async () => {
      mockFS.createFile(".hidden", "hidden content");
      mockFS.createFile("visible.txt", "visible content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeHidden: true,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(2);
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual([".hidden", "visible.txt"]);
      }
    });

    test("should exclude hidden files by default", async () => {
      mockFS.createFile(".hidden", "hidden content");
      mockFS.createFile("visible.txt", "visible content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeHidden: false,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe("visible.txt");
      }
    });

    test("should include file sizes when requested", async () => {
      mockFS.createFile("small.txt", "hi");
      mockFS.createFile("large.txt", "this is a longer content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeSize: true,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(2);
        const smallFile = result.items.find(
          (item) => item.name === "small.txt"
        );
        const largeFile = result.items.find(
          (item) => item.name === "large.txt"
        );

        expect(smallFile?.size).toBe(2);
        expect(largeFile?.size).toBe(24);
      }
    });

    test("should skip .chara directories", async () => {
      mockFS.createDir(".chara");
      mockFS.createFile(".chara/config.json", "{}");
      mockFS.createFile("normal.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeHidden: true,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe("normal.txt");
      }
    });

    test("should respect .gitignore patterns", async () => {
      mockFS.createFile(".gitignore", "*.log\ntemp/");
      mockFS.createFile("app.js", "code");
      mockFS.createFile("debug.log", "logs");
      mockFS.createDir("temp");

      // Mock ignore-walk to return only non-ignored files
      ignoreWalkSpy.mockImplementationOnce(() => {
        return Promise.resolve([".gitignore", "app.js"]);
      });

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        respectGitignore: true,
      });

      if ("items" in result) {
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual([".gitignore", "app.js"]);
      }
    });

    test("should include ignored files when respectGitignore is false", async () => {
      mockFS.createFile(".gitignore", "*.log");
      mockFS.createFile("app.js", "code");
      mockFS.createFile("debug.log", "logs");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        respectGitignore: false,
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(3);
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual([".gitignore", "app.js", "debug.log"]);
      }
    });

    test("should show important hidden files even when includeHidden is false", async () => {
      mockFS.createFile(".gitignore", "*.log");
      mockFS.createFile(".env", "KEY=value");
      mockFS.createFile(".hidden", "secret");
      mockFS.createFile("app.js", "code");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
        includeHidden: false,
      });

      if ("items" in result) {
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual([".env", ".gitignore", "app.js"]);
      }
    });
  });

  describe("tree operation", () => {
    test("should return tree structure", async () => {
      mockFS.createFile("file1.txt", "content1");
      mockFS.createDir("dir1");
      mockFS.createFile("dir1/nested.txt", "nested");
      mockFS.createDir("dir1/subdir");
      mockFS.createFile("dir1/subdir/deep.txt", "deep");

      // Mock ignore-walk to return all files
      ignoreWalkSpy.mockImplementationOnce(() => {
        return Promise.resolve([
          "file1.txt",
          "dir1",
          "dir1/nested.txt",
          "dir1/subdir",
          "dir1/subdir/deep.txt",
        ]);
      });

      const result = await directory.execute({
        action: "tree",
        path: mockFS.getTestPath(),
        respectGitignore: false,
      });

      expect(result).toMatchObject({
        operation: "tree",
        maxDepth: "unlimited",
      });

      if ("tree" in result) {
        expect(result.tree).toHaveLength(2);
        const fileNode = result.tree.find((node) => node.name === "file1.txt");
        const dirNode = result.tree.find((node) => node.name === "dir1");

        expect(fileNode?.type).toBe("file");
        expect(dirNode?.type).toBe("directory");
        expect(dirNode?.children).toHaveLength(2);
      }
    });

    test("should respect maxDepth limit", async () => {
      mockFS.createDir("level1");
      mockFS.createDir("level1/level2");
      mockFS.createFile("level1/level2/deep.txt", "content");

      // Mock ignore-walk to return files within depth limit
      ignoreWalkSpy.mockImplementationOnce(() => {
        return Promise.resolve(["level1"]);
      });

      const result = await directory.execute({
        action: "tree",
        path: mockFS.getTestPath(),
        maxDepth: 1,
        respectGitignore: false,
      });

      if ("tree" in result) {
        expect(result.tree).toHaveLength(1);
        const level1 = result.tree[0];
        expect(level1.name).toBe("level1");
        expect(level1.children).toHaveLength(0);
      }
    });

    test("should include file sizes when requested", async () => {
      mockFS.createFile("small.txt", "hi");
      mockFS.createFile("large.txt", "this is much longer content");

      ignoreWalkSpy.mockImplementationOnce(() => {
        return Promise.resolve(["small.txt", "large.txt"]);
      });

      const result = await directory.execute({
        action: "tree",
        path: mockFS.getTestPath(),
        includeSize: true,
        respectGitignore: false,
      });

      if ("tree" in result) {
        const smallFile = result.tree.find((node) => node.name === "small.txt");
        const largeFile = result.tree.find((node) => node.name === "large.txt");

        expect(smallFile?.size).toBe(2);
        expect(largeFile?.size).toBe(27);
      }
    });

    test("should handle empty directories", async () => {
      mockFS.createDir("empty");

      ignoreWalkSpy.mockImplementationOnce(() => {
        return Promise.resolve(["empty"]);
      });

      const result = await directory.execute({
        action: "tree",
        path: mockFS.getTestPath(),
        respectGitignore: false,
      });

      if ("tree" in result) {
        expect(result.tree).toHaveLength(1);
        expect(result.tree[0].name).toBe("empty");
        expect(result.tree[0].children).toHaveLength(0);
      }
    });
  });

  describe("error handling", () => {
    test("should return error object for unknown action", async () => {
      const result = await directory.execute({
        action: "invalid",
        path: mockFS.getTestPath(),
      });

      expect(result).toMatchObject({
        error: true,
        message: "Invalid action provided. Please use 'list' or 'tree'.",
        providedAction: "invalid",
      });
    });

    test("should handle non-existent directories gracefully", async () => {
      // Mock readdir to throw error for non-existent path
      readdirSpy.mockImplementationOnce(() => {
        throw new Error("ENOENT: no such file or directory");
      });

      const result = await directory.execute({
        action: "list",
        path: "/non/existent/path",
      });

      expect(result).toMatchObject({
        error: true,
        operation: "list",
        path: "/non/existent/path",
      });
    });

    test("should handle permission errors gracefully", async () => {
      // Mock readdir to throw permission error
      readdirSpy.mockImplementationOnce(() => {
        throw new Error("EACCES: permission denied");
      });

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      expect(result).toMatchObject({
        error: true,
        operation: "list",
      });
    });

    test("should validate maxDepth parameter", async () => {
      const result = await directory.execute({
        action: "tree",
        path: mockFS.getTestPath(),
        maxDepth: 15,
      });

      expect(result).toMatchObject({
        error: true,
        message: "maxDepth too large",
        providedMaxDepth: 15,
        recommendedMaxDepth: 5,
      });
    });
  });

  describe("special cases", () => {
    test("should handle unicode filenames", async () => {
      mockFS.createFile("测试.txt", "unicode content");
      mockFS.createFile("émoji🚀.js", "emoji file");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      if ("items" in result) {
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual(["émoji🚀.js", "测试.txt"]);
      }
    });

    test("should handle very long filenames", async () => {
      const longName = "a".repeat(100) + ".txt";
      mockFS.createFile(longName, "long filename content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe(longName);
      }
    });

    test("should handle large directory with many files", async () => {
      // Create many files to test performance
      for (let i = 0; i < 50; i++) {
        mockFS.createFile(`file${i}.txt`, `content ${i}`);
      }

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(50);
      }
    });

    test("should handle files with special characters", async () => {
      mockFS.createFile("file with spaces.txt", "spaces");
      mockFS.createFile("file-with-dashes.txt", "dashes");
      mockFS.createFile("file_with_underscores.txt", "underscores");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      if ("items" in result) {
        expect(result.items).toHaveLength(3);
        const names = result.items.map((item) => item.name).sort();
        expect(names).toEqual([
          "file with spaces.txt",
          "file-with-dashes.txt",
          "file_with_underscores.txt",
        ]);
      }
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(directory.description).toContain(
        "Directory listing and tree visualization"
      );
      expect(directory.description).toContain("list");
      expect(directory.description).toContain("tree");
    });

    test("should have proper parameter validation", async () => {
      // Test with invalid maxDepth (too large)
      const result = await directory.execute({
        action: "tree",
        maxDepth: 15,
      });

      expect(result).toHaveProperty("error", true);
    });
  });

  describe("default parameters", () => {
    test("should use current directory when no path provided", async () => {
      mockFS.createFile("test.txt", "content");

      const result = await directory.execute({
        action: "list",
      });

      expect(result).toMatchObject({
        operation: "list",
        path: mockFS.getTestPath(),
      });
    });

    test("should use default values for optional parameters", async () => {
      mockFS.createFile("test.txt", "content");

      const result = await directory.execute({
        action: "list",
        path: mockFS.getTestPath(),
      });

      if ("items" in result) {
        expect(result.respectGitignore).toBe(true);
        expect(result.items[0].size).toBeUndefined(); // includeSize defaults to false
      }
    });
  });
});
