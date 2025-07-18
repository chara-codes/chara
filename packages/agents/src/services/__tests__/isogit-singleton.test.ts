import { describe, test, expect } from "bun:test";
import { isoGitService, IsoGitService } from "../isogit";

describe("IsoGitService Singleton", () => {
  test("should export a singleton instance", () => {
    expect(isoGitService).toBeInstanceOf(IsoGitService);
  });

  test("should always return the same instance", () => {
    const instance1 = isoGitService;
    const instance2 = isoGitService;

    expect(instance1).toBe(instance2);
  });

  test("should have all expected methods", () => {
    expect(typeof isoGitService.initializeRepository).toBe("function");
    expect(typeof isoGitService.saveToHistory).toBe("function");
    expect(typeof isoGitService.isRepositoryInitialized).toBe("function");
  });

  test("should be different from new instance", () => {
    const newInstance = new IsoGitService();

    expect(isoGitService).not.toBe(newInstance);
    expect(isoGitService).toBeInstanceOf(IsoGitService);
    expect(newInstance).toBeInstanceOf(IsoGitService);
  });
});
