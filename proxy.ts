import * as http from "http";
import * as httpProxy from "http-proxy";
import { IncomingMessage, ServerResponse } from "http";

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({});

// Function to convert request to curl command string
function requestToCurl(
  req: IncomingMessage,
  targetUrl: string,
  body?: string,
): string {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", targetUrl).toString();
  const targetHost = new URL(targetUrl).host;

  let curlCommand = `curl -X ${method} --output -`;

  // Add headers
  if (req.headers) {
    Object.entries(req.headers).forEach(([key, value]) => {
      // Skip the original host header and use target host instead
      if (key.toLowerCase() === "host") {
        curlCommand += ` -H "${key}: ${targetHost}"`;
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((v) => {
          curlCommand += ` -H "${key}: ${v}"`;
        });
      } else if (value) {
        curlCommand += ` -H "${key}: ${value}"`;
      }
    });
  }

  // Add actual body data if present
  if (body && body.length > 0) {
    // Escape single quotes in the body for shell safety
    const escapedBody = body.replace(/'/g, "'\"'\"'");
    curlCommand += ` -d '${escapedBody}'`;
  }

  curlCommand += ` "${url}"`;

  return curlCommand;
}

// Create HTTP server
const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    // Default target - you can modify this or make it configurable
    const target = process.env.PROXY_TARGET || "https://ai-proxy.lab.epam.com";

    // Capture request body
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      // Log the request as curl command
      const curlCommand = requestToCurl(req, target, body);
      console.log(`[PROXY] ${new Date().toISOString()}`);
      console.log(`[CURL] ${curlCommand}`);
      console.log("---");

      // Handle proxy errors
      proxy.on("error", (err, req, res) => {
        console.error("[PROXY ERROR]", err.message);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Proxy Error: " + err.message);
        }
      });

      // Proxy the request
      proxy.web(req, res, {
        target: target,
        changeOrigin: true,
        secure: false, // Set to true if target uses valid HTTPS
        buffer: Buffer.from(body),
      });
    });
  },
);

// Start the proxy server
const PORT = process.env.PROXY_PORT || 3333;
server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
  console.log(
    `Forwarding requests to: ${process.env.PROXY_TARGET || "https://ai-proxy.lab.epam.com"}`,
  );
  console.log("Request logs will be displayed as curl commands");
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down proxy server...");
  server.close(() => {
    console.log("Proxy server closed");
    process.exit(0);
  });
});

export default server;
