import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { readMultipleFiles } from "../read-multiple-files";
import { createTestFS } from "./test-utils";

describe("readMultipleFiles tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should read multiple files successfully", async () => {
    const content1 = "Content of file 1";
    const content2 = "Content of file 2";
    const filePath1 = await testFS.createFile("file1.txt", content1);
    const filePath2 = await testFS.createFile("file2.txt", content2);

    const result = await readMultipleFiles.execute({
      paths: [filePath1, filePath2]
    });

    expect(result).toContain(`${filePath1}:\n${content1}`);
    expect(result).toContain(`${filePath2}:\n${content2}`);
    expect(result).toContain("---");
  });

  test("should handle empty file list", async () => {
    const result = await readMultipleFiles.execute({ paths: [] });

    expect(result).toBe("");
  });

  test("should handle single file", async () => {
    const content = "Single file content";
    const filePath = await testFS.createFile("single.txt", content);

    const result = await readMultipleFiles.execute({ paths: [filePath] });

    expect(result).toBe(`${filePath}:\n${content}\n`);
    expect(result).not.toContain("---");
  });

  test("should handle mix of existing and non-existing files", async () => {
    const content = "Existing file content";
    const existingPath = await testFS.createFile("exists.txt", content);
    const nonExistingPath = testFS.getPath("does-not-exist.txt");

    const result = await readMultipleFiles.execute({
      paths: [existingPath, nonExistingPath]
    });

    expect(result).toContain(`${existingPath}:\n${content}`);
    expect(result).toContain(`${nonExistingPath}: Error -`);
    expect(result).toContain("---");
  });

  test("should handle all non-existing files", async () => {
    const nonExistingPath1 = testFS.getPath("missing1.txt");
    const nonExistingPath2 = testFS.getPath("missing2.txt");

    const result = await readMultipleFiles.execute({
      paths: [nonExistingPath1, nonExistingPath2]
    });

    expect(result).toContain(`${nonExistingPath1}: Error -`);
    expect(result).toContain(`${nonExistingPath2}: Error -`);
    expect(result).toContain("---");
  });

  test("should read files with different content types", async () => {
    const jsonContent = '{"name": "test", "value": 123}';
    const textContent = "Plain text content";
    const emptyContent = "";

    const jsonPath = await testFS.createFile("data.json", jsonContent);
    const textPath = await testFS.createFile("text.txt", textContent);
    const emptyPath = await testFS.createFile("empty.txt", emptyContent);

    const result = await readMultipleFiles.execute({
      paths: [jsonPath, textPath, emptyPath]
    });

    expect(result).toContain(`${jsonPath}:\n${jsonContent}`);
    expect(result).toContain(`${textPath}:\n${textContent}`);
    expect(result).toContain(`${emptyPath}:\n${emptyContent}`);
  });

  test("should handle files with special characters", async () => {
    const specialContent1 = "Special chars: éñü 🚀";
    const specialContent2 = "More special: \n\t<>&\"'";

    const path1 = await testFS.createFile("special1.txt", specialContent1);
    const path2 = await testFS.createFile("special2.txt", specialContent2);

    const result = await readMultipleFiles.execute({
      paths: [path1, path2]
    });

    expect(result).toContain(specialContent1);
    expect(result).toContain(specialContent2);
  });

  test("should handle multiline files", async () => {
    const multilineContent1 = "Line 1\nLine 2\nLine 3";
    const multilineContent2 = "Another line 1\nAnother line 2";

    const path1 = await testFS.createFile("multi1.txt", multilineContent1);
    const path2 = await testFS.createFile("multi2.txt", multilineContent2);

    const result = await readMultipleFiles.execute({
      paths: [path1, path2]
    });

    expect(result).toContain(multilineContent1);
    expect(result).toContain(multilineContent2);
  });

  test("should handle large number of files", async () => {
    const files: string[] = [];
    const contents: string[] = [];

    // Create 10 files
    for (let i = 0; i < 10; i++) {
      const content = `Content of file ${i}`;
      const filePath = await testFS.createFile(`file${i}.txt`, content);
      files.push(filePath);
      contents.push(content);
    }

    const result = await readMultipleFiles.execute({ paths: files });

    // Check all files are included
    for (let i = 0; i < 10; i++) {
      expect(result).toContain(`${files[i]}:\n${contents[i]}`);
    }

    // Should have 9 separators for 10 files
    const separatorCount = (result.match(/---/g) || []).length;
    expect(separatorCount).toBe(9);
  });

  test("should preserve file order", async () => {
    const content1 = "First file";
    const content2 = "Second file";
    const content3 = "Third file";

    const path1 = await testFS.createFile("first.txt", content1);
    const path2 = await testFS.createFile("second.txt", content2);
    const path3 = await testFS.createFile("third.txt", content3);

    const result = await readMultipleFiles.execute({
      paths: [path1, path2, path3]
    });

    const firstIndex = result.indexOf(content1);
    const secondIndex = result.indexOf(content2);
    const thirdIndex = result.indexOf(content3);

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  test("should handle directories in path list", async () => {
    const fileContent = "File content";
    const filePath = await testFS.createFile("valid.txt", fileContent);
    const dirPath = await testFS.createDir("test-dir");

    const result = await readMultipleFiles.execute({
      paths: [filePath, dirPath]
    });

    expect(result).toContain(`${filePath}:\n${fileContent}`);
    expect(result).toContain(`${dirPath}: Error -`);
  });

  test("should have correct tool metadata", () => {
    expect(readMultipleFiles.description).toBe("Read the contents of multiple files simultaneously");
    expect(readMultipleFiles.parameters).toBeDefined();
  });

  test("should handle concurrent file reads", async () => {
    const largeContent1 = "x".repeat(10000);
    const largeContent2 = "y".repeat(10000);

    const path1 = await testFS.createFile("large1.txt", largeContent1);
    const path2 = await testFS.createFile("large2.txt", largeContent2);

    const startTime = Date.now();
    const result = await readMultipleFiles.execute({
      paths: [path1, path2]
    });
    const endTime = Date.now();

    expect(result).toContain(largeContent1);
    expect(result).toContain(largeContent2);

    // Should be faster than reading sequentially (rough check)
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
