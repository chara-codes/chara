import { logger } from "@chara-codes/logger";
import { intro, outro, spinner } from "../utils/prompts";
import { bold, cyan, green } from "picocolors";
import { existsSync, statSync } from "fs";
import { join, extname, resolve } from "path";
import type { ServeStaticActionOptions } from "./types";
import type { Server } from "bun";

// Check if a value is an HTML import (Response object from Bun.serve)
function isHTMLImport(value: unknown): value is Response {
  return (
    value instanceof Response ||
    (value !== null &&
      typeof value === "object" &&
      "body" in value &&
      "headers" in value)
  );
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".map": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

/**
 * Serve static HTML, CSS, and JavaScript files with optional bundling support
 *
 * @param options Configuration options for the static server
 * @param options.port Port to start server on (default: 3000)
 * @param options.directory Directory to serve files from (default: current directory)
 * @param options.directories Object mapping URL prefixes to directory paths (overrides directory option)
 *   - Use {"/" : "path/to/main", "/admin": "path/to/admin"} to serve multiple directories
 *   - URL prefixes should start with "/" and map to absolute or relative directory paths
 *   - Longest prefixes are matched first for specificity
 *   - Can also accept HTML imports: import app from "./index.html"; then {"/": app}
 * @param options.index Index file to serve for directory requests (default: "index.html")
 * @param options.host Host to bind to (default: "localhost")
 * @param options.cors Enable CORS headers (default: true)
 * @param options.development Enable development mode with hot reloading and source maps
 * @param options.bundling Configure bundling options for HTML imports
 * @param options.plugins Array of plugin paths for bundling
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @returns Promise resolving to server instance and port
 *
 * @example
 * ```typescript
 * // Start static server with custom configuration
 * const { server, port } = await serveStaticAction({
 *   port: 3000,
 *   directory: "./dist",
 *   index: "index.html",
 *   verbose: true
 * });
 *
 * // Start static server with multiple directories
 * const { server, port } = await serveStaticAction({
 *   port: 3000,
 *   directories: {
 *     "/": "./public",           // Serves ./public/* at http://localhost:3000/*
 *     "/admin": "./admin-dist",  // Serves ./admin-dist/* at http://localhost:3000/admin/*
 *     "/api": "./api-docs"       // Serves ./api-docs/* at http://localhost:3000/api/*
 *   },
 *   verbose: true
 * });
 *
 * // Start static server with HTML imports
 * import dashboard from "./dashboard.html";
 * const { server, port } = await serveStaticAction({
 *   port: 3000,
 *   directories: {
 *     "/": dashboard,            // HTML import (Response object)
 *     "/public": "./public"      // Regular directory
 *   },
 *   development: true,
 *   verbose: true
 * });
 * ```
 */
export async function serveStaticAction(
  options: ServeStaticActionOptions = {}
): Promise<{ server: Server; port: number; url: string }> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    intro(bold(cyan("🌐 Starting Static File Server")));
  }

  const port = options.port || 3000;
  const host = options.host || "localhost";
  const indexFile = options.index || "index.html";
  const cors = options.cors ?? true;
  const development =
    typeof options.development === "boolean"
      ? options.development
      : options.development?.hmr !== false;

  // Setup directory mapping and HTML imports
  const directoryMap: Record<string, string> = {};
  const htmlImports: Record<string, Response> = {};

  if (options.directories) {
    for (const [prefix, dirOrImport] of Object.entries(options.directories)) {
      if (isHTMLImport(dirOrImport)) {
        // Store HTML import (Response object)
        htmlImports[prefix] = dirOrImport;
      } else if (typeof dirOrImport === "string") {
        // Regular directory or file path
        directoryMap[prefix] = resolve(dirOrImport);
      }
    }
  } else {
    const serveDirectory = resolve(options.directory || process.cwd());
    directoryMap["/"] = serveDirectory;
  }

  // Validate directories exist (skip HTML manifests)
  for (const [prefix, dir] of Object.entries(directoryMap)) {
    if (!existsSync(dir)) {
      const errorMessage = `Directory does not exist for prefix '${prefix}': ${dir}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (!statSync(dir).isDirectory()) {
      const errorMessage = `Path is not a directory for prefix '${prefix}': ${dir}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  const s = spinner();
  if (!options.silent) {
    s.start("Starting static file server...");
  }

  if (options.verbose) {
    logger.debug(`Serving directories:`, directoryMap);
    logger.debug(`HTML imports:`, Object.keys(htmlImports));
    logger.debug(`Index file: ${indexFile}`);
    logger.debug(`Host: ${host}`);
    logger.debug(`Port: ${port}`);
    logger.debug(`CORS enabled: ${cors}`);
    logger.debug(`Development mode: ${development}`);
  }

  try {
    const server = Bun.serve({
      port,
      hostname: host,
      development,

      async fetch(req) {
        const url = new URL(req.url);
        const cleanUrl = url.pathname;

        // Check for HTML import matches first
        for (const prefix of Object.keys(htmlImports)) {
          if (
            cleanUrl === prefix ||
            (cleanUrl === prefix + "/" && prefix !== "/") ||
            (prefix === "/" && cleanUrl === "/")
          ) {
            const htmlImport = htmlImports[prefix];

            try {
              const htmlContent = await htmlImport.text();
              const response = new Response(htmlContent, {
                headers: {
                  "Content-Type": "text/html",
                  ...(cors && {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                      "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers":
                      "Content-Type, Authorization",
                  }),
                },
              });

              if (options.verbose) {
                logger.debug(`Served HTML import: ${cleanUrl}`);
              }

              return response;
            } catch (error) {
              if (options.verbose) {
                logger.debug(
                  `Failed to serve HTML import for ${cleanUrl}:`,
                  error
                );
              }
              return new Response("Internal Server Error", { status: 500 });
            }
          }
        }

        // Handle CORS OPTIONS requests
        if (req.method === "OPTIONS" && cors) {
          return new Response(null, {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          });
        }

        // Find matching directory for the URL
        let matchedPrefix = "/";
        let matchedDir = directoryMap["/"];

        // Sort prefixes by length (longest first) to match most specific paths first
        const dirPrefixes = Object.keys(directoryMap).sort(
          (a, b) => b.length - a.length
        );

        for (const prefix of dirPrefixes) {
          if (cleanUrl.startsWith(prefix)) {
            matchedPrefix = prefix;
            matchedDir = directoryMap[prefix];
            break;
          }
        }

        // Calculate relative path within the matched directory
        const relativePath = cleanUrl.substring(matchedPrefix.length);
        const normalizedPath = relativePath.startsWith("/")
          ? relativePath.substring(1)
          : relativePath;

        let filePath = join(matchedDir, normalizedPath || indexFile);

        // If we're at the root of a prefix and no file specified, serve index
        if (cleanUrl === matchedPrefix && cleanUrl.endsWith("/")) {
          filePath = join(matchedDir, indexFile);
        } else if (cleanUrl === matchedPrefix && !cleanUrl.endsWith("/")) {
          filePath = join(matchedDir, indexFile);
        }

        // Log request
        if (options.verbose) {
          logger.debug(
            `${req.method} ${cleanUrl} -> ${filePath} (prefix: ${matchedPrefix})`
          );
        }

        // Check if file exists
        if (!existsSync(filePath)) {
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <title>404 - File Not Found</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                  h1 { color: #e74c3c; }
                  p { color: #666; }
                </style>
              </head>
              <body>
                <h1>404 - File Not Found</h1>
                <p>The requested file <code>${cleanUrl}</code> was not found.</p>
              </body>
            </html>`,
            {
              status: 404,
              headers: {
                "Content-Type": "text/html",
                ...(cors && {
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods":
                    "GET, POST, PUT, DELETE, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }),
              },
            }
          );
        }

        // Check if path is a directory
        if (statSync(filePath).isDirectory()) {
          const indexPath = join(filePath, indexFile);
          if (existsSync(indexPath)) {
            filePath = indexPath;
          } else {
            // List directory contents
            try {
              const fs = require("fs");
              const dirFiles = fs.readdirSync(filePath);
              const fileList = dirFiles
                .map((file: string) => {
                  const href = join(cleanUrl, file).replace(/\\/g, "/");
                  return `<li><a href="${href}">${file}</a></li>`;
                })
                .join("");

              return new Response(
                `<!DOCTYPE html>
                <html>
                  <head>
                    <title>Directory: ${cleanUrl}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      h1 { color: #2c3e50; }
                      ul { list-style: none; padding: 0; }
                      li { margin: 5px 0; }
                      a { color: #3498db; text-decoration: none; }
                      a:hover { text-decoration: underline; }
                    </style>
                  </head>
                  <body>
                    <h1>Directory: ${cleanUrl}</h1>
                    <ul>
                      ${cleanUrl !== "/" ? '<li><a href="../">..</a></li>' : ""}
                      ${fileList}
                    </ul>
                  </body>
                </html>`,
                {
                  status: 200,
                  headers: {
                    "Content-Type": "text/html",
                    ...(cors && {
                      "Access-Control-Allow-Origin": "*",
                      "Access-Control-Allow-Methods":
                        "GET, POST, PUT, DELETE, OPTIONS",
                      "Access-Control-Allow-Headers":
                        "Content-Type, Authorization",
                    }),
                  },
                }
              );
            } catch (error) {
              logger.error(`Error reading directory ${filePath}:`, error);
              return new Response("Internal Server Error", { status: 500 });
            }
          }
        }

        // Serve file using Bun.file for optimal performance
        try {
          const file = Bun.file(filePath);
          const exists = await file.exists();

          if (!exists) {
            return new Response("File not found", { status: 404 });
          }

          const ext = extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";

          if (options.verbose) {
            logger.debug(`Served: ${filePath} (${contentType})`);
          }

          return new Response(file, {
            headers: {
              "Content-Type": contentType,
              ...(cors && {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods":
                  "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              }),
            },
          });
        } catch (error) {
          logger.error(`Error serving file ${filePath}:`, error);
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <title>500 - Internal Server Error</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                  h1 { color: #e74c3c; }
                  p { color: #666; }
                </style>
              </head>
              <body>
                <h1>500 - Internal Server Error</h1>
                <p>Unable to serve the requested file.</p>
              </body>
            </html>`,
            {
              status: 500,
              headers: {
                "Content-Type": "text/html",
                ...(cors && {
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods":
                    "GET, POST, PUT, DELETE, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }),
              },
            }
          );
        }
      },

      error(error) {
        logger.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      },
    });

    const url = server.url.toString().replace(/\/$/, "");

    if (!options.silent) {
      s.stop("Static file server started successfully!");

      outro(
        `${bold(green("✅ Static server is running!"))}

${bold("Server Details:")}
• URL: ${bold(cyan(url))}
• Directories: ${Object.entries(directoryMap)
          .map(([prefix, dir]) => `${prefix} -> ${dir}`)
          .join(", ")}
${
  Object.keys(htmlImports).length > 0
    ? `• HTML Imports: ${Object.keys(htmlImports).join(", ")}`
    : ""
}
• Index file: ${bold(indexFile)}
• CORS: ${cors ? "enabled" : "disabled"}
• Development mode: ${development ? "enabled" : "disabled"}

${bold("Press Ctrl+C to stop the server")}`
      );
    }

    logger.info(`Static server started at ${url}`);
    logger.info(`Serving files from directories:`, directoryMap);
    if (Object.keys(htmlImports).length > 0) {
      logger.info(`HTML imports loaded:`, Object.keys(htmlImports));
    }

    if (options.verbose) {
      logger.debug("Server started successfully");
      if (development) {
        logger.debug("Development mode enabled - serving unbundled assets");
      }
    }

    return { server, port: server.port || port, url };
  } catch (error) {
    if (!options.silent) {
      s.stop("Failed to start static file server");
    }
    logger.error("Error starting static file server:", error);
    throw error;
  }
}

/**
 * Stop a static file server instance
 *
 * @param options Configuration options for stopping the server
 * @param options.server Server instance to stop
 * @param options.silent Suppress UI output
 * @param options.verbose Enable detailed logging
 */
export async function stopStaticAction(
  options: { server?: Server; silent?: boolean; verbose?: boolean } = {}
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    const s = spinner();
    s.start("Stopping static file server...");

    try {
      if (options.server) {
        await options.server.stop();
      }
      s.stop("Static file server stopped successfully");
    } catch (error) {
      s.stop("Error stopping static file server");
      logger.error("Error stopping static file server:", error);
    }
  } else {
    // Silent mode - just stop the server
    if (options.server) {
      try {
        await options.server.stop();
      } catch (error) {
        logger.error("Error stopping static file server:", error);
      }
    }
  }
}
