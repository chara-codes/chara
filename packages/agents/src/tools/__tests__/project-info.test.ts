import { beforeEach, describe, expect, it } from "bun:test";
import { projectInfo } from "../project-info";

describe("projectInfo tool", () => {
  it("should have correct tool metadata", () => {
    expect(projectInfo.description).toContain("project information");
    expect(projectInfo.description).toContain("package manager");
    expect(projectInfo.description).toContain("frameworks");
    expect(projectInfo.inputSchema).toBeDefined();
  });

  it("should execute successfully with default parameters", async () => {
    const result = await projectInfo.execute({});

    expect(typeof result).toBe("string");
    expect(result).toContain("Project Information for:");
    expect(result).toContain("Package Manager");
  });

  it("should execute successfully with current directory", async () => {
    const result = await projectInfo.execute({
      path: undefined,
      includeSettings: true,
      includeFrameworks: true,
      includeRuntimes: true,
    });

    expect(typeof result).toBe("string");
    expect(result).toContain("Project Information for:");
    expect(result).toContain("Package Information");
    expect(result).toContain("@chara-codes/agents");
  });

  it("should handle partial feature flags", async () => {
    const result = await projectInfo.execute({
      includeSettings: false,
      includeFrameworks: false,
      includeRuntimes: false,
    });

    expect(typeof result).toBe("string");
    expect(result).toContain("Project Information for:");
    expect(result).toContain("Package Manager");
    // Should not contain framework or runtime sections
    expect(result).not.toContain("### Frameworks");
    expect(result).not.toContain("### Language Runtimes");
    expect(result).not.toContain("### Build Settings");
  });

  it("should detect package manager correctly", async () => {
    const result = await projectInfo.execute({});

    expect(result).toContain("Package Manager");
    // Should detect bun in this project
    expect(result).toContain("bun");
  });

  it("should detect workspace information", async () => {
    const result = await projectInfo.execute({});

    expect(result).toContain("Workspace Configuration");
    expect(result).toContain("Is Root");
    expect(result).toContain("Packages");
  });

  it("should handle non-existent paths gracefully", async () => {
    const result = await projectInfo.execute({
      path: "non-existent-path",
    });

    expect(typeof result).toBe("string");
    // Should either handle gracefully or return error message
    expect(result.length).toBeGreaterThan(0);
  });

  it("should include available scripts when present", async () => {
    const result = await projectInfo.execute({});

    expect(result).toContain("Available Scripts");
    expect(result).toContain("dev");
    expect(result).toContain("test");
  });

  it("should include dependencies information", async () => {
    let result: string;
    let attempts = 0;
    const maxAttempts = 3;

    // Retry logic to handle potential race conditions or file system caching issues
    while (attempts < maxAttempts) {
      try {
        result = await projectInfo.execute({});

        // Check for dependencies section
        expect(result).toContain("Dependencies");

        // Check for at least one known dependency (more flexible approach)
        const hasDependencies =
          result.includes("@changesets/cli") ||
          result.includes("turbo") ||
          result.includes("http-proxy") ||
          result.includes("pretty-bytes");

        if (hasDependencies) {
          // Test passed, break out of retry loop
          expect(hasDependencies).toBe(true);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          console.log(
            "Dependencies test failed after",
            maxAttempts,
            "attempts."
          );
          console.log(
            "Expected to find one of: @changesets/cli, turbo, http-proxy, pretty-bytes"
          );
          console.log(
            "Dependencies section:",
            result
              .split("\n")
              .filter(
                (line) =>
                  line.includes("Dependencies") ||
                  line.includes("@") ||
                  line.includes("turbo") ||
                  line.includes("http-proxy")
              )
              .join("\n")
          );
          expect(hasDependencies).toBe(true);
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }, 30000); // 30 second timeout

  it("should include timestamp in output", async () => {
    const result = await projectInfo.execute({});

    expect(result).toContain("Analysis completed at");
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should handle errors gracefully", async () => {
    // Mock a scenario that could cause errors
    const result = await projectInfo.execute({
      path: "/", // Root path might cause permission issues
    });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should format output as markdown", async () => {
    const result = await projectInfo.execute({});

    // Check for markdown formatting
    expect(result).toContain("##"); // Headers
    expect(result).toContain("###"); // Subheaders
    expect(result).toContain("- **"); // Bold list items
    expect(result).toContain("`"); // Code formatting
  });

  it("should validate parameter types correctly", () => {
    const schema = projectInfo.inputSchema;

    expect(schema.shape.path).toBeDefined();
    expect(schema.shape.includeSettings).toBeDefined();
    expect(schema.shape.includeFrameworks).toBeDefined();
    expect(schema.shape.includeRuntimes).toBeDefined();
  });
});
