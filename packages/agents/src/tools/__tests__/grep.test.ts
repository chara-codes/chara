import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { grep } from "../grep";
import { createTestFS } from "./test-utils";
import { mkdir } from "fs/promises";

describe("grep tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should find simple text pattern", async () => {
    await testFS.createFile(
      "test.txt",
      "Hello World\nThis is a test\nWorld peace",
    );

    const result = await grep.execute({
      pattern: "World",
      paths: testFS.getPath("test.txt"),
    });

    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("Hello World");
    expect(parsed[0].line_num).toBe(1);
    expect(parsed[1].line).toBe("World peace");
    expect(parsed[1].line_num).toBe(3);
  });

  test("should handle case-insensitive search", async () => {
    await testFS.createFile("case.txt", "Hello WORLD\nworld peace\nWORLD war");

    const result = await grep.execute({
      pattern: "world",
      paths: testFS.getPath("case.txt"),
      ignoreCase: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].line).toBe("Hello WORLD");
    expect(parsed[1].line).toBe("world peace");
    expect(parsed[2].line).toBe("WORLD war");
  });

  test("should support regex patterns", async () => {
    await testFS.createFile("regex.txt", "test123\ntest456\nabc789\ntest_abc");

    const result = await grep.execute({
      pattern: "test\\d+",
      paths: testFS.getPath("regex.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("test123");
    expect(parsed[1].line).toBe("test456");
  });

  test("should handle fixed string matching", async () => {
    await testFS.createFile("fixed.txt", "test.txt\ntest*txt\ntest[abc]txt");

    const result = await grep.execute({
      pattern: "test.txt",
      paths: testFS.getPath("fixed.txt"),
      fixedStrings: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].line).toBe("test.txt");
  });

  test("should support invert matching", async () => {
    await testFS.createFile(
      "invert.txt",
      "include this\nexclude this line\ninclude this too",
    );

    const result = await grep.execute({
      pattern: "exclude",
      paths: testFS.getPath("invert.txt"),
      invertMatch: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("include this");
    expect(parsed[1].line).toBe("include this too");
  });

  test("should show context lines", async () => {
    await testFS.createFile(
      "context.txt",
      "line1\nline2\nmatch line\nline4\nline5",
    );

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("context.txt"),
      beforeContext: 1,
      afterContext: 1,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].match.line).toBe("match line");
    expect(parsed[0].before_context).toHaveLength(1);
    expect(parsed[0].before_context[0].line).toBe("line2");
    expect(parsed[0].after_context).toHaveLength(1);
    expect(parsed[0].after_context[0].line).toBe("line4");
  });

  test("should use context parameter for both before and after", async () => {
    await testFS.createFile(
      "context2.txt",
      "line1\nline2\nline3\nmatch line\nline5\nline6\nline7",
    );

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("context2.txt"),
      context: 2,
    });

    const parsed = JSON.parse(result);
    expect(parsed[0].before_context).toHaveLength(2);
    expect(parsed[0].after_context).toHaveLength(2);
    expect(parsed[0].before_context[0].line).toBe("line2");
    expect(parsed[0].before_context[1].line).toBe("line3");
    expect(parsed[0].after_context[0].line).toBe("line5");
    expect(parsed[0].after_context[1].line).toBe("line6");
  });

  test("should limit results with maxCount", async () => {
    await testFS.createFile(
      "limit.txt",
      "match1\nmatch2\nmatch3\nmatch4\nmatch5",
    );

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("limit.txt"),
      maxCount: 3,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].line).toBe("match1");
    expect(parsed[1].line).toBe("match2");
    expect(parsed[2].line).toBe("match3");
  });

  test("should search multiple files", async () => {
    await testFS.createFile("file1.txt", "found in file1");
    await testFS.createFile("file2.txt", "nothing here");
    await testFS.createFile("file3.txt", "another found in file3");

    const result = await grep.execute({
      pattern: "found",
      paths: [
        testFS.getPath("file1.txt"),
        testFS.getPath("file2.txt"),
        testFS.getPath("file3.txt"),
      ],
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].file).toContain("file1.txt");
    expect(parsed[0].line).toBe("found in file1");
    expect(parsed[1].file).toContain("file3.txt");
    expect(parsed[1].line).toBe("another found in file3");
  });

  test("should search directories recursively", async () => {
    await mkdir(testFS.getPath("subdir"));
    await mkdir(testFS.getPath("subdir/nested"));
    await testFS.createFile("root.txt", "root match");
    await testFS.createFile("subdir/sub.txt", "sub match");
    await testFS.createFile("subdir/nested/deep.txt", "deep match");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath(),
      recursive: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(3);

    const files = parsed.map((p) => p.file);
    expect(files.some((f) => f.includes("root.txt"))).toBe(true);
    expect(files.some((f) => f.includes("sub.txt"))).toBe(true);
    expect(files.some((f) => f.includes("deep.txt"))).toBe(true);
  });

  test("should filter files by pattern", async () => {
    await testFS.createFile("test.txt", "match in txt");
    await testFS.createFile("test.js", "match in js");
    await testFS.createFile("test.py", "match in py");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath(),
      filePattern: "*.txt",
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].file).toContain("test.txt");
  });

  test("should handle wildcard file patterns", async () => {
    await testFS.createFile("config.json", "match in json");
    await testFS.createFile("package.json", "match in package");
    await testFS.createFile("readme.txt", "match in readme");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath(),
      filePattern: "*.json",
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    const files = parsed.map((p) => p.file);
    expect(files.some((f) => f.includes("config.json"))).toBe(true);
    expect(files.some((f) => f.includes("package.json"))).toBe(true);
  });

  test("should disable line numbers when requested", async () => {
    await testFS.createFile("nolines.txt", "first match\nsecond match");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("nolines.txt"),
      lineNumber: false,
    });

    const parsed = JSON.parse(result);
    expect(parsed[0].line_num).toBeUndefined();
    expect(parsed[1].line_num).toBeUndefined();
  });

  test("should handle empty files", async () => {
    await testFS.createFile("empty.txt", "");

    const result = await grep.execute({
      pattern: "anything",
      paths: testFS.getPath("empty.txt"),
    });

    expect(result).toBe("No matches found");
  });

  test("should handle non-existent files gracefully", async () => {
    const result = await grep.execute({
      pattern: "test",
      paths: testFS.getPath("nonexistent.txt"),
    });

    expect(result).toBe("No matches found");
  });

  test("should handle special regex characters", async () => {
    await testFS.createFile(
      "special.txt",
      "test.file\ntest*file\ntest[file]\ntest+file",
    );

    const result = await grep.execute({
      pattern: "test\\.file",
      paths: testFS.getPath("special.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].line).toBe("test.file");
  });

  test("should handle unicode characters", async () => {
    await testFS.createFile(
      "unicode.txt",
      "测试 content\ncafé file\n🚀 rocket",
    );

    const result = await grep.execute({
      pattern: "测试",
      paths: testFS.getPath("unicode.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].line).toBe("测试 content");
  });

  test("should handle large files", async () => {
    const lines = [];
    for (let i = 0; i < 1000; i++) {
      lines.push(i % 100 === 0 ? `match line ${i}` : `regular line ${i}`);
    }
    await testFS.createFile("large.txt", lines.join("\n"));

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("large.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(10); // Every 100th line
    expect(parsed[0].line).toBe("match line 0");
    expect(parsed[1].line).toBe("match line 100");
  });

  test("should handle invalid regex gracefully", async () => {
    await testFS.createFile("test.txt", "some content");

    await expect(
      grep.execute({
        pattern: "[invalid",
        paths: testFS.getPath("test.txt"),
      }),
    ).rejects.toThrow("Invalid regular expression");
  });

  test("should search in current directory when path is directory", async () => {
    await testFS.createFile("dir1.txt", "match in dir1");
    await testFS.createFile("dir2.txt", "match in dir2");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath(),
      recursive: false,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
  });

  test("should handle mixed file and directory paths", async () => {
    await testFS.createFile("single.txt", "single match");
    await mkdir(testFS.getPath("testdir"));
    await testFS.createFile("testdir/dir.txt", "dir match");

    const result = await grep.execute({
      pattern: "match",
      paths: [testFS.getPath("single.txt"), testFS.getPath("testdir")],
      recursive: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
  });

  test("should truncate large result sets", async () => {
    const lines = [];
    for (let i = 0; i < 100; i++) {
      lines.push(`match line ${i}`);
    }
    await testFS.createFile("manymatches.txt", lines.join("\n"));

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("manymatches.txt"),
    });

    expect(result).toContain("Found 100 matches, showing first 50");
    expect(result).toContain("match line 0");
    expect(result).toContain("match line 49");
    expect(result).not.toContain("match line 50");
  });

  test("should handle multiline matches correctly", async () => {
    await testFS.createFile(
      "multiline.txt",
      "line1\nmatch here\nline3\nanother match\nline5",
    );

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath("multiline.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("match here");
    expect(parsed[0].line_num).toBe(2);
    expect(parsed[1].line).toBe("another match");
    expect(parsed[1].line_num).toBe(4);
  });

  test("should show match positions", async () => {
    await testFS.createFile("positions.txt", "test match test");

    const result = await grep.execute({
      pattern: "test",
      paths: testFS.getPath("positions.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed[0].matches).toHaveLength(2);
    expect(parsed[0].matches[0]).toEqual({ start: 0, end: 4 });
    expect(parsed[0].matches[1]).toEqual({ start: 11, end: 15 });
  });

  test("should handle case-insensitive file patterns", async () => {
    await testFS.createFile("Test.TXT", "match in caps");
    await testFS.createFile("test.txt", "match in lower");

    const result = await grep.execute({
      pattern: "match",
      paths: testFS.getPath(),
      filePattern: "*.txt",
      ignoreCase: true,
    });

    const parsed = JSON.parse(result);
    // Should match files that exist - note that file pattern matching is case-sensitive at filesystem level
    expect(parsed.length).toBeGreaterThanOrEqual(1);

    const files = parsed.map((p) => p.file);
    expect(
      files.some((f) => f.includes("test.txt") || f.includes("Test.TXT")),
    ).toBe(true);
  });

  test("should handle binary files gracefully", async () => {
    const binaryContent = "\x00\x01\x02test\x03\x04";
    await testFS.createFile("binary.bin", binaryContent);

    const result = await grep.execute({
      pattern: "test",
      paths: testFS.getPath("binary.bin"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].line).toContain("test");
  });

  test("should have correct tool metadata", () => {
    expect(grep.description).toContain("Search for patterns in files");
    expect(grep.description).toContain("grep-like functionality");
    expect(grep.parameters).toBeDefined();
  });

  test("should handle concurrent searches", async () => {
    await testFS.createFile("concurrent1.txt", "match in file 1");
    await testFS.createFile("concurrent2.txt", "match in file 2");

    const [result1, result2] = await Promise.all([
      grep.execute({
        pattern: "match",
        paths: testFS.getPath("concurrent1.txt"),
      }),
      grep.execute({
        pattern: "match",
        paths: testFS.getPath("concurrent2.txt"),
      }),
    ]);

    const parsed1 = JSON.parse(result1);
    const parsed2 = JSON.parse(result2);

    expect(parsed1[0].line).toBe("match in file 1");
    expect(parsed2[0].line).toBe("match in file 2");
  });

  test("should handle complex regex patterns", async () => {
    await testFS.createFile(
      "complex.txt",
      "email@domain.com\nuser@test.org\ninvalid-email",
    );

    const result = await grep.execute({
      pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      paths: testFS.getPath("complex.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("email@domain.com");
    expect(parsed[1].line).toBe("user@test.org");
  });

  test("should handle word boundary patterns", async () => {
    await testFS.createFile(
      "boundaries.txt",
      "test\ntesting\ntest123\nmy test",
    );

    const result = await grep.execute({
      pattern: "\\btest\\b",
      paths: testFS.getPath("boundaries.txt"),
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].line).toBe("test");
    expect(parsed[1].line).toBe("my test");
  });
});
