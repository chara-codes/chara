import { tool } from "ai";
import z from "zod";
import { appEvents } from "../services/events";

const COMMAND_OUTPUT_LIMIT = 16 * 1024; // 16KB limit

export const terminal = tool({
  description: `Executes a shell one-liner and returns its combined output.
  This tool launches a process in the user’s shell, capturing both stdout and stderr streams—preserving their original write order—and returns them together in a single string.
  Unless there’s a specific need to display it again, avoid redundantly listing the output since the result will already be shown to the user.
  Always use the cd parameter to switch to one of the project’s root directories; do not include directory changes directly in the shell command, or it may cause errors.
  Do not use this tool for commands that don’t terminate on their own, such as launching servers (e.g., npm run start, npm run dev, python -m http.server) or persistent file watchers.
  Each time this tool is used, it starts a new shell process—no previous state is preserved between runs.`,
  parameters: z.object({
    command: z.string().describe("The one-liner command to execute"),
    cd: z
      .string()
      .describe(
        "Working directory for the command. This must be one of the root directories of the project",
      ),
  }),
  execute: async ({ command, cd }, context) => {
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
      const timeout = 300000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Command timed out after 300 seconds")),
          timeout,
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
      const { processedContent, wasEmpty } = processContent(
        combinedOutput,
        command,
        exitCode,
      );

      return processedContent;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to execute command "${command}": ${errorMessage}`,
      );
    }
  },
});

interface ProcessContentResult {
  processedContent: string;
  wasEmpty: boolean;
}

function processContent(
  content: string,
  command: string,
  exitCode: number | null,
): ProcessContentResult {
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
      return {
        processedContent: "Command executed successfully.",
        wasEmpty: true,
      };
    }
    return {
      processedContent: formattedContent,
      wasEmpty: false,
    };
  }

  if (exitCode !== null) {
    if (isEmpty) {
      return {
        processedContent: `Command "${command}" failed with exit code ${exitCode}.`,
        wasEmpty: true,
      };
    }
    return {
      processedContent: `Command "${command}" failed with exit code ${exitCode}.\n\n${formattedContent}`,
      wasEmpty: false,
    };
  }

  return {
    processedContent: `Command failed or was interrupted.\nPartial output captured:\n\n${formattedContent}`,
    wasEmpty: isEmpty,
  };
}
