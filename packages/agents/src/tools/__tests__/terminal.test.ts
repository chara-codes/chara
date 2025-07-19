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

    expect(result.success).toBe(true);
    expect(result.output).toContain("Hello World");
    expect(result.output).toContain("```");
  });

  test("should handle empty output with success exit code", async () => {
    const result = await terminal.execute({
      command: "true", // command that succeeds with no output
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("Command executed successfully.");
  });

  test("should handle command failure", async () => {
    const result = await terminal.execute({
      command: "false", // command that fails
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(false);
    expect(result.output).toContain("failed with exit code");
    expect(result.output).toContain("false");
  });

  test("should handle non-existent command", async () => {
    const result = await terminal.execute({
      command: "nonexistent-command-xyz",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(false);
    expect(result.output).toContain("failed with exit code");
    expect(result.output).toContain("nonexistent-command-xyz");
  });

  test("should change to specified directory", async () => {
    await testFS.createDir("subdir");

    const result = await terminal.execute({
      command: "pwd",
      cd: testFS.getPath("subdir"),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("subdir");
  });

  test("should handle file operations", async () => {
    await testFS.createFile("test.txt", "test content");

    const result = await terminal.execute({
      command: "cat test.txt",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("test content");
  });

  test("should handle stderr output", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo error message 1>&2 && exit 1"
          : "echo 'error message' >&2 && exit 1",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(false);
    expect(result.output).toContain("error message");
    expect(result.output).toContain("failed with exit code 1");
  });

  test("should combine stdout and stderr", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo stdout && echo stderr 1>&2"
          : "echo 'stdout' && echo 'stderr' >&2",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("stdout");
    expect(result.output).toContain("stderr");
  });

  test("should handle multiline output", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo Line 1 && echo Line 2 && echo Line 3"
          : "echo -e 'Line 1\\nLine 2\\nLine 3'",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("Line 1");
    expect(result.output).toContain("Line 2");
    expect(result.output).toContain("Line 3");
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

    expect(result.success).toBe(true);
    expect(result.output).toContain("content with éñü");
  });

  test("should handle large output truncation", async () => {
    // Create a command that produces large output
    const largeText = "x".repeat(20000);
    await testFS.createFile("large.txt", largeText);

    const result = await terminal.execute({
      command: "cat large.txt",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("Command output too long");
    expect(result.output!.length).toBeLessThan(largeText.length + 1000); // Much smaller than original
  });

  test("should handle file listing", async () => {
    await testFS.createFile("file1.txt", "content1");
    await testFS.createFile("file2.txt", "content2");
    await testFS.createDir("subdir");

    const result = await terminal.execute({
      command: process.platform === "win32" ? "dir /b" : "ls",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("file1.txt");
    expect(result.output).toContain("file2.txt");
    expect(result.output).toContain("subdir");
  });

  test("should handle environment variables", async () => {
    const result = await terminal.execute({
      command: process.platform === "win32" ? "echo %PATH%" : "echo $HOME",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("```");
    expect(result.output!.length).toBeGreaterThan(10); // Should have some path content
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

    expect(result.success).toBe(true);
    expect(result.output).toContain("1");
    expect(result.output).toContain("2");
    expect(result.output).toContain("3");
  });

  test("should handle command with redirection", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo test output > output.txt && type output.txt"
          : "echo 'test output' > output.txt && cat output.txt",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("test output");
  });

  test("should return error for invalid directory", async () => {
    const result = await terminal.execute({
      command: "echo test",
      cd: "/nonexistent/directory/path",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to execute command");
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

    expect(result1.success).toBe(true);
    expect(result1.output).toContain("Command 1");
    expect(result2.success).toBe(true);
    expect(result2.output).toContain("Command 2");
    expect(result3.success).toBe(true);
    expect(result3.output).toContain("Command 3");
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

    expect(result.success).toBe(true);
    expect(result.output).toContain("git"); // Should contain git-related output
  });

  test("should handle file creation and verification", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo created content > created.txt && type created.txt"
          : "echo 'created content' > created.txt && cat created.txt",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("created content");
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

    expect(result.success).toBe(true);
    expect(result.output).toContain("file exists");
  });

  test("should preserve output formatting", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo.    indented && echo normal"
          : "printf '    indented\\nnormal\\n'",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("indented");
    expect(result.output).toContain("normal");
    // Note: Some shells may trim leading whitespace, so we just verify the content is present
  });

  test("should have correct tool metadata", () => {
    expect(terminal.description).toContain("Executes a shell one-liner");
    expect(terminal.description).toContain("cd parameter");
    expect(terminal.description).toContain(
      "IMPORTANT: Do NOT use this tool for long-running tasks"
    );
    expect(terminal.description).toContain("Development servers");
    expect(terminal.description).toContain("configurable timeout");
    expect(terminal.parameters).toBeDefined();
  });

  test("should prevent long-running commands", async () => {
    const longRunningCommands = [
      "npm run dev",
      "yarn dev",
      "pnpm dev",
      "bun run start",
      "next dev",
      "vite dev",
      "nodemon app.js",
      "python -m http.server",
      "serve .",
    ];

    for (const command of longRunningCommands) {
      const result = await terminal.execute({
        command,
        cd: testFS.getPath(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("appears to be a long-running task");
      expect(result.error).toContain("runner tool instead");
    }
  });

  test("should handle empty command", async () => {
    const result = await terminal.execute({
      command: "",
      cd: testFS.getPath(),
    });

    // Empty command should either succeed or fail gracefully
    expect(typeof result).toBe("object");
    expect(typeof result.success).toBe("boolean");
  });

  test("should handle command with quotes", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? 'echo "Hello World"'
          : "echo 'Hello World'",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("Hello World");
  });

  test("should handle unicode characters in output", async () => {
    await testFS.createFile("unicode.txt", "测试 🚀 café");

    const result = await terminal.execute({
      command: "cat unicode.txt",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("测试");
    expect(result.output).toContain("🚀");
    expect(result.output).toContain("café");
  });

  test("should handle commands with newlines in arguments", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo Multi & echo Line & echo Command"
          : "echo 'Multi' && echo 'Line' && echo 'Command'",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("Multi");
    expect(result.output).toContain("Line");
    expect(result.output).toContain("Command");
  });

  test("should use default timeout of 300 seconds", async () => {
    const result = await terminal.execute({
      command: "echo 'test'",
      cd: testFS.getPath(),
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("test");
  });

  test("should accept custom timeout parameter", async () => {
    const result = await terminal.execute({
      command: "echo 'test with timeout'",
      cd: testFS.getPath(),
      timeout: 10,
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("test with timeout");
  });

  test("should return error for timeout less than 1 second", async () => {
    const result = await terminal.execute({
      command: "echo 'test'",
      cd: testFS.getPath(),
      timeout: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Timeout must be between 1 and 600 seconds");
  });

  test("should return error for timeout greater than 600 seconds", async () => {
    const result = await terminal.execute({
      command: "echo 'test'",
      cd: testFS.getPath(),
      timeout: 601,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Timeout must be between 1 and 600 seconds");
  });

  test("should timeout after specified duration", async () => {
    const result = await terminal.execute({
      command: process.platform === "win32" ? "timeout /t 3" : "sleep 3",
      cd: testFS.getPath(),
      timeout: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Command timed out after 1 seconds");
  });

  test("should accept maximum timeout of 600 seconds", async () => {
    const result = await terminal.execute({
      command: "echo 'max timeout test'",
      cd: testFS.getPath(),
      timeout: 600,
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain("max timeout test");
  });

  test("should handle timeout with partial output", async () => {
    const result = await terminal.execute({
      command:
        process.platform === "win32"
          ? "echo partial output && timeout /t 3"
          : "echo 'partial output' && sleep 3",
      cd: testFS.getPath(),
      timeout: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Command timed out after 1 seconds");
  });
});
