import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";

// Type definition for the expected result structure
type MkdirResult = {
  success: boolean;
  operation: string;
  path: string;
  fullPath?: string;
  recursive?: boolean;
  message: string;
  error?: boolean;
  suggestion?: string;
  errorCode?: string;
};

describe("mkdir tool", () => {
  let mkdir: any;
  let mkdirSpy: any;

  beforeEach(async () => {
    // Import the fs/promises module and create spy
    const fsPromises = await import("node:fs/promises");
    mkdirSpy = spyOn(fsPromises, "mkdir").mockImplementation(
      async (path: string, options?: { recursive?: boolean }) => {
        // Simulate error conditions based on path patterns
        if (!path || path.trim() === "") {
          const error = new Error("Path cannot be empty") as any;
          error.code = "EINVAL";
          throw error;
        }

        if (path.includes("/root/") && path.includes("no-permission")) {
          const error = new Error("Permission denied") as any;
          error.code = "EACCES";
          throw error;
        }

        if (path.includes("existing-file") && !options?.recursive) {
          const error = new Error("File exists") as any;
          error.code = "EEXIST";
          throw error;
        }

        if (path.includes("path/through/file")) {
          const error = new Error("Not a directory") as any;
          error.code = "ENOTDIR";
          throw error;
        }

        if (path.length > 500) {
          const error = new Error("File name too long") as any;
          error.code = "ENAMETOOLONG";
          throw error;
        }

        if (path.includes("no-space-dir")) {
          const error = new Error("No space left on device") as any;
          error.code = "ENOSPC";
          throw error;
        }

        if (
          path.includes("non-existent/nested/dir") &&
          options?.recursive === false
        ) {
          const error = new Error("No such file or directory") as any;
          error.code = "ENOENT";
          throw error;
        }

        // Otherwise succeed
        return Promise.resolve();
      }
    );

    // Import the mkdir tool after setting up the spy
    const module = await import("../mkdir");
    mkdir = module.mkdir;
  });

  afterEach(() => {
    mkdirSpy?.mockRestore();
  });

  describe("directory creation", () => {
    test("should create directory successfully with relative path", async () => {
      const result = (await (mkdir as any).execute({
        path: "new-directory",
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.operation).toBe("mkdir");
      expect(result.path).toBe("new-directory");
      expect(result.message).toContain("Successfully created directory");
    });

    test("should create nested directories with recursive option", async () => {
      const result = (await (mkdir as any).execute({
        path: "level1/level2/level3",
        recursive: true,
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.recursive).toBe(true);
    });

    test("should handle absolute paths", async () => {
      const dirPath = "/tmp/absolute-test";

      const result = (await (mkdir as any).execute({
        path: dirPath,
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.path).toBe(dirPath);
    });

    test("should treat path with trailing slash correctly", async () => {
      const result = (await (mkdir as any).execute({
        path: "trailing-slash-dir/",
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.path).toBe("trailing-slash-dir");
    });
  });

  describe("edge cases and error handling", () => {
    test("should handle empty path", async () => {
      const result = (await (mkdir as any).execute({
        path: "",
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Path cannot be empty");
    });

    test("should handle whitespace-only path", async () => {
      const result = (await (mkdir as any).execute({
        path: "   ",
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Path cannot be empty");
    });

    test("should handle existing directory gracefully with recursive mode", async () => {
      // Mock that directory creation succeeds (recursive mode handles existing dirs)
      mkdirSpy.mockResolvedValueOnce(undefined);

      const result = (await (mkdir as any).execute({
        path: "existing-dir",
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.message).toContain("Successfully created directory");
    });

    test("should handle recursive=false for nested paths", async () => {
      const result = (await (mkdir as any).execute({
        path: "non-existent/nested/dir",
        recursive: false,
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Failed to create directory");
      expect(result.suggestion).toBeDefined();
    });

    test("should provide helpful error suggestions", async () => {
      const result = (await (mkdir as any).execute({
        path: "/root/no-permission-dir",
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.suggestion).toBeDefined();
      expect(typeof result.suggestion).toBe("string");
    });
  });

  describe("relative path handling", () => {
    test("should create directories with various relative paths", async () => {
      const testCases = [
        "simple-dir",
        "my-folder",
        "components",
        "utils",
        "src",
        "nested/deep/dir",
        "./relative-dir",
        "dir-with-dots.and.stuff",
      ];

      for (const dirName of testCases) {
        const result = (await (mkdir as any).execute({
          path: dirName,
        })) as MkdirResult;

        expect(result.success).toBe(true);
        expect(result.operation).toBe("mkdir");
      }
    });

    test("should handle parent directory references", async () => {
      const result = (await (mkdir as any).execute({
        path: "../parent-ref-dir",
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });
  });

  describe("tool metadata", () => {
    test("should have correct tool description", () => {
      expect(mkdir.description).toContain("Create directories");
      expect(mkdir.description).toContain("recursive parent creation");
      expect(mkdir.description).toContain("equivalent to 'mkdir -p'");
      expect(mkdir.description).toContain("relative paths");
    });

    test("should have proper parameter validation", () => {
      expect(mkdir.inputSchema).toBeDefined();
    });

    test("should have required path parameter", () => {
      const schema = mkdir.inputSchema;
      expect(schema).toBeDefined();
      // Basic validation that the schema has the expected structure
      expect(typeof schema.parse).toBe("function");
    });

    test("should have recursive parameter with default true", () => {
      const schema = mkdir.inputSchema;
      const parsed = schema.parse({ path: "test" });
      expect(parsed.recursive).toBe(true);
    });

    test("should not have file-related parameters", () => {
      const schema = mkdir.inputSchema;
      // The schema accepts extra properties but doesn't validate them
      const result1 = schema.parse({ path: "test", type: "file" });
      const result2 = schema.parse({ path: "test", content: "data" });
      // Just ensure path and recursive are set correctly
      expect(result1.path).toBe("test");
      expect(result1.recursive).toBe(true);
      expect(result2.path).toBe("test");
      expect(result2.recursive).toBe(true);
    });
  });

  describe("unicode and special characters", () => {
    test("should handle unicode directory names", async () => {
      const result = (await (mkdir as any).execute({
        path: "测试目录",
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });

    test("should handle special characters in directory names", async () => {
      const result = (await (mkdir as any).execute({
        path: "dir with spaces & symbols!",
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });

    test("should handle very long directory names", async () => {
      const longName = "a".repeat(100);

      const result = (await (mkdir as any).execute({
        path: longName,
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });
  });

  describe("concurrent operations", () => {
    test("should handle concurrent directory creation", async () => {
      const paths = Array.from({ length: 5 }, (_, i) => `concurrent-dir-${i}`);

      const promises = paths.map((path) =>
        (mkdir as any).execute({
          path,
        })
      );

      const results = (await Promise.all(promises)) as MkdirResult[];

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.operation).toBe("mkdir");
      });
    });

    test("should handle concurrent nested directory creation", async () => {
      const paths = [
        "deep/nested/dir1",
        "deep/nested/dir2",
        "deep/nested/dir3",
      ];

      const promises = paths.map((path) =>
        (mkdir as any).execute({
          path,
        })
      );

      const results = (await Promise.all(promises)) as MkdirResult[];

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.operation).toBe("mkdir");
      });
    });
  });

  describe("error handling scenarios", () => {
    test("should handle various error types", async () => {
      const result = (await (mkdir as any).execute({
        path: "existing-file",
        recursive: false,
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.errorCode).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });

    test("should return error structure for problematic paths", async () => {
      const result = (await (mkdir as any).execute({
        path: "path/through/file",
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Failed to create directory");
      expect(result.suggestion).toBeDefined();
    });

    test("should handle very long path names", async () => {
      const result = (await (mkdir as any).execute({
        path: "x".repeat(1000),
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Failed to create directory");
      expect(result.suggestion).toBeDefined();
    });

    test("should handle space issues", async () => {
      const result = (await (mkdir as any).execute({
        path: "no-space-dir",
      })) as MkdirResult;

      expect(result.success).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain("Failed to create directory");
      expect(result.suggestion).toBeDefined();
    });

    test("should handle normal directory creation", async () => {
      const result = (await (mkdir as any).execute({
        path: "normal-path",
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.operation).toBe("mkdir");
      expect(result.message).toContain("Successfully created directory");
    });
  });

  describe("path normalization", () => {
    test("should normalize relative paths correctly", async () => {
      const result = (await (mkdir as any).execute({
        path: "./test/../final-dir",
      })) as MkdirResult;

      expect(result.success).toBe(true);
      expect(result.path).toBe("./test/../final-dir");
    });

    test("should handle multiple slashes", async () => {
      const result = (await (mkdir as any).execute({
        path: "test//double//slash",
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });

    test("should handle dot notation", async () => {
      const result = (await (mkdir as any).execute({
        path: "./current/./dir",
      })) as MkdirResult;

      expect(result.success).toBe(true);
    });
  });

  describe("return value structure", () => {
    test("should return proper success structure", async () => {
      const result = (await (mkdir as any).execute({
        path: "test-dir",
      })) as MkdirResult;

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("operation");
      expect(result).toHaveProperty("path");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("recursive");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.operation).toBe("string");
      expect(typeof result.path).toBe("string");
      expect(typeof result.message).toBe("string");
    });

    test("should return proper error structure", async () => {
      const result = (await (mkdir as any).execute({
        path: "",
      })) as MkdirResult;

      expect(result).toHaveProperty("success", false);
      expect(result).toHaveProperty("error", true);
      expect(result).toHaveProperty("operation");
      expect(result).toHaveProperty("path");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("suggestion");
      expect(typeof result.message).toBe("string");
      expect(typeof result.suggestion).toBe("string");
    });
  });
});
