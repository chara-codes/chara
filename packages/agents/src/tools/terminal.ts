import { tool } from "ai";
import z from "zod";

const COMMAND_OUTPUT_LIMIT = 16 * 1024; // 16KB limit

export const terminal = tool({
  description: `Executes a shell one-liner and returns the combined output.

This tool spawns a process using the user's shell, reads from stdout and stderr (preserving the order of writes), and returns a string with the combined output result.

The output results will be shown to the user already, only list it again if necessary, avoid being redundant.

Make sure you use the cd parameter to navigate to one of the root directories of the project. NEVER do it as part of the command itself, otherwise it will error.

Do not use this tool for commands that run indefinitely, such as servers (like npm run start, npm run dev, python -m http.server, etc) or file watchers that don't terminate on their own.

Remember that each invocation of this tool will spawn a new shell process, so you can't rely on any state from previous invocations.`,
  parameters: z.object({
    command: z.string().describe("The one-liner command to execute"),
    cd: z
      .string()
      .describe(
        "Working directory for the command. This must be one of the root directories of the project",
      ),
  }),
  execute: async ({ command, cd }) => {
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

      // Read output with timeout
      const timeout = 30000; // 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Command timed out after 30 seconds")),
          timeout,
        );
      });

      const outputPromise = Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      const [stdout, stderr] = await Promise.race([
        outputPromise,
        timeoutPromise,
      ]);
      const exitCode = await proc.exited;

      // Combine stdout and stderr
      let combinedOutput = "";
      if (stdout.trim()) {
        combinedOutput += stdout;
      }
      if (stderr.trim()) {
        if (combinedOutput) combinedOutput += "\n";
        combinedOutput += stderr;
      }

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
