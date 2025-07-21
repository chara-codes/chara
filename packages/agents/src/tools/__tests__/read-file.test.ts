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
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content });
  });

  test("should read empty file", async () => {
    await testFS.createFile("empty.txt", "");

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "empty.txt").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content: "" });
  });

  test("should read file with special characters", async () => {
    const content = "Special chars: éñü 🚀 \n\t<>&\"'";
    await testFS.createFile("special.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "special.txt").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content });
  });

  test("should read multiline file", async () => {
    const content = "Line 1\nLine 2\nLine 3\n";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content });
  });

  test("should read JSON file", async () => {
    const content = '{"name": "test", "value": 123}';
    await testFS.createFile("data.json", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "data.json").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content });
  });

  test("should return error object for non-existent file", async () => {
    const relativePath = join(testFS.getPath(), "does-not-exist.txt").replace(
      process.cwd() + "/",
      ""
    );

    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("not found");
  });

  test("should return error object when trying to read directory", async () => {
    await testFS.createDir("test-dir");
    const relativePath = join(testFS.getPath(), "test-dir").replace(
      process.cwd() + "/",
      ""
    );

    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("is not a file");
  });

  test("should read file with line range", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          ""
        ),
        start_line: 2,
        end_line: 4,
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content: "Line 2\nLine 3\nLine 4" });
  });

  test("should read from start_line to end of file when end_line not specified", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    await testFS.createFile("multiline.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "multiline.txt").replace(
          process.cwd() + "/",
          ""
        ),
        start_line: 3,
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content: "Line 3\nLine 4\nLine 5" });
  });

  test("should handle edge cases with line ranges", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    await testFS.createFile("short.txt", content);
    const relativePath = join(testFS.getPath(), "short.txt").replace(
      process.cwd() + "/",
      ""
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
      }
    );
    expect(result1).toEqual({ content: "" });

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
      }
    );
    expect(result2).toEqual({ content: "Line 2\nLine 3" });

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
      }
    );
    expect(result3).toEqual({ content: "Line 2" });
  });

  test("should return outline for large files", async () => {
    // Create a large file (over 50KB)
    const largeContent = "x".repeat(60000);
    await testFS.createFile("large.txt", largeContent);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "large.txt").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain(
      "This file was too big to read all at once"
    );
    expect((result as any).content).toContain("you can call this tool again");
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
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain("File outline:");
    expect((result as any).content).toContain("hello [L");
    expect((result as any).content).toContain("MyClass [L");
    expect((result as any).content).toContain("myVar [L");
  });

  test("should return error object for absolute paths", async () => {
    const result = await readFile.execute(
      { path: "/etc/passwd" },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("absolute paths are not allowed");
  });

  test("should return error object for path traversal attempts", async () => {
    const result = await readFile.execute(
      { path: "../../../etc/passwd" },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("path traversal not allowed");
  });

  test("should return error object for excluded file patterns", async () => {
    await testFS.createDir("node_modules");
    await testFS.createFile("node_modules/package.json", "{}");

    const relativePath = join(
      testFS.getPath(),
      "node_modules/package.json"
    ).replace(process.cwd() + "/", "");

    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("file_scan_exclusions");
  });

  test("should return error object for private file patterns", async () => {
    await testFS.createFile(".env", "SECRET=123");

    const relativePath = join(testFS.getPath(), ".env").replace(
      process.cwd() + "/",
      ""
    );

    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("private_files");
  });

  test("should preserve line endings", async () => {
    const content = "Line 1\r\nLine 2\r\nLine 3";
    await testFS.createFile("windows.txt", content);

    const result = await readFile.execute(
      {
        path: join(testFS.getPath(), "windows.txt").replace(
          process.cwd() + "/",
          ""
        ),
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toEqual({ content });
  });

  test("should handle binary files gracefully", async () => {
    // Create a file with binary content
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff]);
    await Bun.write(join(testFS.getPath(), "binary.bin"), binaryContent);

    const relativePath = join(testFS.getPath(), "binary.bin").replace(
      process.cwd() + "/",
      ""
    );

    // Should not throw, but might contain replacement characters
    const result = await readFile.execute(
      { path: relativePath },
      {
        toolCallId: "test",
        messages: [],
      }
    );

    expect(result).toHaveProperty("content");
    expect(typeof (result as any).content).toBe("string");
  });

  test("should return error object for invalid line number parameters", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    await testFS.createFile("test.txt", content);
    const relativePath = join(testFS.getPath(), "test.txt").replace(
      process.cwd() + "/",
      ""
    );

    // Should work with valid line numbers
    const validResult = await readFile.execute(
      {
        path: relativePath,
        start_line: 1,
        end_line: 2,
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );
    expect(validResult).toEqual({ content: "Line 1\nLine 2" });

    // Invalid line numbers should return error objects
    const invalidResult1 = await readFile.execute(
      {
        path: relativePath,
        start_line: 0, // Invalid: less than 1
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );
    expect(invalidResult1).toHaveProperty("error");
    expect((invalidResult1 as any).error).toContain(
      "start_line must be a positive integer"
    );

    const invalidResult2 = await readFile.execute(
      {
        path: relativePath,
        start_line: -1, // Invalid: negative
      },
      {
        toolCallId: "test",
        messages: [],
      }
    );
    expect(invalidResult2).toHaveProperty("error");
    expect((invalidResult2 as any).error).toContain(
      "start_line must be a positive integer"
    );
  });

  test("should have correct tool metadata", () => {
    expect(readFile.description).toContain(
      "Reads the content of the given file"
    );
    expect(readFile.parameters).toBeDefined();
  });
});
