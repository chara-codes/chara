import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDebugConfig, isDebugMode } from "../debug";

// Mock import.meta.env for testing
const mockImportMeta = {
  env: {} as Record<string, string>,
};

// Mock import.meta globally
global.import = {
  meta: mockImportMeta,
} as ImportMeta & { meta: typeof mockImportMeta };

describe("Debug Utilities", () => {
  beforeEach(() => {
    // Clear environment before each test
    mockImportMeta.env = {};
  });

  afterEach(() => {
    // Clean up after each test
    mockImportMeta.env = {};
  });

  describe("isDebugMode", () => {
    it("should return false when VITE_DEBUG_PARTS is not set", () => {
      expect(isDebugMode()).toBe(false);
    });

    it("should return false when VITE_DEBUG_PARTS is false", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "false";
      expect(isDebugMode()).toBe(false);
    });

    it("should return false when VITE_DEBUG_PARTS is 0", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "0";
      expect(isDebugMode()).toBe(false);
    });

    it("should return false when VITE_DEBUG_PARTS is no", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "no";
      expect(isDebugMode()).toBe(false);
    });

    it("should return true when VITE_DEBUG_PARTS is true", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "true";
      expect(isDebugMode()).toBe(true);
    });

    it("should return true when VITE_DEBUG_PARTS is 1", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "1";
      expect(isDebugMode()).toBe(true);
    });

    it("should return true when VITE_DEBUG_PARTS is yes", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "yes";
      expect(isDebugMode()).toBe(true);
    });

    it("should handle undefined import.meta.env gracefully", () => {
      // @ts-expect-error - Testing edge case
      global.import.meta.env = undefined;
      expect(isDebugMode()).toBe(false);
    });

    it("should handle missing import.meta gracefully", () => {
      // @ts-expect-error - Testing edge case
      global.import.meta = undefined;
      expect(isDebugMode()).toBe(false);
    });
  });

  describe("getDebugConfig", () => {
    it("should return all false when debug mode is disabled", () => {
      const config = getDebugConfig();
      expect(config).toEqual({
        debugMode: false,
        showPartSource: false,
        showAllParts: false,
      });
    });

    it("should return all true when debug mode is enabled", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "true";
      const config = getDebugConfig();
      expect(config).toEqual({
        debugMode: true,
        showPartSource: true,
        showAllParts: true,
      });
    });

    it("should be consistent with isDebugMode", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "1";
      const config = getDebugConfig();
      expect(config.debugMode).toBe(isDebugMode());
    });
  });

  describe("Environment variable variations", () => {
    const truthyValues = ["true", "1", "yes"];
    const falsyValues = ["false", "0", "no", "", "other", undefined];

    truthyValues.forEach((value) => {
      it(`should return true for VITE_DEBUG_PARTS="${value}"`, () => {
        mockImportMeta.env.VITE_DEBUG_PARTS = value;
        expect(isDebugMode()).toBe(true);
      });
    });

    falsyValues.forEach((value) => {
      it(`should return false for VITE_DEBUG_PARTS="${value}"`, () => {
        if (value !== undefined) {
          mockImportMeta.env.VITE_DEBUG_PARTS = value;
        }
        expect(isDebugMode()).toBe(false);
      });
    });
  });

  describe("Case sensitivity", () => {
    it('should be case sensitive for "true"', () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "TRUE";
      expect(isDebugMode()).toBe(false);
    });

    it('should be case sensitive for "yes"', () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "YES";
      expect(isDebugMode()).toBe(false);
    });
  });

  describe("Whitespace handling", () => {
    it("should not trim whitespace", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = " true ";
      expect(isDebugMode()).toBe(false);
    });

    it("should not handle tabs", () => {
      mockImportMeta.env.VITE_DEBUG_PARTS = "\ttrue\t";
      expect(isDebugMode()).toBe(false);
    });
  });
});
