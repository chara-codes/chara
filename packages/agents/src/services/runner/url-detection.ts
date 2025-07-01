import { appEvents } from "../events";
import type { ProcessData } from "./types";

/**
 * URL patterns commonly found in development server output
 * Ordered by preference - local URLs first, then public URLs
 */
const LOCAL_URL_PATTERNS = [
  // Nuxt: "  ➜ Local:    http://localhost:3000/"
  /➜\s+Local:\s+(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Next.js: "- Local:        http://localhost:3000"
  /(?:Local|local):\s*(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Vite: "Local:   http://localhost:5173/"
  /Local:\s*(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Generic: "Server running on http://localhost:3000"
  /(?:running|listening|available).*?(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Serve: "   http://localhost:3000"
  /^\s+(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Serve: "Accepting connections at http://localhost:3000"
  /(?:Accepting connections at|INFO\s+).*?(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
  // Python HTTP server: "Serving HTTP on :: port 8000 (http://[::]:8000/) ..."
  /Serving HTTP on.*?\((https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\])(?::\d+)?(?:\/[^\)]*)?)\)/i,
  // Generic: "http://localhost:3000" (but not in URLs like content.nuxt.com/docs/...)
  /(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
];

const PUBLIC_URL_PATTERNS = [
  // Nuxt: "  ➜ Network:  http://192.168.1.100:3000/"
  /➜\s+Network:\s+(https?:\/\/[^\s]+)/i,
  // Next.js: "- Network:      http://192.168.1.100:3000"
  /(?:Network|network):\s*(https?:\/\/[^\s]+)/i,
];

/**
 * Remove ANSI color codes from text
 */
function stripAnsiColors(text: string): string {
  // Remove ANSI escape sequences including color codes
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

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
  // Strip ANSI color codes before processing
  const cleanChunk = stripAnsiColors(chunk);

  // First try to find local URLs
  for (const pattern of LOCAL_URL_PATTERNS) {
    const match = cleanChunk.match(pattern);
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

  // If no local URL found, try public URLs
  for (const pattern of PUBLIC_URL_PATTERNS) {
    const match = cleanChunk.match(pattern);
    if (match) {
      let detectedUrl = match[1] || match[0];
      detectedUrl = cleanupUrl(detectedUrl);

      // Validate it's a proper URL and ensure it's not a local URL
      try {
        const url = new URL(detectedUrl);
        const isLocal = [
          "localhost",
          "127.0.0.1",
          "0.0.0.0",
          "::1",
          "::",
        ].includes(url.hostname);
        if (!isLocal) {
          return detectedUrl;
        }
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
function updateProcessWithUrl(
  processData: ProcessData,
  detectedUrl: string,
): void {
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
function emitUrlDetectionEvents(
  processId: string,
  processData: ProcessData,
): void {
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
  processData: ProcessData,
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
    if (event.processId === processId && event.stream !== "stderr") {
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
