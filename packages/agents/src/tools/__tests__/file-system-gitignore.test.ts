import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { fileSystem } from "../file-system";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("fileSystem tool - gitignore functionality", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "fs-gitignore-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("list operation with gitignore", () => {
    test("should respect .gitignore patterns", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\nignored/\n*.log");

      // Create files that should be ignored
      await writeFile(join(testDir, "temp.tmp"), "temporary");
      await writeFile(join(testDir, "app.log"), "log content");
      await mkdir(join(testDir, "ignored"));
      await writeFile(join(testDir, "ignored", "file.txt"), "ignored file");

      // Create files that should be included
      await writeFile(join(testDir, "included.txt"), "included");
      await writeFile(join(testDir, "app.js"), "javascript");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });

      expect(result.items.map((item: any) => item.name)).toContain(
        "included.txt",
      );
      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).toContain(
        ".gitignore",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "temp.tmp",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "app.log",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "ignored",
      );
    });

    test("should include ignored files when respectGitignore is false", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create ignored file
      await writeFile(join(testDir, "temp.tmp"), "temporary");
      await writeFile(join(testDir, "included.txt"), "included");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: false,
      });

      expect(result.items.map((item: any) => item.name)).toContain("temp.tmp");
      expect(result.items.map((item: any) => item.name)).toContain(
        "included.txt",
      );
      expect(result.items.map((item: any) => item.name)).toContain(
        ".gitignore",
      );
    });

    test("should always exclude .chara, node_modules, and .git directories", async () => {
      // Create directories that should always be excluded
      await mkdir(join(testDir, ".chara"));
      await mkdir(join(testDir, "node_modules"));
      await mkdir(join(testDir, ".git"));
      await writeFile(join(testDir, ".chara", "config.json"), "{}");
      await writeFile(join(testDir, "node_modules", "package.json"), "{}");
      await writeFile(join(testDir, ".git", "config"), "git config");

      // Create normal file
      await writeFile(join(testDir, "app.js"), "javascript");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: false,
      });

      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).not.toContain(
        ".chara",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "node_modules",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(".git");
    });
  });

  describe("tree operation with gitignore", () => {
    test("should respect .gitignore patterns in tree structure", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "build/\n*.tmp\n");

      // Create directory structure
      await mkdir(join(testDir, "src"));
      await mkdir(join(testDir, "build"));
      await writeFile(join(testDir, "src", "index.js"), "source");
      await writeFile(join(testDir, "build", "output.js"), "built");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "tree",
        path: testDir,
        respectGitignore: true,
      });

      const hasFile = (tree: any[], name: string): boolean => {
        return tree.some(
          (item) =>
            item.name === name ||
            (item.children && hasFile(item.children, name)),
        );
      };

      expect(hasFile(result.tree, "src")).toBe(true);
      expect(hasFile(result.tree, "index.js")).toBe(true);
      expect(hasFile(result.tree, "build")).toBe(false);
      expect(hasFile(result.tree, "output.js")).toBe(false);
      expect(hasFile(result.tree, "temp.tmp")).toBe(false);
    });

    test("should include ignored files when respectGitignore is false", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create files
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "tree",
        path: testDir,
        respectGitignore: false,
      });

      const hasFile = (tree: any[], name: string): boolean => {
        return tree.some((item) => item.name === name);
      };

      expect(hasFile(result.tree, "app.js")).toBe(true);
      expect(hasFile(result.tree, "temp.tmp")).toBe(true);
    });
  });

  describe("stats operation with gitignore", () => {
    test("should count ignored items separately", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\nignored/\n");

      // Create files and directories
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");
      await writeFile(join(testDir, "another.tmp"), "another temp");
      await mkdir(join(testDir, "ignored"));
      await writeFile(join(testDir, "ignored", "file.txt"), "ignored file");
      await mkdir(join(testDir, "src"));
      await writeFile(join(testDir, "src", "index.js"), "source");

      const result = await fileSystem.execute({
        action: "stats",
        path: testDir,
        respectGitignore: true,
      });

      expect(result.stats.totalFiles).toBe(3); // .gitignore, app.js and src/index.js
      expect(result.stats.totalDirectories).toBe(1); // src directory
      expect(result.stats.ignoredItems).toBe(4); // temp.tmp, another.tmp, ignored/, and ignored/file.txt
    });

    test("should include ignored items in count when respectGitignore is false", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create files
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "stats",
        path: testDir,
        respectGitignore: false,
      });

      expect(result.stats.totalFiles).toBe(3); // app.js, temp.tmp, and .gitignore
      expect(result.stats.ignoredItems).toBe(1); // temp.tmp (still counted as ignored but included)
    });
  });

  describe("find operation with gitignore", () => {
    test("should respect .gitignore patterns in search results", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\nbuild/\n");

      // Create files and directories
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "test.js"), "test");
      await writeFile(join(testDir, "temp.tmp"), "temporary");
      await mkdir(join(testDir, "build"));
      await writeFile(join(testDir, "build", "output.js"), "built");
      await mkdir(join(testDir, "src"));
      await writeFile(join(testDir, "src", "utils.js"), "utilities");

      const result = await fileSystem.execute({
        action: "find",
        pattern: "**/*.js",
        path: testDir,
        respectGitignore: true,
      });

      const resultPaths = result.results.map((r: any) => r.path);
      expect(resultPaths).toContain("app.js");
      expect(resultPaths).toContain("test.js");
      expect(resultPaths).toContain("src/utils.js");
      expect(resultPaths).not.toContain("build/output.js");
    });

    test("should include ignored files when respectGitignore is false", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create files
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "find",
        pattern: "*",
        path: testDir,
        respectGitignore: false,
      });

      const resultPaths = result.results.map((r: any) => r.path);
      expect(resultPaths).toContain("app.js");
      expect(resultPaths).toContain("temp.tmp");
      expect(resultPaths).toContain(".gitignore");
    });

    test("should show total found vs filtered count", async () => {
      // Create .gitignore file
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create files
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");
      await writeFile(join(testDir, "another.tmp"), "another temp");

      const result = await fileSystem.execute({
        action: "find",
        pattern: "*",
        path: testDir,
        respectGitignore: true,
      });

      expect(result.count).toBe(2); // app.js and .gitignore (after filtering)
      expect(result.totalFound).toBeGreaterThan(result.count); // Should show more were found before filtering
    });
  });

  describe("nested gitignore files", () => {
    test("should respect gitignore files in parent directories", async () => {
      // Create parent .gitignore
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create nested structure
      await mkdir(join(testDir, "subdir"));
      await writeFile(join(testDir, "subdir", "app.js"), "javascript");
      await writeFile(join(testDir, "subdir", "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "list",
        path: join(testDir, "subdir"),
        respectGitignore: true,
      });

      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "temp.tmp",
      );
    });

    test("should combine multiple gitignore files", async () => {
      // Create parent .gitignore
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create nested structure with its own .gitignore
      await mkdir(join(testDir, "subdir"));
      await writeFile(join(testDir, "subdir", ".gitignore"), "*.log\n");
      await writeFile(join(testDir, "subdir", "app.js"), "javascript");
      await writeFile(join(testDir, "subdir", "temp.tmp"), "temporary");
      await writeFile(join(testDir, "subdir", "app.log"), "log file");

      const result = await fileSystem.execute({
        action: "list",
        path: join(testDir, "subdir"),
        respectGitignore: true,
      });

      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).toContain(
        ".gitignore",
      );
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "temp.tmp",
      ); // Ignored by parent
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "app.log",
      ); // Ignored by local
    });
  });

  describe("gitignore pattern types", () => {
    test("should handle glob patterns", async () => {
      // Create .gitignore with glob patterns
      await writeFile(
        join(testDir, ".gitignore"),
        "**/*.test.js\nsrc/*/temp.*\n",
      );

      // Create directory structure
      await mkdir(join(testDir, "src"));
      await mkdir(join(testDir, "src", "components"));
      await mkdir(join(testDir, "tests"));

      await writeFile(join(testDir, "src", "app.js"), "app");
      await writeFile(join(testDir, "src", "app.test.js"), "app test");
      await writeFile(
        join(testDir, "src", "components", "temp.js"),
        "temp component",
      );
      await writeFile(join(testDir, "tests", "unit.test.js"), "unit test");

      const result = await fileSystem.execute({
        action: "find",
        pattern: "**/*.js",
        path: testDir,
        respectGitignore: true,
      });

      const resultPaths = result.results.map((r: any) => r.path);
      expect(resultPaths).toContain("src/app.js");
      expect(resultPaths).not.toContain("src/app.test.js");
      expect(resultPaths).not.toContain("src/components/temp.js");
      expect(resultPaths).not.toContain("tests/unit.test.js");
    });

    test("should handle negation patterns", async () => {
      // Create .gitignore with negation
      await writeFile(join(testDir, ".gitignore"), "*.js\n!important.js\n");

      await writeFile(join(testDir, "app.js"), "app");
      await writeFile(join(testDir, "test.js"), "test");
      await writeFile(join(testDir, "important.js"), "important");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });

      const resultNames = result.items.map((item: any) => item.name);
      expect(resultNames).toContain("important.js");
      expect(resultNames).not.toContain("app.js");
      expect(resultNames).not.toContain("test.js");
    });

    test("should handle directory patterns", async () => {
      // Create .gitignore with directory patterns
      await writeFile(join(testDir, ".gitignore"), "temp/\n");

      // Create directories
      await mkdir(join(testDir, "temp"));
      await mkdir(join(testDir, "src"));
      await writeFile(join(testDir, "temp", "file.txt"), "temp file");
      await writeFile(join(testDir, "src", "app.js"), "app");
      await writeFile(join(testDir, "temp.txt"), "temp file"); // File named temp, not directory

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });

      const resultNames = result.items.map((item: any) => item.name);
      expect(resultNames).toContain("src");
      expect(resultNames).toContain("temp.txt"); // File should not be ignored
      expect(resultNames).not.toContain("temp"); // Directory should be ignored
    });
  });

  describe("error handling", () => {
    test("should handle invalid .gitignore files gracefully", async () => {
      // Create .gitignore with potentially problematic content
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n\x00\n[invalid\n");

      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });

      // Should still work and ignore *.tmp pattern
      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).not.toContain(
        "temp.tmp",
      );
    });

    test("should work when no .gitignore file exists", async () => {
      await writeFile(join(testDir, "app.js"), "javascript");
      await writeFile(join(testDir, "temp.tmp"), "temporary");

      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });

      // Should only apply default exclusions
      expect(result.items.map((item: any) => item.name)).toContain("app.js");
      expect(result.items.map((item: any) => item.name)).toContain("temp.tmp");
    });
  });

  describe("performance with large directories", () => {
    test("should handle directories with many files efficiently", async () => {
      // Create .gitignore
      await writeFile(join(testDir, ".gitignore"), "*.tmp\n");

      // Create many files
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(writeFile(join(testDir, `file${i}.js`), `content ${i}`));
        promises.push(writeFile(join(testDir, `temp${i}.tmp`), `temp ${i}`));
      }
      await Promise.all(promises);

      const startTime = Date.now();
      const result = await fileSystem.execute({
        action: "list",
        path: testDir,
        respectGitignore: true,
      });
      const endTime = Date.now();

      expect(result.items).toHaveLength(101); // 100 .js files + .gitignore
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
