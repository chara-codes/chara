import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { readFile } from "../read-file";

// Mock filesystem data structure
interface MockFileSystemNode {
  type: "file" | "directory";
  content?: string;
  size?: number;
}

class MockFileSystem {
  private fs: Map<string, MockFileSystemNode> = new Map();
  private cwd: string = "/test-project";

  constructor() {
    this.reset();
  }

  reset(): void {
    this.fs.clear();
    // Create root directory and test project directory
    this.fs.set("/", { type: "directory" });
    this.fs.set("/test-project", { type: "directory" });
  }

  private normalizePath(path: string): string {
    if (path.startsWith("/")) return path;
    return `${this.cwd}/${path}`.replace(/\/+/g, "/");
  }

  createFile(path: string, content: string = ""): void {
    const normalizedPath = this.normalizePath(path);
    this.fs.set(normalizedPath, {
      type: "file",
      content,
      size: Buffer.byteLength(content, "utf8"),
    });
  }

  createDir(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.fs.set(normalizedPath, { type: "directory" });
  }

  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.fs.has(normalizedPath);
  }

  getFile(path: string): MockFileSystemNode | null {
    const normalizedPath = this.normalizePath(path);
    return this.fs.get(normalizedPath) || null;
  }

  getTestPath(): string {
    return this.cwd;
  }

  // Generate relative path from test directory
  getRelativePath(filename: string): string {
    return filename;
  }
}

// Global mock filesystem instance
const mockFS = new MockFileSystem();

