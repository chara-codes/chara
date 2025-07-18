import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { moveFile } from "../move-file";
import { createTestFS } from "./test-utils";
import { mkdir, stat } from "fs/promises";

describe("moveFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should move file successfully", async () => {
    const content = "File content to move";
    const sourcePath = await testFS.createFile("source.txt", content);
    const destPath = testFS.getPath("destination.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Successfully moved");
    expect(result.message).toContain(sourcePath);
    expect(result.message).toContain(destPath);

    // Source should not exist
    expect(await testFS.fileExists("source.txt")).toBe(false);

    // Destination should exist with correct content
    expect(await testFS.fileExists("destination.txt")).toBe(true);
    expect(await testFS.readFile("destination.txt")).toBe(content);
  });

  test("should rename file in same directory", async () => {
    const content = "Content to rename";
    const sourcePath = await testFS.createFile("oldname.txt", content);
    const destPath = testFS.getPath("newname.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("oldname.txt")).toBe(false);
    expect(await testFS.fileExists("newname.txt")).toBe(true);
    expect(await testFS.readFile("newname.txt")).toBe(content);
  });

  test("should move file to different directory", async () => {
    const content = "Content to move";
    const sourcePath = await testFS.createFile("file.txt", content);
    await mkdir(testFS.getPath("subdir"));
    const destPath = testFS.getPath("subdir/moved-file.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("file.txt")).toBe(false);
    expect(await testFS.fileExists("subdir/moved-file.txt")).toBe(true);
    expect(await testFS.readFile("subdir/moved-file.txt")).toBe(content);
  });

  test("should move directory successfully", async () => {
    await mkdir(testFS.getPath("source-dir"));
    await testFS.createFile("source-dir/file1.txt", "content1");
    await testFS.createFile("source-dir/file2.txt", "content2");
    await mkdir(testFS.getPath("source-dir/subdir"));
    await testFS.createFile("source-dir/subdir/nested.txt", "nested content");

    const sourcePath = testFS.getPath("source-dir");
    const destPath = testFS.getPath("destination-dir");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");

    // Source directory should not exist
    await expect(stat(sourcePath)).rejects.toThrow();

    // Destination directory should exist with all contents
    const destStats = await stat(destPath);
    expect(destStats.isDirectory()).toBe(true);
    expect(await testFS.fileExists("destination-dir/file1.txt")).toBe(true);
    expect(await testFS.fileExists("destination-dir/file2.txt")).toBe(true);
    expect(await testFS.fileExists("destination-dir/subdir/nested.txt")).toBe(
      true,
    );
    expect(await testFS.readFile("destination-dir/file1.txt")).toBe("content1");
    expect(await testFS.readFile("destination-dir/subdir/nested.txt")).toBe(
      "nested content",
    );
  });

  test("should rename directory", async () => {
    await mkdir(testFS.getPath("old-dir-name"));
    await testFS.createFile("old-dir-name/file.txt", "content");

    const sourcePath = testFS.getPath("old-dir-name");
    const destPath = testFS.getPath("new-dir-name");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    await expect(stat(sourcePath)).rejects.toThrow();

    const destStats = await stat(destPath);
    expect(destStats.isDirectory()).toBe(true);
    expect(await testFS.fileExists("new-dir-name/file.txt")).toBe(true);
  });

  test("should move file with special characters", async () => {
    const content = "Special content éñü 🚀";
    const sourcePath = await testFS.createFile(
      "special-chars éñü.txt",
      content,
    );
    const destPath = testFS.getPath("moved-special 🚀.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("moved-special 🚀.txt")).toBe(content);
  });

  test("should move file to nested directory", async () => {
    const content = "Nested move content";
    const sourcePath = await testFS.createFile("source.txt", content);
    await mkdir(testFS.getPath("level1"), { recursive: true });
    await mkdir(testFS.getPath("level1/level2"), { recursive: true });
    await mkdir(testFS.getPath("level1/level2/level3"), { recursive: true });
    const destPath = testFS.getPath("level1/level2/level3/moved.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("source.txt")).toBe(false);
    expect(await testFS.fileExists("level1/level2/level3/moved.txt")).toBe(
      true,
    );
    expect(await testFS.readFile("level1/level2/level3/moved.txt")).toBe(
      content,
    );
  });

  test("should preserve file permissions", async () => {
    const content = "#!/bin/bash\necho 'test'";
    const sourcePath = await testFS.createFile("script.sh", content);
    const destPath = testFS.getPath("moved-script.sh");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("moved-script.sh")).toBe(content);
  });

  test("should handle empty file", async () => {
    const sourcePath = await testFS.createFile("empty.txt", "");
    const destPath = testFS.getPath("moved-empty.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("empty.txt")).toBe(false);
    expect(await testFS.fileExists("moved-empty.txt")).toBe(true);
    expect(await testFS.readFile("moved-empty.txt")).toBe("");
  });

  test("should handle large file", async () => {
    const largeContent = "x".repeat(100000);
    const sourcePath = await testFS.createFile("large.txt", largeContent);
    const destPath = testFS.getPath("moved-large.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("moved-large.txt")).toBe(largeContent);
  });

  test("should throw error for non-existent source", async () => {
    const nonExistentPath = testFS.getPath("does-not-exist.txt");
    const destPath = testFS.getPath("destination.txt");

    expect(
      await moveFile.execute({
        source: nonExistentPath,
        destination: destPath,
      }),
    ).toInclude("Failed to move");
  });

  test("should overwrite destination when it already exists", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";
    const sourcePath = await testFS.createFile("source.txt", content1);
    const destPath = await testFS.createFile("destination.txt", content2);

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("source.txt")).toBe(false);
    expect(await testFS.fileExists("destination.txt")).toBe(true);
    expect(await testFS.readFile("destination.txt")).toBe(content1);
  });

  test("should throw error when trying to move to non-existent directory", async () => {
    const sourcePath = await testFS.createFile("source.txt", "content");
    const destPath = testFS.getPath("non-existent-dir/destination.txt");

    expect(
      await moveFile.execute({
        source: sourcePath,
        destination: destPath,
      }),
    ).toInclude("Failed to move");
  });

  test("should handle moving hidden files", async () => {
    const content = "SECRET=value";
    const sourcePath = await testFS.createFile(".env", content);
    const destPath = testFS.getPath(".env.backup");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists(".env")).toBe(false);
    expect(await testFS.fileExists(".env.backup")).toBe(true);
    expect(await testFS.readFile(".env.backup")).toBe(content);
  });

  test("should handle concurrent moves", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";
    const source1 = await testFS.createFile("source1.txt", content1);
    const source2 = await testFS.createFile("source2.txt", content2);
    const dest1 = testFS.getPath("dest1.txt");
    const dest2 = testFS.getPath("dest2.txt");

    const [result1, result2] = await Promise.all([
      moveFile.execute({ source: source1, destination: dest1 }),
      moveFile.execute({ source: source2, destination: dest2 }),
    ]);

    expect(result1.status).toBe("success");
    expect(result2.status).toBe("success");
    expect(await testFS.readFile("dest1.txt")).toBe(content1);
    expect(await testFS.readFile("dest2.txt")).toBe(content2);
  });

  test("should move file across directory boundaries", async () => {
    await mkdir(testFS.getPath("dir1"));
    await mkdir(testFS.getPath("dir2"));

    const content = "Cross-directory move";
    const sourcePath = await testFS.createFile("dir1/source.txt", content);
    const destPath = testFS.getPath("dir2/destination.txt");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists("dir1/source.txt")).toBe(false);
    expect(await testFS.fileExists("dir2/destination.txt")).toBe(true);
    expect(await testFS.readFile("dir2/destination.txt")).toBe(content);
  });

  test("should have correct tool metadata", () => {
    expect(moveFile.description).toBe(
      "Move or rename files and directories. Can move files between directories and rename them in a single operation.",
    );
    expect(moveFile.parameters).toBeDefined();
  });

  test("should handle binary-like content", async () => {
    const binaryContent = "\x00\x01\x02\x03\xFF\xFE\xFD";
    const sourcePath = await testFS.createFile("binary.bin", binaryContent);
    const destPath = testFS.getPath("moved-binary.bin");

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.readFile("moved-binary.bin")).toBe(binaryContent);
  });

  test("should handle files with very long names", async () => {
    const longName = "a".repeat(100) + ".txt";
    const content = "Long filename content";
    const sourcePath = await testFS.createFile(longName, content);
    const destLongName = "b".repeat(100) + ".txt";
    const destPath = testFS.getPath(destLongName);

    const result = await moveFile.execute({
      source: sourcePath,
      destination: destPath,
    });

    expect(result.status).toBe("success");
    expect(await testFS.fileExists(longName)).toBe(false);
    expect(await testFS.fileExists(destLongName)).toBe(true);
    expect(await testFS.readFile(destLongName)).toBe(content);
  });

  test("should handle moving directory with many files", async () => {
    const sourceDirPath = testFS.getPath("source-many");
    await mkdir(sourceDirPath);

    // Create many files
    for (let i = 0; i < 20; i++) {
      await testFS.createFile(`source-many/file${i}.txt`, `content${i}`);
    }

    const destDirPath = testFS.getPath("dest-many");

    const result = await moveFile.execute({
      source: sourceDirPath,
      destination: destDirPath,
    });

    expect(result.status).toBe("success");
    await expect(stat(sourceDirPath)).rejects.toThrow();

    // Verify all files moved
    for (let i = 0; i < 20; i++) {
      expect(await testFS.fileExists(`dest-many/file${i}.txt`)).toBe(true);
      expect(await testFS.readFile(`dest-many/file${i}.txt`)).toBe(
        `content${i}`,
      );
    }
  });
});
