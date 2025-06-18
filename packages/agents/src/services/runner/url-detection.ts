import { appEvents } from "../events.js";
import type { ProcessData } from "./types.js";

/**
 * URL patterns commonly found in development server output
 */
const URL_PATTERNS = [
  // Next.js: "- Local:        http://localhost:3000"
  /(?:Local|local):\s*(?:https?:\/\/[^\s]+)/i,
  // Vite: "Local:   http://localhost:5173/"
  /Local:\s*(https?:\/\/[^\s]+)/i,
  // Generic: "Server running on http://localhost:3000"
  /(?:running|listening|available).*?(https?:\/\/[^\s\)]+)/i,
  // Serve: "   http://localhost:3000"
  /^\s+(https?:\/\/[^\s]+)/i,
  // Serve: "Accepting connections at http://localhost:3000"
  /(?:Accepting connections at|INFO\s+).*?(https?:\/\/[^\s\)]+)/i,
  // Python HTTP server: "Serving HTTP on :: port 8000 (http://[::]:8000/) ..."
  /Serving HTTP on.*?\((https?:\/\/[^\)]+)\)/i,
  // Generic: "http://localhost:3000"
  /(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Webpack dev server: "webpack compiled with 1 warning" followed by URL
  /(https?:\/\/[^\s]+)/i,
];

/**
 * Clean up detected URL by removing trailing characters
 */
function cleanupUrl(url: string): string {
  return url.replace(/[\)\],\s'"]*$/, "");
}

/**
 * Extract host and port from URL
 */
function extractHostAndPort(url: URL): { host: string; port: number } {
  const host = url.hostname;
  const port = url.port
    ? parseInt(url.port, 10)
    : url.protocol === "https:"
      ? 443
      : 80;

  return { host, port };
}

/**
 * Detect URL from process output chunk
 */
function detectUrlFromChunk(chunk: string): string | null {
  for (const pattern of URL_PATTERNS) {
    const match = chunk.match(pattern);
    if (match) {
      let detectedUrl = match[1] || match[0];
      detectedUrl = cleanupUrl(detectedUrl);

      // Validate it's a proper URL
      try {
        new URL(detectedUrl);
        return detectedUrl;
      } catch {
        // Invalid URL, continue searching
      }
    }
  }
  return null;
}

/**
 * Update process data with detected URL information
 */
function updateProcessWithUrl(processData: ProcessData, detectedUrl: string): void {
  try {
    const url = new URL(detectedUrl);
    const { host, port } = extractHostAndPort(url);

    processData.info.serverUrl = detectedUrl;
    processData.info.host = host;
    processData.info.port = port;
  } catch (error) {
    // Should not happen as URL was already validated, but just in case
    console.warn("Failed to parse validated URL:", detectedUrl, error);
  }
}

/**
 * Emit events when URL is detected
 */
function emitUrlDetectionEvents(processId: string, processData: ProcessData): void {
  // Emit updated server info
  appEvents.emit("runner:started", {
    processId,
    serverInfo: {
      name: processData.info.name,
      command: processData.info.command,
      cwd: processData.info.cwd,
      pid: processData.info.pid!,
      serverUrl: processData.info.serverUrl,
      host: processData.info.host,
      port: processData.info.port,
      os: processData.info.os,
      shell: processData.info.shell,
      startTime: processData.info.startTime!,
    },
  });

  // Also emit status update with URL
  appEvents.emit("runner:status", {
    processId,
    status: processData.info.status,
    serverInfo: {
      name: processData.info.name,
      command: processData.info.command,
      cwd: processData.info.cwd,
      pid: processData.info.pid,
      uptime: processData.info.uptime,
      serverUrl: processData.info.serverUrl,
      host: processData.info.host,
      port: processData.info.port,
    },
  });
}

/**
 * Setup URL detection from process output
 */
export function setupUrlDetection(
  processId: string,
  processData: ProcessData
): void {
  // Create URL detection handler
  const detectUrl = (chunk: string) => {
    const detectedUrl = detectUrlFromChunk(chunk);
    if (detectedUrl) {
      updateProcessWithUrl(processData, detectedUrl);
      emitUrlDetectionEvents(processId, processData);
    }
  };

  // Intercept output events for this process
  const outputHandler = (event: any) => {
    if (event.processId === processId) {
      detectUrl(event.chunk);
    }
  };

  appEvents.on("runner:output", outputHandler);

  // Clean up handler when process stops
  const stopHandler = (event: any) => {
    if (event.processId === processId) {
      appEvents.off("runner:output", outputHandler);
      appEvents.off("runner:stopped", stopHandler);
    }
  };

  appEvents.on("runner:stopped", stopHandler);
}
