import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { readFile } from "../read-file";
import { createTestFS } from "./test-utils";
import { join } from "node:path";

describe("readFile tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should read file content successfully", async () => {
    const content = "Hello, World!";
    await testFS.createFile("test.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "test.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe(content);
  });

  test("should read empty file", async () => {
    await testFS.createFile("empty.txt", "");

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "empty.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe("");
  });

  test("should read file with special characters", async () => {
    const content = "Special chars: éñü 🚀 \n\t<>&\"'";
    await testFS.createFile("special.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "special.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe(content);
  });

  test("should read multiline file", async () => {
    const content = "Line 1\nLine 2\nLine 3\n";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe(content);
  });

  test("should read JSON file", async () => {
    const content = '{"name": "test", "value": 123}';
    await testFS.createFile("data.json", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "data.json").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe(content);
  });

  test("should throw error for non-existent file", async () => {
    const relativePath = join(testFS.getPath(), "does-not-exist.txt").replace(
      process.cwd() + "/",
      "",
    );

    await expect(
      readFile.execute(
        { path: relativePath },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("not found");
  });

  test("should throw error when trying to read directory", async () => {
    await testFS.createDir("test-dir");
    const relativePath = join(testFS.getPath(), "test-dir").replace(
      process.cwd() + "/",
      "",
    );

    await expect(
      readFile.execute(
        { path: relativePath },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("is not a file");
  });

  test("should read file with line range", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          "",
        ),
        start_line: 2,
        end_line: 4,
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe("Line 2\nLine 3\nLine 4");
  });

  test("should read from start_line to end of file when end_line not specified", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          "",
        ),
        start_line: 3,
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe("Line 3\nLine 4\nLine 5");
  });

  test("should handle edge cases with line ranges", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    await testFS.createFile("short.txt", content);
    const relativePath = join(testFS.getPath(), "short.txt").replace(
      process.cwd() + "/",
      "",
    );

    // start_line beyond file length should return empty
    const result1 = await readFile.execute(
      {
        path: relativePath,
        start_line: 10,
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );
    expect(result1).toBe("");

    // end_line beyond file length should read to end
    const result2 = await readFile.execute(
      {
        path: relativePath,
        start_line: 2,
        end_line: 10,
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );
    expect(result2).toBe("Line 2\nLine 3");

    // single line read
    const result3 = await readFile.execute(
      {
        path: relativePath,
        start_line: 2,
        end_line: 2,
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );
    expect(result3).toBe("Line 2");
  });

  test("should return outline for large files", async () => {
    // Create a large file (over 50KB)
    const largeContent = "x".repeat(60000);
    await testFS.createFile("large.txt", largeContent);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "large.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toContain("This file was too big to read all at once");
    expect(result).toContain("you can call this tool again");
  });

  test("should generate outline for code files", async () => {
    const jsContent = `
export function hello() {
  return "Hello";
}

export class MyClass {
  constructor() {}
}

const myVar = 42;
`;
    await testFS.createFile("code.js", jsContent.repeat(2000)); // Make it large enough

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "code.js").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toContain("File outline:");
    expect(result).toContain("hello [L");
    expect(result).toContain("MyClass [L");
    expect(result).toContain("myVar [L");
  });

  test("should reject absolute paths", async () => {
    await expect(
      readFile.execute(
        { path: "/etc/passwd" },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("absolute paths are not allowed");
  });

  test("should reject path traversal attempts", async () => {
    await expect(
      readFile.execute(
        { path: "../../../etc/passwd" },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("path traversal not allowed");
  });

  test("should reject excluded file patterns", async () => {
    await testFS.createDir("node_modules");
    await testFS.createFile("node_modules/package.json", "{}");

    const relativePath = join(
      testFS.getPath(),
      "node_modules/package.json",
    ).replace(process.cwd() + "/", "");

    await expect(
      readFile.execute(
        { path: relativePath },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("file_scan_exclusions");
  });

  test("should reject private file patterns", async () => {
    await testFS.createFile(".env", "SECRET=123");

    const relativePath = join(testFS.getPath(), ".env").replace(
      process.cwd() + "/",
      "",
    );

    await expect(
      readFile.execute(
        { path: relativePath },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow("private_files");
  });

  test("should preserve line endings", async () => {
    const content = "Line 1\r\nLine 2\r\nLine 3";
    await testFS.createFile("windows.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "windows.txt").replace(
          process.cwd() + "/",
          "",
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      },
    );

    expect(result).toBe(content);
  });

  test("should handle binary files gracefully", async () => {
    // Create a file with binary content
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff]);
    await Bun.write(join(testFS.getPath(), "binary.bin"), binaryContent);

    const relativePath = join(testFS.getPath(), "binary.bin").replace(
      process.cwd() + "/",
      "",
    );

    // Should not throw, but might contain replacement characters
    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      },
    );
    expect(typeof result).toBe("string");
  });

  test("should validate line number parameters", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    await testFS.createFile("test.txt", content);
    const relativePath = join(testFS.getPath(), "test.txt").replace(
      process.cwd() + "/",
      "",
    );

    // Should work with valid line numbers
    await expect(
      readFile.execute(
        {
          path: relativePath,
          start_line: 1,
          end_line: 2,
        },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).resolves.toBe("Line 1\nLine 2");

    // Invalid line numbers should be handled gracefully by zod validation
    await expect(
      readFile.execute(
        {
          path: relativePath,
          start_line: 0, // Invalid: less than 1
        },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow();

    await expect(
      readFile.execute(
        {
          path: relativePath,
          start_line: -1, // Invalid: negative
        },
        {
          toolCallId: "test",
          messages: [],
        },
      ),
    ).rejects.toThrow();
  });

  test("should have correct tool metadata", () => {
    expect(readFile.description).toContain(
      "Reads the content of the given file",
    );
    expect(readFile.parameters).toBeDefined();
  });
});
