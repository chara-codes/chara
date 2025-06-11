import { describe, test, expect } from "bun:test";
import { currentDir } from "../current-dir";

describe("currentDir tool", () => {
  test("should return current working directory", async () => {
    const result = await currentDir.execute({});

    expect(typeof result).toBe("string");
    expect(result).toBeTruthy();
    expect(result).toBe(process.cwd());
  });

  test("should return absolute path", async () => {
    const result = await currentDir.execute({});

    expect(result.startsWith("/")).toBe(true);
  });

  test("should have correct tool metadata", () => {
    expect(currentDir.description).toBe("Show path to the current working directory");
    expect(currentDir.parameters).toBeDefined();
  });

  test("should handle empty parameters", async () => {
    const result = await currentDir.execute({});

    expect(result).toBe(process.cwd());
  });
});
