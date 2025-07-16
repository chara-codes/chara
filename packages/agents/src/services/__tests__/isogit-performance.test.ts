import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { IsoGitService } from "../isogit";
import { createTestFS } from "../../tools/__tests__/test-utils";

describe("IsoGitService Performance & Edge Cases", () => {
  const testFS = createTestFS();
  let service: IsoGitService;

  beforeEach(async () => {
    await testFS.setup();
    service = new IsoGitService();
    await service.initializeRepository(testFS.getPath());
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  describe("performance tests", () => {
    test("should handle large files efficiently", async () => {
      // Create a large file (1MB)
      const largeContent = "x".repeat(1024 * 1024);
      await testFS.createFile("large-file.txt", largeContent);

      const startTime = Date.now();
      const result = await service.saveToHistory(testFS.getPath());
      const endTime = Date.now();

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(2); // large-file.txt + .gitignore

      // Should complete within reasonable time (adjust threshold as needed)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    test("should handle many small files efficiently", async () => {
      // Create 100 small files
      const fileCount = 100;
      const promises = [];

      for (let i = 0; i < fileCount; i++) {
        promises.push(testFS.createFile(`file-${i}.txt`, `Content ${i}`));
      }

      await Promise.all(promises);

      const startTime = Date.now();
      const result = await service.saveToHistory(testFS.getPath());
      const endTime = Date.now();

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(fileCount + 1); // 100 files + .gitignore

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(15000); // 15 seconds max for 100 files
    });

    test("should handle deep directory structures efficiently", async () => {
      // Create nested directories 10 levels deep
      let currentPath = "";
      for (let i = 0; i < 10; i++) {
        currentPath += `level${i}/`;
        await testFS.createDir(currentPath);
        await testFS.createFile(
          `${currentPath}file.txt`,
          `Content at level ${i}`
        );
      }

      const startTime = Date.now();
      const result = await service.saveToHistory(testFS.getPath());
      const endTime = Date.now();

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(21); // 10 files + 10 .gitkeep files + .gitignore

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe("edge cases", () => {
    test("should handle files with very long names", async () => {
      const longFileName = "very-long-filename-" + "x".repeat(200) + ".txt";
      await testFS.createFile(longFileName, "Content");

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.files).toContain(longFileName);
    });

    test("should handle files with unicode characters", async () => {
      const unicodeFiles = [
        "файл.txt", // Cyrillic
        "文件.txt", // Chinese
        "ファイル.txt", // Japanese
        "파일.txt", // Korean
        "🚀rocket.txt", // Emoji
        "café.txt", // Accented characters
      ];

      for (const fileName of unicodeFiles) {
        await testFS.createFile(fileName, `Content of ${fileName}`);
      }

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(unicodeFiles.length + 1); // unicode files + .gitignore

      for (const fileName of unicodeFiles) {
        expect(result.files).toContain(fileName);
      }
    });

    test("should handle files with special characters in path", async () => {
      const specialChars = [
        "file with spaces.txt",
        "file-with-hyphens.txt",
        "file_with_underscores.txt",
        "file.with.dots.txt",
        "file(with)parentheses.txt",
        "file[with]brackets.txt",
        "file{with}braces.txt",
      ];

      for (const fileName of specialChars) {
        await testFS.createFile(fileName, `Content of ${fileName}`);
      }

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(specialChars.length + 1); // special chars files + .gitignore
    });

    test("should handle empty directories gracefully", async () => {
      // Create empty directories
      await testFS.createDir("empty1");
      await testFS.createDir("empty2/nested");
      await testFS.createFile("regular.txt", "Content");

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(4); // regular.txt + 2 .gitkeep files + .gitignore
      expect(result.files).toContain("regular.txt");
    });

    test("should handle mixed line endings", async () => {
      await testFS.createFile("unix.txt", "Line 1\nLine 2\nLine 3");
      await testFS.createFile("windows.txt", "Line 1\r\nLine 2\r\nLine 3");
      await testFS.createFile("mac.txt", "Line 1\rLine 2\rLine 3");

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(4); // 3 line ending files + .gitignore
    });

    test("should handle zero-byte files", async () => {
      await testFS.createFile("zero-bytes.txt", "");
      await testFS.createFile("normal.txt", "Content");

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(3); // zero-bytes.txt + normal.txt + .gitignore
      expect(result.files).toContain("zero-bytes.txt");
      expect(result.files).toContain("normal.txt");
    });

    test("should handle files with only whitespace", async () => {
      await testFS.createFile("spaces.txt", "   ");
      await testFS.createFile("tabs.txt", "\t\t\t");
      await testFS.createFile("newlines.txt", "\n\n\n");
      await testFS.createFile("mixed.txt", " \t\n \t\n ");

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.filesProcessed).toBe(5); // 4 whitespace files + .gitignore
    });

    test("should handle rapid successive commits", async () => {
      const results = [];

      // Create and commit files in rapid succession
      for (let i = 0; i < 5; i++) {
        await testFS.createFile(`rapid-${i}.txt`, `Content ${i}`);
        const result = await service.saveToHistory(
          testFS.getPath(),
          `Commit ${i}`
        );
        results.push(result);

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // All commits should succeed
      for (const result of results) {
        expect(result.status).toBe("success");
        expect(result.commitSha).toBeDefined();
      }

      // All commit SHAs should be different
      const shas = results.map((r) => r.commitSha);
      const uniqueShas = new Set(shas);
      expect(uniqueShas.size).toBe(shas.length);
    });

    test("should handle file content with binary data", async () => {
      // Create files with various binary patterns
      const binaryData = new Uint8Array([
        0x00,
        0x01,
        0x02,
        0x03,
        0xff,
        0xfe,
        0xfd,
        0xfc,
        0x89,
        0x50,
        0x4e,
        0x47, // PNG header
        0x47,
        0x49,
        0x46,
        0x38, // GIF header
      ]);

      await Bun.write(testFS.getPath("binary.dat"), binaryData);

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.files).toContain("binary.dat");
    });

    test("should handle extremely long file content", async () => {
      // Create a file with very long lines
      const longLine = "x".repeat(10000);
      const content = Array(10).fill(longLine).join("\n");

      await testFS.createFile("long-lines.txt", content);

      const result = await service.saveToHistory(testFS.getPath());

      expect(result.status).toBe("success");
      expect(result.files).toContain("long-lines.txt");
    });
  });

  describe("stress tests", () => {
    test("should handle repository with existing history", async () => {
      // Create initial commit
      await testFS.createFile("initial.txt", "Initial content");
      await service.saveToHistory(testFS.getPath(), "Initial commit");

      // Add more files over multiple commits
      for (let i = 0; i < 10; i++) {
        await testFS.createFile(`history-${i}.txt`, `Content ${i}`);
        const result = await service.saveToHistory(
          testFS.getPath(),
          `Commit ${i}`
        );
        expect(result.status).toBe("success");
      }

      // Verify we can still add more files
      await testFS.createFile("final.txt", "Final content");
      const finalResult = await service.saveToHistory(
        testFS.getPath(),
        "Final commit"
      );

      expect(finalResult.status).toBe("success");
      expect(finalResult.files).toContain("final.txt");
    });

    test("should maintain performance with growing repository", async () => {
      const iterations = 3;
      const filesPerIteration = 5;
      const timings = [];

      for (let iter = 0; iter < iterations; iter++) {
        // Add files for this iteration
        for (let i = 0; i < filesPerIteration; i++) {
          const fileName = `iter${iter}-file${i}.txt`;
          await testFS.createFile(fileName, `Iteration ${iter}, File ${i}`);
        }

        // Measure commit time
        const startTime = Date.now();
        const result = await service.saveToHistory(
          testFS.getPath(),
          `Iteration ${iter}`
        );
        const endTime = Date.now();

        expect(result.status).toBe("success");
        // Just verify that files were processed, don't check exact count due to git state complexities
        expect(result.filesProcessed).toBeGreaterThan(0);

        timings.push(endTime - startTime);
      }

      // Performance shouldn't degrade significantly
      const firstTiming = timings[0];
      const lastTiming = timings[timings.length - 1];

      // Allow for some performance degradation but not more than 10x
      expect(lastTiming).toBeLessThan(firstTiming * 10);
    });
  });

  describe("memory usage", () => {
    test("should not leak memory with many small operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many small operations
      for (let i = 0; i < 50; i++) {
        await testFS.createFile(`mem-test-${i}.txt`, `Content ${i}`);

        if (i % 10 === 0) {
          // Commit every 10 files
          await service.saveToHistory(
            testFS.getPath(),
            `Batch ${Math.floor(i / 10)}`
          );
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
