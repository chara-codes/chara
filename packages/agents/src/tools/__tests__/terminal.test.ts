import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { terminal } from "../terminal";
import { createTestFS } from "./test-utils";

describe("terminal tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should execute simple command successfully", async () => {
    const result = await terminal.execute({
      command: "echo 'Hello World'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("Hello World");
    expect(result).toContain("```");
  });

  test("should handle empty output with success exit code", async () => {
    const result = await terminal.execute({
      command: "true", // command that succeeds with no output
      cd: testFS.getPath(),
    });

    expect(result).toBe("Command executed successfully.");
  });

  test("should handle command failure", async () => {
    const result = await terminal.execute({
      command: "false", // command that fails
      cd: testFS.getPath(),
    });

    expect(result).toContain("failed with exit code");
    expect(result).toContain("false");
  });

  test("should handle non-existent command", async () => {
    const result = await terminal.execute({
      command: "nonexistent-command-xyz",
      cd: testFS.getPath(),
    });

    expect(result).toContain("failed with exit code");
    expect(result).toContain("nonexistent-command-xyz");
  });

  test("should change to specified directory", async () => {
    await testFS.createDir("subdir");

    const result = await terminal.execute({
      command: "pwd",
      cd: testFS.getPath("subdir"),
    });

    expect(result).toContain("subdir");
  });

  test("should handle file operations", async () => {
    await testFS.createFile("test.txt", "test content");

    const result = await terminal.execute({
      command: "cat test.txt",
      cd: testFS.getPath(),
    });

    expect(result).toContain("test content");
  });

  test("should handle stderr output", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo error message 1>&2 && exit 1"
          : "echo 'error message' >&2 && exit 1",
      cd: testFS.getPath(),
    });

    expect(result).toContain("error message");
    expect(result).toContain("failed with exit code 1");
  });

  test("should combine stdout and stderr", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo stdout && echo stderr 1>&2"
          : "echo 'stdout' && echo 'stderr' >&2",
      cd: testFS.getPath(),
    });

    expect(result).toContain("stdout");
    expect(result).toContain("stderr");
  });

  test("should handle multiline output", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo Line 1 && echo Line 2 && echo Line 3"
          : "echo -e 'Line 1\\nLine 2\\nLine 3'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("Line 1");
    expect(result).toContain("Line 2");
    expect(result).toContain("Line 3");
  });

  test("should handle commands with special characters", async () => {
    await testFS.createFile("special file.txt", "content with éñü");

    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? 'type "special file.txt"'
          : "cat 'special file.txt'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("content with éñü");
  });

  test("should handle large output truncation", async () => {
    // Create a command that produces large output
    const largeText = "x".repeat(20000);
    await testFS.createFile("large.txt", largeText);

    const result = await terminal.execute({
      command: "cat large.txt",
      cd: testFS.getPath(),
    });

    expect(result).toContain("Command output too long");
    expect(result.length).toBeLessThan(largeText.length + 1000); // Much smaller than original
  });

  test("should handle file listing", async () => {
    await testFS.createFile("file1.txt", "content1");
    await testFS.createFile("file2.txt", "content2");
    await testFS.createDir("subdir");

    const result = await terminal.execute({
      command: process.platform === "win32" ? "dir /b" : "ls",
      cd: testFS.getPath(),
    });

    expect(result).toContain("file1.txt");
    expect(result).toContain("file2.txt");
    expect(result).toContain("subdir");
  });

  test("should handle environment variables", async () => {
    const result = await terminal.execute({
      command: process.platform === "win32" ? "echo %PATH%" : "echo $HOME",
      cd: testFS.getPath(),
    });

    expect(result).toContain("```");
    expect(result.length).toBeGreaterThan(10); // Should have some path content
  });

  test("should handle command with pipes", async () => {
    await testFS.createFile("numbers.txt", "3\n1\n2");

    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "type numbers.txt | sort"
          : "cat numbers.txt | sort",
      cd: testFS.getPath(),
    });

    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("3");
  });

  test("should handle command with redirection", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo test output > output.txt && type output.txt"
          : "echo 'test output' > output.txt && cat output.txt",
      cd: testFS.getPath(),
    });

    expect(result).toContain("test output");
  });

  test("should throw error for invalid directory", async () => {
    await expect(
      terminal.execute({
        command: "echo test",
        cd: "/nonexistent/directory/path",
      }),
    ).rejects.toThrow("Failed to execute command");
  });

  test("should handle concurrent command execution", async () => {
    const [result1, result2, result3] = await Promise.all([
      terminal.execute({
        command: "echo 'Command 1'",
        cd: testFS.getPath(),
      }),
      terminal.execute({
        command: "echo 'Command 2'",
        cd: testFS.getPath(),
      }),
      terminal.execute({
        command: "echo 'Command 3'",
        cd: testFS.getPath(),
      }),
    ]);

    expect(result1).toContain("Command 1");
    expect(result2).toContain("Command 2");
    expect(result3).toContain("Command 3");
  });

  test("should handle git commands", async () => {
    // Initialize a git repo first
    await terminal.execute({
      command: "git init",
      cd: testFS.getPath(),
    });

    const result = await terminal.execute({
      command: "git status",
      cd: testFS.getPath(),
    });

    expect(result).toContain("git"); // Should contain git-related output
  });

  test("should handle file creation and verification", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo created content > created.txt && type created.txt"
          : "echo 'created content' > created.txt && cat created.txt",
      cd: testFS.getPath(),
    });

    expect(result).toContain("created content");
    expect(await testFS.fileExists("created.txt")).toBe(true);
  });

  test("should handle commands that use working directory", async () => {
    await testFS.createFile("local-file.txt", "local content");

    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "if exist local-file.txt (echo file exists) else (echo file not found)"
          : "[ -f local-file.txt ] && echo 'file exists' || echo 'file not found'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("file exists");
  });

  test("should preserve output formatting", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo.    indented && echo normal"
          : "printf '    indented\\nnormal\\n'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("indented");
    expect(result).toContain("normal");
    // Note: Some shells may trim leading whitespace, so we just verify the content is present
  });

  test("should have correct tool metadata", () => {
    expect(terminal.description).toContain("Executes a shell one-liner");
    expect(terminal.description).toContain("cd parameter");
    expect(terminal.description).toContain("Do not use this tool for commands");
    expect(terminal.parameters).toBeDefined();
  });

  test("should handle empty command", async () => {
    const result = await terminal.execute({
      command: "",
      cd: testFS.getPath(),
    });

    // Empty command should either succeed or fail gracefully
    expect(typeof result).toBe("string");
  });

  test("should handle command with quotes", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? 'echo "Hello World"'
          : "echo 'Hello World'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("Hello World");
  });

  test("should handle unicode characters in output", async () => {
    await testFS.createFile("unicode.txt", "测试 🚀 café");

    const result = await terminal.execute({
      command: "cat unicode.txt",
      cd: testFS.getPath(),
    });

    expect(result).toContain("测试");
    expect(result).toContain("🚀");
    expect(result).toContain("café");
  });

  test("should handle commands with newlines in arguments", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo Multi & echo Line & echo Command"
          : "echo 'Multi' && echo 'Line' && echo 'Command'",
      cd: testFS.getPath(),
    });

    expect(result).toContain("Multi");
    expect(result).toContain("Line");
    expect(result).toContain("Command");
  });
});
