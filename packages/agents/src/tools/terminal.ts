import { tool } from "ai";
import z from "zod";
import { appEvents } from "../services/events";

const COMMAND_OUTPUT_LIMIT = 16 * 1024; // 16KB limit

interface TerminalResult {
  success: boolean;
  output?: string;
  error?: string;
}

export const terminal = tool({
  description: `Executes a shell one-liner and returns its combined output.
  This tool launches a process in the user's shell, capturing both stdout and stderr streams—preserving their original write order—and returns them together in a single string.
  Unless there's a specific need to display it again, avoid redundantly listing the output since the result will already be shown to the user.
  Always use the cd parameter to switch to one of the project's root directories; do not include directory changes directly in the shell command, or it may cause errors.

  IMPORTANT: Do NOT use this tool for long-running tasks or commands that don't terminate on their own, including:
  - Development servers (npm run dev, npm run start, yarn dev, pnpm dev)
  - Production servers (python -m http.server, serve, etc.)
  - File watchers (webpack --watch, nodemon, etc.)
  - Interactive commands requiring user input
  - Any process that runs indefinitely

  This tool has a configurable timeout (default 1 minute, maximum 10 minutes) and is designed only for quick, finite operations like building, testing, installing packages, or running one-time scripts.
  Each time this tool is used, it starts a new shell process—no previous state is preserved between runs.`,
  parameters: z.object({
    command: z.string().describe("The one-liner command to execute"),
    cd: z
      .string()
      .describe(
        "Working directory for the command. This must be one of the root directories of the project"
      ),
    timeout: z
      .number()
      .optional()
      .describe(
        "Timeout in seconds for command execution. Defaults to 60 seconds (1 minute). Must be between 1 and 600 seconds (10 minutes maximum). Commands that exceed this timeout will be terminated and return an error."
      ),
  }),
  execute: async (
    { command, cd, timeout = 60 },
    context
  ): Promise<TerminalResult> => {
    // Validate timeout parameter
    if (timeout < 1 || timeout > 600) {
      return {
        success: false,
        error:
          "Timeout must be between 1 and 600 seconds (10 minutes maximum).",
      };
    }
    // Validate command to prevent long-running tasks
    const longRunningPatterns = [
      /\b(npm|yarn|pnpm|bun)\s+(run\s+)?(dev|start|serve)\b/,
      /\b(next|nuxt|vite|webpack-dev-server)\s+(dev|start)\b/,
      /\b(nodemon|pm2\s+start)\b/,
      /\b(webpack\s+--watch|rollup\s+--watch)\b/,
      /\b(python\s+-m\s+http\.server|serve|http-server)\b/,
      /\b(rails\s+server|ruby\s+server)\b/,
      /\b(php\s+-S)\b/,
      /\b(docker\s+run\s+(?!.*--rm))/,
    ];

    const trimmedCommand = command.trim();
    for (const pattern of longRunningPatterns) {
      if (pattern.test(trimmedCommand)) {
        return {
          success: false,
          error:
            `Command "${command}" appears to be a long-running task (dev server, file watcher, etc.) which is not supported by this tool. ` +
            `This tool is designed for quick, finite operations only. ` +
            `If you need to start a development server, please use the runner tool instead to examine and manage running processes.`,
        };
      }
    }

    try {
      // Determine shell based on platform
      const shell = process.platform === "win32" ? "cmd" : "/bin/bash";
      const shellArgs = process.platform === "win32" ? ["/c"] : ["-c"];

      // Format command based on platform
      let formattedCommand: string;
      if (process.platform === "win32") {
        formattedCommand = `cd /d "${cd}" && ${command}`;
      } else {
        formattedCommand = `cd "${cd}" && ${command}`;
      }

      // Spawn the process
      const proc = Bun.spawn([shell, ...shellArgs, formattedCommand], {
        cwd: cd,
        stdout: "pipe",
        stderr: "pipe",
        stdin: "pipe",
        env: {
          ...process.env,
          // Prevent interactive prompts
          PAGER: "cat",
          DEBIAN_FRONTEND: "noninteractive",
        },
      });

      // Close stdin to prevent hanging on interactive commands
      proc.stdin.end();

      // Stream output with timeout
      const timeoutMs = timeout * 1000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Command timed out after ${timeout} seconds`)),
          timeoutMs
        );
      });

      // Create readable streams for stdout and stderr
      const stdoutReader = proc.stdout.getReader();
      const stderrReader = proc.stderr.getReader();

      let stdout = "";
      let stderr = "";
      let combinedOutput = "";

      // Stream stdout
      const stdoutPromise = (async () => {
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await stdoutReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            stdout += chunk;
            combinedOutput += chunk;

            // Emit stdout chunk
            appEvents.emit("tool:calling", {
              name: "terminal",
              toolCallId: context?.toolCallId || "unknown",
              data: {
                type: "stdout",
                chunk,
                command,
                cd,
              },
            });
          }
        } finally {
          stdoutReader.releaseLock();
        }
      })();

      // Stream stderr
      const stderrPromise = (async () => {
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await stderrReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            stderr += chunk;
            combinedOutput += chunk;

            // Emit stderr chunk
            appEvents.emit("tool:calling", {
              name: "terminal",
              toolCallId: context?.toolCallId || "unknown",
              data: {
                type: "stderr",
                chunk,
                command,
                cd,
              },
            });
          }
        } finally {
          stderrReader.releaseLock();
        }
      })();

      // Wait for both streams to complete
      await Promise.race([
        Promise.all([stdoutPromise, stderrPromise]),
        timeoutPromise,
      ]);

      const exitCode = await proc.exited;

      // Emit completion event
      appEvents.emit("tool:calling", {
        name: "terminal",
        toolCallId: context?.toolCallId || "unknown",
        data: {
          type: "complete",
          exitCode,
          command,
          cd,
        },
      });

      // Process the output
      const processedContent = processContent(
        combinedOutput,
        command,
        exitCode
      );

      return {
        success: exitCode === 0,
        output: processedContent,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to execute command "${command}": ${errorMessage}`,
      };
    }
  },
});

function processContent(
  content: string,
  command: string,
  exitCode: number | null
): string {
  const shouldTruncate = content.length > COMMAND_OUTPUT_LIMIT;

  let processedContent = content;
  if (shouldTruncate) {
    let endIndex = COMMAND_OUTPUT_LIMIT;
    // Don't truncate in the middle of a UTF-8 character
    while (endIndex > 0 && (content.charCodeAt(endIndex) & 0xc0) === 0x80) {
      endIndex--;
    }
    // Don't truncate mid-line, find the last newline
    const lastNewline = content.lastIndexOf("\n", endIndex);
    if (lastNewline > 0) {
      endIndex = lastNewline;
    }
    processedContent = content.slice(0, endIndex);
  }

  processedContent = processedContent.trim();
  const isEmpty = processedContent.length === 0;

  // Format output in code block
  let formattedContent = processedContent
    ? `\`\`\`\n${processedContent}\n\`\`\``
    : "";

  if (shouldTruncate) {
    formattedContent = `Command output too long. The first ${processedContent.length} bytes:\n\n${formattedContent}`;
  }

  // Handle exit codes
  if (exitCode === 0) {
    if (isEmpty) {
      return "Command executed successfully.";
    }
    return formattedContent;
  }

  if (exitCode !== null) {
    if (isEmpty) {
      return `Command "${command}" failed with exit code ${exitCode}.`;
    }
    return `Command "${command}" failed with exit code ${exitCode}.\n\n${formattedContent}`;
  }
  return `Command failed or was interrupted.\nPartial output captured:\n\n${formattedContent}`;
}
