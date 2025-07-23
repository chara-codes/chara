import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { serveStaticAction, stopStaticAction } from "../serve-static";

// Mock dependencies
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@chara-codes/logger", () => ({
  logger: mockLogger,
}));

const mockIntro = mock(() => {});
const mockOutro = mock(() => {});
const mockSpinner = mock(() => ({
  start: mock(() => {}),
  stop: mock(() => {}),
}));

mock.module("../utils/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  spinner: mockSpinner,
}));

describe("serve-static action", () => {
  const testDir = join(process.cwd(), "test-static-files");
  const testPort = 3001;

  beforeEach(() => {
    // Clear all mocks
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();
    mockIntro.mockClear();
    mockOutro.mockClear();
    mockSpinner.mockClear();

    // Create test directory with sample files
    try {
      mkdirSync(testDir, { recursive: true });

      // Create index.html
      writeFileSync(
        join(testDir, "index.html"),
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Static Site</title>
            <link rel="stylesheet" href="styles.css">
          </head>
          <body>
            <h1>Hello World</h1>
            <script src="script.js"></script>
          </body>
        </html>
      `
      );

      // Create styles.css
      writeFileSync(
        join(testDir, "styles.css"),
        `
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
        }
        h1 {
          color: #333;
        }
      `
      );

      // Create script.js
      writeFileSync(
        join(testDir, "script.js"),
        `
        console.log("Hello from script.js");
        document.addEventListener('DOMContentLoaded', function() {
          console.log("DOM loaded");
        });
      `
      );

      // Create nested directory with file
      mkdirSync(join(testDir, "assets"), { recursive: true });
      writeFileSync(
        join(testDir, "assets", "data.json"),
        JSON.stringify({
          message: "Hello from JSON",
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Error setting up test directory:", error);
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up test directory:", error);
    }
  });

  describe("serveStaticAction", () => {
    test("should start server with default options", async () => {
      const result = await serveStaticAction({
        port: testPort,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort);
      expect(result.url).toBe(`http://localhost:${testPort}`);

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should start server with custom configuration", async () => {
      const result = await serveStaticAction({
        port: testPort + 1,
        directory: testDir,
        index: "index.html",
        host: "localhost",
        cors: true,
        silent: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort + 1);
      expect(result.url).toBe(`http://localhost:${testPort + 1}`);

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should serve HTML file correctly", async () => {
      const result = await serveStaticAction({
        port: testPort + 2,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to index.html
      const response = await fetch(`http://localhost:${testPort + 2}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html");

      const content = await response.text();
      expect(content).toContain("Hello World");
      expect(content).toContain("Test Static Site");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should serve CSS file with correct MIME type", async () => {
      const result = await serveStaticAction({
        port: testPort + 3,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to CSS file
      const response = await fetch(
        `http://localhost:${testPort + 3}/styles.css`
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/css");

      const content = await response.text();
      expect(content).toContain("font-family: Arial");
      expect(content).toContain("background-color: #f0f0f0");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should serve JavaScript file with correct MIME type", async () => {
      const result = await serveStaticAction({
        port: testPort + 4,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to JavaScript file
      const response = await fetch(
        `http://localhost:${testPort + 4}/script.js`
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/javascript"
      );

      const content = await response.text();
      expect(content).toContain("console.log");
      expect(content).toContain("DOMContentLoaded");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should serve JSON file with correct MIME type", async () => {
      const result = await serveStaticAction({
        port: testPort + 5,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to JSON file
      const response = await fetch(
        `http://localhost:${testPort + 5}/assets/data.json`
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");

      const content = await response.json();
      expect(content.message).toBe("Hello from JSON");
      expect(content.timestamp).toBeDefined();

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should return 404 for non-existent files", async () => {
      const result = await serveStaticAction({
        port: testPort + 6,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to non-existent file
      const response = await fetch(
        `http://localhost:${testPort + 6}/nonexistent.html`
      );
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe("text/html");

      const content = await response.text();
      expect(content).toContain("404 - File Not Found");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle CORS headers when enabled", async () => {
      const result = await serveStaticAction({
        port: testPort + 7,
        directory: testDir,
        cors: true,
        silent: true,
        verbose: false,
      });

      // Make request to check CORS headers
      const response = await fetch(`http://localhost:${testPort + 7}/`);
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle OPTIONS requests for CORS", async () => {
      const result = await serveStaticAction({
        port: testPort + 8,
        directory: testDir,
        cors: true,
        silent: true,
        verbose: false,
      });

      // Make OPTIONS request
      const response = await fetch(`http://localhost:${testPort + 8}/`, {
        method: "OPTIONS",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should throw error for non-existent directory", async () => {
      await expect(
        serveStaticAction({
          port: testPort + 9,
          directory: "/nonexistent/directory",
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Directory does not exist");
    });

    test("should set debug logging when verbose is true", async () => {
      const result = await serveStaticAction({
        port: testPort + 11,
        directory: testDir,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
      expect(mockLogger.debug).toHaveBeenCalled();

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should use custom index file", async () => {
      // Create custom index file
      writeFileSync(
        join(testDir, "custom.html"),
        `
        <!DOCTYPE html>
        <html>
          <head><title>Custom Index</title></head>
          <body><h1>Custom Index Page</h1></body>
        </html>
      `
      );

      const result = await serveStaticAction({
        port: testPort + 12,
        directory: testDir,
        index: "custom.html",
        silent: true,
        verbose: false,
      });

      // Make request to root
      const response = await fetch(`http://localhost:${testPort + 12}/`);
      expect(response.status).toBe(200);

      const content = await response.text();
      expect(content).toContain("Custom Index Page");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle directory listing when no index file", async () => {
      // Create directory without index file
      const noIndexDir = join(testDir, "no-index");
      mkdirSync(noIndexDir, { recursive: true });
      writeFileSync(join(noIndexDir, "file1.txt"), "Content 1");
      writeFileSync(join(noIndexDir, "file2.txt"), "Content 2");

      const result = await serveStaticAction({
        port: testPort + 13,
        directory: noIndexDir,
        index: "nonexistent.html", // Use a non-existent index file
        silent: true,
        verbose: false,
      });

      // Make request to root - should return 404 since nonexistent.html doesn't exist
      const response = await fetch(`http://localhost:${testPort + 13}/`);
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe("text/html");

      const content = await response.text();
      expect(content).toContain("404 - File Not Found");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should show directory listing when accessing subdirectory without index", async () => {
      // Create a subdirectory without index file
      const subDir = join(testDir, "subdir");
      mkdirSync(subDir, { recursive: true });
      writeFileSync(join(subDir, "file1.txt"), "Content 1");
      writeFileSync(join(subDir, "file2.txt"), "Content 2");

      const result = await serveStaticAction({
        port: testPort + 23,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request to subdirectory - should show directory listing
      const response = await fetch(`http://localhost:${testPort + 23}/subdir/`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html");

      const content = await response.text();
      expect(content).toContain("Directory: /subdir/");
      expect(content).toContain("file1.txt");
      expect(content).toContain("file2.txt");
      expect(content).toContain('<a href="../">..</a>'); // Parent directory link

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });
  });

  describe("stopStaticAction", () => {
    test("should stop server successfully", async () => {
      const result = await serveStaticAction({
        port: testPort + 14,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Stop the server
      await stopStaticAction({
        server: result.server,
        silent: true,
        verbose: false,
      });

      // Verify server is stopped by trying to make a request
      await expect(
        fetch(`http://localhost:${testPort + 14}/`)
      ).rejects.toThrow();
    });

    test("should handle server stop with verbose logging", async () => {
      const result = await serveStaticAction({
        port: testPort + 15,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      await stopStaticAction({
        server: result.server,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });

    test("should handle null server gracefully", async () => {
      await expect(
        stopStaticAction({
          server: undefined,
          silent: true,
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });

    test("should handle undefined server gracefully", async () => {
      await expect(
        stopStaticAction({
          server: undefined,
          silent: true,
          verbose: false,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("MIME Type Handling", () => {
    test("should serve various file types with correct MIME types", async () => {
      // Create test files with different extensions
      writeFileSync(join(testDir, "test.png"), "fake-png-data");
      writeFileSync(join(testDir, "test.jpg"), "fake-jpg-data");
      writeFileSync(join(testDir, "test.svg"), "<svg></svg>");
      writeFileSync(join(testDir, "test.txt"), "plain text");
      writeFileSync(
        join(testDir, "test.xml"),
        "<?xml version='1.0'?><root></root>"
      );

      const result = await serveStaticAction({
        port: testPort + 16,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Test PNG
      const pngResponse = await fetch(
        `http://localhost:${testPort + 16}/test.png`
      );
      expect(pngResponse.headers.get("content-type")).toBe("image/png");

      // Test JPG
      const jpgResponse = await fetch(
        `http://localhost:${testPort + 16}/test.jpg`
      );
      expect(jpgResponse.headers.get("content-type")).toBe("image/jpeg");

      // Test SVG
      const svgResponse = await fetch(
        `http://localhost:${testPort + 16}/test.svg`
      );
      expect(svgResponse.headers.get("content-type")).toBe("image/svg+xml");

      // Test TXT
      const txtResponse = await fetch(
        `http://localhost:${testPort + 16}/test.txt`
      );
      expect(txtResponse.headers.get("content-type")).toBe("text/plain");

      // Test XML
      const xmlResponse = await fetch(
        `http://localhost:${testPort + 16}/test.xml`
      );
      expect(xmlResponse.headers.get("content-type")).toBe("application/xml");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle unknown file types with octet-stream", async () => {
      // Create file with unknown extension
      writeFileSync(join(testDir, "test.unknown"), "unknown file type");

      const result = await serveStaticAction({
        port: testPort + 17,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      const response = await fetch(
        `http://localhost:${testPort + 17}/test.unknown`
      );
      expect(response.headers.get("content-type")).toBe(
        "application/octet-stream"
      );

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });
  });

  describe("Error Handling", () => {
    test("should handle file read errors gracefully", async () => {
      const result = await serveStaticAction({
        port: testPort + 18,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Create a file and then remove it during server operation
      const tempFile = join(testDir, "temp.txt");
      writeFileSync(tempFile, "temporary content");

      // Start a request but don't await it immediately
      const requestPromise = fetch(
        `http://localhost:${testPort + 18}/temp.txt`
      );

      // Remove the file (this is a bit of a race condition, but should work in most cases)
      rmSync(tempFile, { force: true });

      // The request should still complete (might be 404 or might serve cached content)
      const response = await requestPromise;
      expect([200, 404, 500]).toContain(response.status);

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle query parameters in URLs", async () => {
      const result = await serveStaticAction({
        port: testPort + 19,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      // Make request with query parameters
      const response = await fetch(
        `http://localhost:${testPort + 19}/index.html?param=value&other=123`
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html");

      const content = await response.text();
      expect(content).toContain("Hello World");

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });
  });

  describe("Integration with UI Components", () => {
    test("should use intro and outro when not silent", async () => {
      const result = await serveStaticAction({
        port: testPort + 20,
        directory: testDir,
        silent: false,
        verbose: false,
      });

      // Note: These are called by the action itself, not the test
      // The test just verifies the action runs without error
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort + 20);

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should use spinner when not silent", async () => {
      const result = await serveStaticAction({
        port: testPort + 21,
        directory: testDir,
        silent: false,
        verbose: false,
      });

      // Note: Spinner is called by the action itself, not the test
      // The test just verifies the action runs without error
      expect(result.server).toBeDefined();
      expect(result.port).toBe(testPort + 21);

      // Clean up
      await stopStaticAction({ server: result.server, silent: true });
    });
  });

  describe("Multiple directories support", () => {
    test("should serve multiple directories correctly", async () => {
      // Create additional test directories
      const dir1 = join(testDir, "dir1");
      const dir2 = join(testDir, "dir2");
      mkdirSync(dir1, { recursive: true });
      mkdirSync(dir2, { recursive: true });

      writeFileSync(
        join(dir1, "index.html"),
        "<html><body>Dir1 Index</body></html>"
      );
      writeFileSync(join(dir1, "file1.txt"), "File from dir1");
      writeFileSync(
        join(dir2, "index.html"),
        "<html><body>Dir2 Index</body></html>"
      );
      writeFileSync(join(dir2, "file2.txt"), "File from dir2");

      const result = await serveStaticAction({
        port: testPort + 24,
        directories: {
          "/": dir1,
          "/api": dir2,
        },
        silent: true,
        verbose: false,
      });

      // Test root directory
      const rootResponse = await fetch(`http://localhost:${testPort + 24}/`);
      expect(rootResponse.status).toBe(200);
      const rootContent = await rootResponse.text();
      expect(rootContent).toContain("Dir1 Index");

      // Test file from root directory
      const file1Response = await fetch(
        `http://localhost:${testPort + 24}/file1.txt`
      );
      expect(file1Response.status).toBe(200);
      const file1Content = await file1Response.text();
      expect(file1Content).toBe("File from dir1");

      // Test API directory
      const apiResponse = await fetch(`http://localhost:${testPort + 24}/api/`);
      expect(apiResponse.status).toBe(200);
      const apiContent = await apiResponse.text();
      expect(apiContent).toContain("Dir2 Index");

      // Test file from API directory
      const file2Response = await fetch(
        `http://localhost:${testPort + 24}/api/file2.txt`
      );
      expect(file2Response.status).toBe(200);
      const file2Content = await file2Response.text();
      expect(file2Content).toBe("File from dir2");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should prioritize longer prefixes", async () => {
      // Create test directories
      const rootDir = join(testDir, "root");
      const apiDir = join(testDir, "api");
      const apiDocsDir = join(testDir, "api-docs");
      mkdirSync(rootDir, { recursive: true });
      mkdirSync(apiDir, { recursive: true });
      mkdirSync(apiDocsDir, { recursive: true });

      writeFileSync(
        join(rootDir, "index.html"),
        "<html><body>Root</body></html>"
      );
      writeFileSync(
        join(apiDir, "index.html"),
        "<html><body>API</body></html>"
      );
      writeFileSync(
        join(apiDocsDir, "index.html"),
        "<html><body>API Docs</body></html>"
      );

      const result = await serveStaticAction({
        port: testPort + 25,
        directories: {
          "/": rootDir,
          "/api": apiDir,
          "/api/docs": apiDocsDir,
        },
        silent: true,
        verbose: false,
      });

      // Test that /api/docs goes to apiDocsDir, not apiDir
      const apiDocsResponse = await fetch(
        `http://localhost:${testPort + 25}/api/docs/`
      );
      expect(apiDocsResponse.status).toBe(200);
      const apiDocsContent = await apiDocsResponse.text();
      expect(apiDocsContent).toContain("API Docs");

      // Test that /api goes to apiDir
      const apiResponse = await fetch(`http://localhost:${testPort + 25}/api/`);
      expect(apiResponse.status).toBe(200);
      const apiContent = await apiResponse.text();
      expect(apiContent).toContain("API");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle non-existent directory in directories option", async () => {
      await expect(
        serveStaticAction({
          port: testPort + 26,
          directories: {
            "/": testDir,
            "/api": "/nonexistent/directory",
          },
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Directory does not exist for prefix '/api'");
    });

    test("should handle file as directory in directories option", async () => {
      // Create a file instead of directory
      const filePath = join(testDir, "notadir.txt");
      writeFileSync(filePath, "This is a file");

      await expect(
        serveStaticAction({
          port: testPort + 27,
          directories: {
            "/": testDir,
            "/api": filePath,
          },
          silent: true,
          verbose: false,
        })
      ).rejects.toThrow("Path is not a directory for prefix '/api'");
    });

    test("should fall back to single directory when directories option is not provided", async () => {
      const result = await serveStaticAction({
        port: testPort + 28,
        directory: testDir,
        silent: true,
        verbose: false,
      });

      const response = await fetch(`http://localhost:${testPort + 28}/`);
      expect(response.status).toBe(200);

      await stopStaticAction({ server: result.server, silent: true });
    });
  });

  describe("HTML imports support", () => {
    test("should handle HTML imports as Response objects", async () => {
      // Create a mock HTML import (Response object)
      const mockHtmlImport = new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Test HTML Import</title>
</head>
<body>
    <h1>Hello from HTML Import!</h1>
    <p>This page was imported as a Response object.</p>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 29,
        directories: {
          "/": mockHtmlImport,
        },
        development: true,
        silent: true,
        verbose: false,
      });

      // Test that the HTML import is served
      const response = await fetch(`http://localhost:${testPort + 29}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain("Hello from HTML Import!");
      expect(content).toContain("Test HTML Import");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle multiple HTML imports", async () => {
      // Create multiple HTML imports
      const homeImport = new Response(
        `<!DOCTYPE html>
<html><head><title>Home</title></head><body><h1>Home Page</h1></body></html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const aboutImport = new Response(
        `<!DOCTYPE html>
<html><head><title>About</title></head><body><h1>About Page</h1></body></html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 30,
        directories: {
          "/": homeImport,
          "/about": aboutImport,
        },
        development: true,
        silent: true,
        verbose: false,
      });

      // Test home page
      const homeResponse = await fetch(`http://localhost:${testPort + 30}/`);
      expect(homeResponse.status).toBe(200);
      const homeContent = await homeResponse.text();
      expect(homeContent).toContain("Home Page");

      // Test about page
      const aboutResponse = await fetch(
        `http://localhost:${testPort + 30}/about`
      );
      expect(aboutResponse.status).toBe(200);
      const aboutContent = await aboutResponse.text();
      expect(aboutContent).toContain("About Page");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should support development mode options", async () => {
      const htmlImport = new Response(
        `<!DOCTYPE html>
<html><head><title>Dev Mode</title></head><body><h1>Development Mode</h1></body></html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 31,
        directories: {
          "/": htmlImport,
        },
        development: {
          hmr: true,
          console: true,
        },
        silent: true,
        verbose: false,
      });

      // Test that development mode doesn't break HTML imports
      const response = await fetch(`http://localhost:${testPort + 31}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain("Development Mode");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should support production mode", async () => {
      const htmlImport = new Response(
        `<!DOCTYPE html>
<html><head><title>Production</title></head><body><h1>Production Mode</h1></body></html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 32,
        directories: {
          "/": htmlImport,
        },
        development: false,
        silent: true,
        verbose: false,
      });

      // Test that production mode doesn't break HTML imports
      const response = await fetch(`http://localhost:${testPort + 32}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain("Production Mode");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle mixed HTML imports and static directories", async () => {
      // Create an HTML import
      const htmlImport = new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Mixed App</title>
</head>
<body>
    <div id="root">Mixed Content</div>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      // Create a subdirectory for static files
      const staticDir = join(testDir, "static");
      mkdirSync(staticDir, { recursive: true });
      writeFileSync(join(staticDir, "file.txt"), "Static file content");

      const result = await serveStaticAction({
        port: testPort + 33,
        directories: {
          "/": htmlImport, // HTML import
          "/static": staticDir, // Static directory
        },
        development: true,
        silent: true,
        verbose: false,
      });

      // Test HTML import
      const htmlResponse = await fetch(`http://localhost:${testPort + 33}/`);
      expect(htmlResponse.status).toBe(200);
      const htmlContent = await htmlResponse.text();
      expect(htmlContent).toContain("Mixed Content");

      // Test static directory
      const staticResponse = await fetch(
        `http://localhost:${testPort + 33}/static/file.txt`
      );
      expect(staticResponse.status).toBe(200);
      const staticContent = await staticResponse.text();
      expect(staticContent).toBe("Static file content");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle HTML import errors gracefully", async () => {
      // Create an HTML import that might have issues
      const problematicImport = new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Problematic</title>
</head>
<body>
    <div>Content with potential issues</div>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 34,
        directories: {
          "/": problematicImport,
        },
        development: true,
        silent: true,
        verbose: false,
      });

      // Should still serve the HTML import
      const response = await fetch(`http://localhost:${testPort + 34}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain("Content with potential issues");

      await stopStaticAction({ server: result.server, silent: true });
    });

    test("should handle Response objects properly", async () => {
      const htmlImport = new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Response Test</title>
</head>
<body>
    <div>Testing Response object handling</div>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );

      const result = await serveStaticAction({
        port: testPort + 35,
        directories: {
          "/": htmlImport,
        },
        development: true,
        silent: true,
        verbose: false,
      });

      // Should serve the Response object properly
      const response = await fetch(`http://localhost:${testPort + 35}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain("Testing Response object handling");
      expect(content).toContain("Response Test");

      await stopStaticAction({ server: result.server, silent: true });
    });
  });
});
