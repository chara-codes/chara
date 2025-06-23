import { tool } from "ai";
import z from "zod";
import { runnerService } from "../services/runner/index.js";
import type { LogEntry } from "../services/runner/types.js";

export const runner = tool({
  description: `Diagnostic tool for getting fresh logs from a running development server.

  This tool helps diagnose issues with running processes by:
  1. Getting the server URL for the specified process
  2. Capturing current logs
  3. Making an HTTP call to the server to trigger activity
  4. Capturing new logs after the HTTP call
  5. Returning only the fresh logs that were generated after the HTTP call

  This is useful for debugging server responses, checking if a server is responding correctly,
  and getting real-time logs from development servers.`,
  parameters: z.object({
    processId: z.string().describe("The ID of the process to get logs from"),
    endpoint: z
      .string()
      .default("/")
      .describe("The endpoint to call on the server (default: '/')"),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
      .default("GET")
      .describe("HTTP method to use for the request"),
    timeout: z
      .number()
      .int()
      .positive()
      .max(30000)
      .default(10000)
      .describe("Request timeout in milliseconds (max 30 seconds)"),
  }),
  execute: async ({
    processId,
    endpoint = "/",
    method = "GET",
    timeout = 10000,
  }) => {
    try {
      // Step 1: Get server info
      const serverInfo = runnerService.getServerInfo(processId);
      if (!serverInfo) {
        return `Error: Process with ID '${processId}' not found. Use the terminal tool to list running processes.`;
      }

      if (serverInfo.status !== "active") {
        return `Error: Process '${processId}' is not active. Current status: ${serverInfo.status}`;
      }

      if (!serverInfo.serverUrl) {
        return `Error: No server URL found for process '${processId}'. The process might not be a web server.`;
      }

      // Step 2: Get current logs (before HTTP call)
      const logsBefore = runnerService.getProcessLogs(processId);
      const logsBeforeCount = logsBefore.length;

      // Step 3: Make HTTP call to the server
      const url = `${serverInfo.serverUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
      let httpCallResult: string;

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "User-Agent": "Chara-Runner-Diagnostic-Tool/1.0",
            Accept: "text/html,application/json,*/*",
          },
          signal: AbortSignal.timeout(timeout),
        });

        httpCallResult = `HTTP ${method} ${url} - Status: ${response.status} ${response.statusText}`;

        // Try to get response body for additional context (limit to 500 chars)
        try {
          const responseText = await response.text();
          if (responseText.length > 0) {
            const truncatedResponse =
              responseText.length > 500
                ? responseText.substring(0, 500) + "..."
                : responseText;
            httpCallResult += `\nResponse body: ${truncatedResponse}`;
          }
        } catch {
          // Ignore response body read errors
        }
      } catch (error) {
        if (error instanceof Error) {
          httpCallResult = `HTTP ${method} ${url} - Error: ${error.message}`;
        } else {
          httpCallResult = `HTTP ${method} ${url} - Unknown error occurred`;
        }
      }

      // Step 4: Get logs after HTTP call
      const logsAfter = runnerService.getProcessLogs(processId);

      // Step 5: Extract only fresh logs (logs that were added after the HTTP call)
      const freshLogs = logsAfter.slice(logsBeforeCount);

      // Format the result
      let result = `Runner Diagnostic for Process: ${processId}\n`;
      result += `Server: ${serverInfo.name} (${serverInfo.status})\n`;
      result += `URL: ${serverInfo.serverUrl}\n`;
      result += `Uptime: ${serverInfo.uptime ? Math.round(serverInfo.uptime / 1000) : "unknown"} seconds\n\n`;

      result += `HTTP Call Result:\n${httpCallResult}\n\n`;

      if (freshLogs.length === 0) {
        result += `No new logs generated from the HTTP call.`;
      } else {
        result += `Fresh Logs (${freshLogs.length} new entries):\n`;
        result += freshLogs
          .map((log: LogEntry) => {
            const timestamp = log.timestamp.toISOString();
            const type = log.type.toUpperCase();
            return `[${timestamp}] ${type}: ${log.content}`;
          })
          .join("\n");
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        return `Error running diagnostic: ${error.message}`;
      }
      return `Unknown error occurred while running diagnostic`;
    }
  },
});
