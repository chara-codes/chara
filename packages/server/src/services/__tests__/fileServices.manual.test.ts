/**
 * Manual test file for FileListingService and FileContentService
 * Run with: bun test packages/server/src/services/__tests__/fileServices.manual.test.ts
 */

import { describe, test, expect } from "bun:test";
import { FileListingService } from "../fileListingService";
import { FileContentService } from "../fileContentService";
import path from "path";

describe("FileListingService", () => {
  test("should list files in current directory", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileListingService(workingDir);

    const result = await service.listFiles({
      maxDepth: 2,
      includeHidden: false,
    });

    expect(result).toBeDefined();
    expect(result.files).toBeInstanceOf(Array);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.gitIgnoreRules).toBeInstanceOf(Array);

    console.log("Total files found:", result.totalCount);
    console.log("Git ignore rules:", result.gitIgnoreRules.length);
  });

  test("should respect .gitignore rules", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileListingService(workingDir);

    const result = await service.listFiles({
      maxDepth: 2,
      includeHidden: false,
    });

    // Check that node_modules is not in the list (should be gitignored)
    const nodeModulesEntry = result.files.find(
      (file) => file.name === "node_modules"
    );
    
    expect(nodeModulesEntry).toBeUndefined();
  });
});

describe("FileContentService", () => {
  test("should read package.json content", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileContentService(workingDir);

    const result = await service.getFileContent("package.json");

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe("application/json");
    expect(result.isBinary).toBe(false);
    expect(result.encoding).toBe("utf-8");
    expect(result.size).toBeGreaterThan(0);

    console.log("File size:", result.size);
    console.log("MIME type:", result.mimeType);
  });

  test("should detect text files correctly", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileContentService(workingDir);

    const result = await service.getFileContent("README.md");

    expect(result.mimeType).toBe("text/markdown");
    expect(result.isBinary).toBe(false);
    expect(result.encoding).toBe("utf-8");
  });

  test("should reject file outside working directory", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileContentService(workingDir);

    await expect(
      service.getFileContent("../../../etc/passwd")
    ).rejects.toThrow("Invalid file path");
  });

  test("should handle non-existent file", async () => {
    // Use the root directory of the project (2 levels up from packages/server)
    const workingDir = path.resolve(process.cwd(), "../..");
    const service = new FileContentService(workingDir);

    await expect(
      service.getFileContent("non-existent-file.txt")
    ).rejects.toThrow("File not found");
  });
});