describe("readFile tool", () => {
  let readFileSpy: any;
  let statSpy: any;
  let cwdSpy: any;

  beforeEach(async () => {
    mockFS.reset();

    // Import the modules to spy on
    const fsPromises = await import("node:fs/promises");
    const process = await import("node:process");

    // Setup filesystem spies
    readFileSpy = spyOn(fsPromises, "readFile").mockImplementation(
      (path: string, encoding?: string) => {
        const normalizedPath =
          typeof path === "string" ? path : path.toString();
        const file = mockFS.getFile(normalizedPath);

        if (!file) {
          const error: NodeJS.ErrnoException = new Error(
            `ENOENT: no such file or directory, open '${normalizedPath}'`
          );
          error.code = "ENOENT";
          throw error;
        }

        if (file.type === "directory") {
          const error: NodeJS.ErrnoException = new Error(
            `EISDIR: illegal operation on a directory, read`
          );
          error.code = "EISDIR";
          throw error;
        }

        return Promise.resolve(file.content || "");
      }
    );

    statSpy = spyOn(fsPromises, "stat").mockImplementation((path: string) => {
      const normalizedPath = typeof path === "string" ? path : path.toString();
      const file = mockFS.getFile(normalizedPath);

      if (!file) {
        const error: NodeJS.ErrnoException = new Error(
          `ENOENT: no such file or directory, stat '${normalizedPath}'`
        );
        error.code = "ENOENT";
        throw error;
      }

      return Promise.resolve({
        isFile: () => file.type === "file",
        isDirectory: () => file.type === "directory",
        size: file.size || 0,
      });
    });

    // Mock process.cwd to return our test directory
    cwdSpy = spyOn(process, "cwd").mockReturnValue(mockFS.getTestPath());
  });

  afterEach(() => {
    // Restore all spies
    readFileSpy?.mockRestore();
    statSpy?.mockRestore();
    cwdSpy?.mockRestore();
  });

  test("should read file content successfully", async () => {
    const content = "Hello, World!";
    mockFS.createFile("test.txt", content);

    const result = await readFile.execute({
      path: "test.txt",
    });

    expect(result).toEqual({ content });
  });

  test("should read empty file", async () => {
    mockFS.createFile("empty.txt", "");

    const result = await readFile.execute({
      path: "empty.txt",
    });

    expect(result).toEqual({ content: "" });
  });

  test("should read file with special characters", async () => {
    const content = "Special chars: éñü 🚀 \n\t<>&\"'";
    mockFS.createFile("special.txt", content);

    const result = await readFile.execute({
      path: "special.txt",
    });

    expect(result).toEqual({ content });
  });

  test("should read multiline file", async () => {
    const content = "Line 1\nLine 2\nLine 3\n";
    mockFS.createFile("multiline.txt", content);

    const result = await readFile.execute({
      path: "multiline.txt",
    });

    expect(result).toEqual({ content });
  });

  test("should read JSON file", async () => {
    const content = '{"name": "test", "value": 123}';
    mockFS.createFile("data.json", content);

    const result = await readFile.execute({
      path: "data.json",
    });

    expect(result).toEqual({ content });
  });

  test("should return error object for non-existent file", async () => {
    const result = await readFile.execute({
      path: "does-not-exist.txt",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("not found");
  });

  test("should return error object when trying to read directory", async () => {
    mockFS.createDir("test-dir");

    const result = await readFile.execute({
      path: "test-dir",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("is not a file");
  });

  test("should read file with line range", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    mockFS.createFile("multiline.txt", content);

    const result = await readFile.execute({
      path: "multiline.txt",
      start_line: 2,
      end_line: 4,
    });

    expect(result).toEqual({ content: "Line 2\nLine 3\nLine 4" });
  });

  test("should read from start_line to end of file when end_line not specified", async () => {
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    mockFS.createFile("multiline.txt", content);

    const result = await readFile.execute({
      path: "multiline.txt",
      start_line: 3,
    });

    expect(result).toEqual({ content: "Line 3\nLine 4\nLine 5" });
  });

  test("should handle edge cases with line ranges", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    mockFS.createFile("short.txt", content);

    // start_line beyond file length should return empty
    const result1 = await readFile.execute({
      path: "short.txt",
      start_line: 10,
    });
    expect(result1).toEqual({ content: "" });

    // end_line beyond file length should read to end
    const result2 = await readFile.execute({
      path: "short.txt",
      start_line: 2,
      end_line: 10,
    });
    expect(result2).toEqual({ content: "Line 2\nLine 3" });

    // single line read
    const result3 = await readFile.execute({
      path: "short.txt",
      start_line: 2,
      end_line: 2,
    });
    expect(result3).toEqual({ content: "Line 2" });
  });

  test("should return outline for large files", async () => {
    // Create a large file (over 50KB)
    const largeContent = "x".repeat(60000);
    mockFS.createFile("large.txt", largeContent);

    const result = await readFile.execute({
      path: "large.txt",
    });

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

  method() {
    return "test";
  }
}

const myVar = 42;

interface TestInterface {
  prop: string;
}

type TestType = string | number;

enum TestEnum {
  A, B, C
}
`;
    // Make it large enough to trigger outline
    const largeJsContent = jsContent.repeat(500);
    mockFS.createFile("code.js", largeJsContent);

    const result = await readFile.execute({
      path: "code.js",
    });

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain("File outline:");
    expect((result as any).content).toContain("hello [L");
    expect((result as any).content).toContain("MyClass [L");
    expect((result as any).content).toContain("myVar [L");
  });

  test("should return error object for absolute paths", async () => {
    const result = await readFile.execute({
      path: "/etc/passwd",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("absolute paths are not allowed");
  });

  test("should return error object for path traversal attempts", async () => {
    const result = await readFile.execute({
      path: "../../../etc/passwd",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("path traversal not allowed");
  });

  test("should return error object for excluded file patterns", async () => {
    // Test patterns that should be blocked (no need to create files since validation happens first)

    // Test node_modules pattern (matches **/node_modules/**)
    const result1 = await readFile.execute({
      path: "project/node_modules/package.json",
    });
    expect(result1).toHaveProperty("error");
    expect((result1 as any).error).toContain("file_scan_exclusions");

    // Test .git pattern (matches **/.git/**)
    const result2 = await readFile.execute({
      path: "project/.git/config",
    });
    expect(result2).toHaveProperty("error");
    expect((result2 as any).error).toContain("file_scan_exclusions");

    // Test dist pattern (matches **/dist/**)
    const result3 = await readFile.execute({
      path: "project/dist/bundle.js",
    });
    expect(result3).toHaveProperty("error");
    expect((result3 as any).error).toContain("file_scan_exclusions");

    // Test build pattern (matches **/build/**)
    const result4 = await readFile.execute({
      path: "project/build/index.html",
    });
    expect(result4).toHaveProperty("error");
    expect((result4 as any).error).toContain("file_scan_exclusions");
  });

  test("should return error object for private file patterns", async () => {
    // Test patterns that should be blocked (no need to create files since validation happens first)

    // Test .env pattern (matches **/.env)
    const result1 = await readFile.execute({
      path: "project/.env",
    });
    expect(result1).toHaveProperty("error");
    expect((result1 as any).error).toContain("private_files");

    // Test .env.local pattern (matches **/.env.*)
    const result2 = await readFile.execute({
      path: "project/.env.local",
    });
    expect(result2).toHaveProperty("error");
    expect((result2 as any).error).toContain("private_files");

    // Test key file pattern (matches **/*.key)
    const result3 = await readFile.execute({
      path: "project/cert.key",
    });
    expect(result3).toHaveProperty("error");
    expect((result3 as any).error).toContain("private_files");

    // Test SSH key pattern (matches **/.ssh/**)
    const result4 = await readFile.execute({
      path: "project/.ssh/id_rsa",
    });
    expect(result4).toHaveProperty("error");
    expect((result4 as any).error).toContain("private_files");

    // Test secrets directory pattern (matches **/secrets/**)
    const result5 = await readFile.execute({
      path: "project/secrets/api-key.txt",
    });
    expect(result5).toHaveProperty("error");
    expect((result5 as any).error).toContain("private_files");
  });

  test("should preserve line endings", async () => {
    const content = "Line 1\r\nLine 2\r\nLine 3";
    mockFS.createFile("windows.txt", content);

    const result = await readFile.execute({
      path: "windows.txt",
    });

    expect(result).toEqual({ content });
  });

  test("should handle binary files gracefully", async () => {
    // Create a file with binary-like content (non-UTF8 characters)
    const binaryContent = "Hello\x00World\x01\x02\x03\xFF";
    mockFS.createFile("binary.bin", binaryContent);

    // Should not throw, but might contain replacement characters
    const result = await readFile.execute({
      path: "binary.bin",
    });

    expect(result).toHaveProperty("content");
    expect(typeof (result as any).content).toBe("string");
  });

  test("should return error object for invalid line number parameters", async () => {
    const content = "Line 1\nLine 2\nLine 3";
    mockFS.createFile("test.txt", content);

    // Should work with valid line numbers
    const validResult = await readFile.execute({
      path: "test.txt",
      start_line: 1,
      end_line: 2,
    });
    expect(validResult).toEqual({ content: "Line 1\nLine 2" });

    // Invalid line numbers should return error objects
    const invalidResult1 = await readFile.execute({
      path: "test.txt",
      start_line: 0, // Invalid: less than 1
    });
    expect(invalidResult1).toHaveProperty("error");
    expect((invalidResult1 as any).error).toContain(
      "start_line must be a positive integer"
    );

    const invalidResult2 = await readFile.execute({
      path: "test.txt",
      start_line: -1, // Invalid: negative
    });
    expect(invalidResult2).toHaveProperty("error");
    expect((invalidResult2 as any).error).toContain(
      "start_line must be a positive integer"
    );
  });

  test("should handle permission errors gracefully", async () => {
    mockFS.createFile("restricted.txt", "secret content");

    // Mock readFile to throw permission error
    readFileSpy.mockImplementationOnce(() => {
      const error: NodeJS.ErrnoException = new Error(
        "EACCES: permission denied"
      );
      error.code = "EACCES";
      throw error;
    });

    const result = await readFile.execute({
      path: "restricted.txt",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("Permission denied");
  });

  test("should handle unicode filenames", async () => {
    const content = "Unicode content: 测试内容";
    mockFS.createFile("测试文件.txt", content);

    const result = await readFile.execute({
      path: "测试文件.txt",
    });

    expect(result).toEqual({ content });
  });

  test("should handle files in nested directories", async () => {
    const content = "Nested file content";
    mockFS.createDir("src");
    mockFS.createDir("src/components");
    mockFS.createFile("src/components/Button.tsx", content);

    const result = await readFile.execute({
      path: "src/components/Button.tsx",
    });

    expect(result).toEqual({ content });
  });

  test("should handle markdown outline generation", async () => {
    const markdownContent = `
# Main Title

Some content here.

## Section 1

More content.

### Subsection 1.1

Even more content.

## Section 2

Final content.
`.repeat(1000); // Make it large enough for outline

    mockFS.createFile("README.md", markdownContent);

    const result = await readFile.execute({
      path: "README.md",
    });

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain("File outline:");
    expect((result as any).content).toContain("Main Title [L");
    expect((result as any).content).toContain("Section 1 [L");
    expect((result as any).content).toContain("Section 2 [L");
  });

  test("should handle python code outline", async () => {
    const pythonContent = `
def main_function():
    return "hello"

class TestClass:
    def __init__(self):
        pass

    def method(self):
        return "test"

def another_function():
    pass
`.repeat(800); // Make it large enough for outline

    mockFS.createFile("script.py", pythonContent);

    const result = await readFile.execute({
      path: "script.py",
    });

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain("File outline:");
    expect((result as any).content).toContain("main_function [L");
    expect((result as any).content).toContain("TestClass [L");
    expect((result as any).content).toContain("another_function [L");
  });

  test("should handle rust code outline", async () => {
    const rustContent = `
pub fn public_function() -> String {
    String::from("hello")
}

fn private_function() {
    println!("private");
}

pub struct TestStruct {
    field: i32,
}

pub enum TestEnum {
    Variant1,
    Variant2,
}

pub mod test_module {
    pub fn nested_function() {}
}
`.repeat(600); // Make it large enough for outline

    mockFS.createFile("main.rs", rustContent);

    const result = await readFile.execute({
      path: "main.rs",
    });

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain("File outline:");
    expect((result as any).content).toContain("public_function [L");
    expect((result as any).content).toContain("TestStruct [L");
    expect((result as any).content).toContain("TestEnum [L");
    expect((result as any).content).toContain("test_module [L");
  });

  test("should handle file with no recognizable symbols", async () => {
    const plainContent = `
This is just a plain text file.
It has no code symbols or recognizable patterns.
Just some regular text content.
Nothing special here.
`.repeat(2000); // Make it large enough for outline

    mockFS.createFile("plain.txt", plainContent);

    const result = await readFile.execute({
      path: "plain.txt",
    });

    expect(result).toHaveProperty("content");
    expect((result as any).content).toContain(
      "This file was too big to read all at once"
    );
    expect((result as any).content).toContain(
      "no recognizable symbols were found"
    );
  });

  test("should return error for missing path parameter", async () => {
    const result = await readFile.execute({
      path: "",
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error).toContain("Path is required");
  });

  test("should have correct tool metadata", () => {
    expect(readFile.description).toContain(
      "Reads the content of the given file"
    );
    expect(readFile.parameters).toBeDefined();
  });
});
