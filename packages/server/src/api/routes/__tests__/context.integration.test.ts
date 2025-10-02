import { describe, expect, test } from "bun:test";
import { contextRouter } from "../context";

describe("Context Router", () => {
  test("should have getFileList endpoint", () => {
    expect(contextRouter._def.procedures.getFileList).toBeDefined();
  });

  test("should have getFileContent endpoint", () => {
    expect(contextRouter._def.procedures.getFileContent).toBeDefined();
  });
});
