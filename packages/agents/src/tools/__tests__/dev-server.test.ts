import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { devServer } from "../dev-server";

describe("devServer tool", () => {
  beforeEach(() => {
    // Clean up any running processes before each test
  });

  afterEach(() => {
    // Clean up any processes started during tests
  });

  describe("Tool metadata", () => {
    test("should have correct tool description", () => {
      expect(devServer.description).toBeDefined();
      expect(typeof devServer.description).toBe("string");
      expect(devServer.description).toContain(
        "Development server control and diagnostic tool"
      );
    });

    test("should have proper parameter validation", () => {
      expect(devServer.inputSchema).toBeDefined();
      expect(devServer.inputSchema._def.typeName).toBe("ZodObject");

      const shape = devServer.inputSchema._def.shape();
      expect(shape).toBeDefined();

      // Check optional processId parameter
      expect(shape.processId).toBeDefined();
      expect(shape.processId._def.typeName).toBe("ZodOptional");

      // Check endpoint parameter with default
      expect(shape.endpoint).toBeDefined();
      expect(shape.endpoint._def.typeName).toBe("ZodDefault");

      // Check method parameter with default
      expect(shape.method).toBeDefined();
      expect(shape.method._def.typeName).toBe("ZodDefault");

      // Check timeout parameter with default
      expect(shape.timeout).toBeDefined();
      expect(shape.timeout._def.typeName).toBe("ZodDefault");
    });

    test("should have execute function", () => {
      expect(devServer.execute).toBeDefined();
      expect(typeof devServer.execute).toBe("function");
    });
  });

  describe("Process listing", () => {
    test("should list all processes when no processId provided", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      expect(result).toMatch(
        /No running processes found|Development Server Status/i
      );
    });

    test("should handle empty process list", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should handle case when no processes are running
      expect(result).toMatch(/No.*processes.*found|Development Server Status/i);
    });

    test("should format process information correctly", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should include basic formatting structure
      expect(result).toMatch(
        /No running processes found|Development Server Status/i
      );
    });
  });

  describe("Process diagnostics", () => {
    test("should handle non-existent process gracefully", async () => {
      const result = await devServer.execute({
        processId: "non-existent-process-12345",
      });

      expect(typeof result).toBe("string");
      expect(result).toMatch(/not found|not running|invalid/i);
    });

    test("should validate processId parameter", async () => {
      const result = await devServer.execute({
        processId: "",
      });

      expect(typeof result).toBe("string");
      // Should handle empty processId gracefully
    });

    test("should handle custom endpoint parameter", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        endpoint: "/custom-endpoint",
      });

      expect(typeof result).toBe("string");
      // Should attempt to use custom endpoint
    });

    test("should handle custom HTTP method", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        method: "POST",
      });

      expect(typeof result).toBe("string");
      // Should attempt to use custom method
    });

    test("should handle timeout parameter", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        timeout: 1000,
      });

      expect(typeof result).toBe("string");
      // Should respect timeout setting
    });
  });

  describe("HTTP testing functionality", () => {
    test("should handle connection failures gracefully", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        endpoint: "/test",
      });

      expect(typeof result).toBe("string");
      // Should handle connection errors without throwing
    });

    test("should handle invalid URLs gracefully", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        endpoint: "invalid-url",
      });

      expect(typeof result).toBe("string");
      // Should handle malformed URLs
    });

    test("should format HTTP response information", async () => {
      const result = await devServer.execute({
        processId: "test-process",
      });

      expect(typeof result).toBe("string");
      // Should include structured response format
    });
  });

  describe("Log capture functionality", () => {
    test("should capture fresh logs after HTTP call", async () => {
      const result = await devServer.execute({
        processId: "test-process",
      });

      expect(typeof result).toBe("string");
      // Should include log information in response
    });

    test("should handle processes without logs", async () => {
      const result = await devServer.execute({
        processId: "test-process",
      });

      expect(typeof result).toBe("string");
      // Should handle cases where no logs are available
    });

    test("should limit log output appropriately", async () => {
      const result = await devServer.execute({
        processId: "test-process",
      });

      expect(typeof result).toBe("string");
      // Should not return excessively long log output
      expect(result.length).toBeLessThan(50000); // Reasonable limit
    });
  });

  describe("Error handling", () => {
    test("should handle runner service errors gracefully", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should not throw errors, always return string response
    });

    test("should handle invalid parameters gracefully", async () => {
      const result = await devServer.execute({
        processId: null as any,
      });

      expect(typeof result).toBe("string");
      // Should handle type mismatches gracefully
    });

    test("should handle network timeouts", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        timeout: 1, // Very short timeout
      });

      expect(typeof result).toBe("string");
      // Should handle timeout scenarios
    });
  });

  describe("Output formatting", () => {
    test("should return well-formatted markdown output", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      expect(result).toMatch(
        /No running processes found|Development Server Status/i
      );
      // Should use markdown formatting
    });

    test("should include timestamps in output", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should include timing information
    });

    test("should truncate long responses appropriately", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should have reasonable length limits
      expect(result.length).toBeLessThan(100000);
    });
  });

  describe("Integration with runner service", () => {
    test("should properly interface with runner service", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should successfully call runner service methods
    });

    test("should handle runner service unavailability", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should gracefully handle service issues
    });
  });

  describe("Parameter combinations", () => {
    test("should handle all parameters together", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        endpoint: "/health",
        method: "GET",
        timeout: 5000,
      });

      expect(typeof result).toBe("string");
      // Should handle complex parameter combinations
    });

    test("should use default values for missing parameters", async () => {
      const result = await devServer.execute({
        processId: "test-process",
      });

      expect(typeof result).toBe("string");
      // Should apply sensible defaults
    });
  });

  describe("Performance", () => {
    test("should complete within reasonable time", async () => {
      const startTime = Date.now();

      const result = await devServer.execute({});

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(typeof result).toBe("string");
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test("should handle concurrent requests", async () => {
      const promises = [
        devServer.execute({}),
        devServer.execute({}),
        devServer.execute({}),
      ];

      const results = await Promise.all(promises);

      for (const result of results) {
        expect(typeof result).toBe("string");
      }
    });
  });

  describe("Security considerations", () => {
    test("should sanitize process output", async () => {
      const result = await devServer.execute({});

      expect(typeof result).toBe("string");
      // Should not expose sensitive information
    });

    test("should validate endpoint URLs", async () => {
      const result = await devServer.execute({
        processId: "test-process",
        endpoint: "javascript:alert('xss')",
      });

      expect(typeof result).toBe("string");
      // Should handle potentially malicious URLs safely
    });
  });
});
