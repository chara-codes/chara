import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { startAgentsAction, stopAgentsAction } from "../start-agents";

// Mock dependencies
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};

mock.module("@chara/logger", () => ({
  logger: mockLogger,
}));

const mockStartServer = mock();
const mockExistsGlobalConfig = mock();
const mockReadGlobalConfig = mock();

mock.module("@chara/agents", () => ({
  startServer: mockStartServer,
}));

mock.module("@chara/settings", () => ({
  existsGlobalConfig: mockExistsGlobalConfig,
  readGlobalConfig: mockReadGlobalConfig,
}));

mock.module("../utils/prompts", () => ({
  spinner: mock(() => ({
    start: mock(() => {}),
    stop: mock(() => {}),
  })),
}));

describe("start-agents action", () => {
  beforeEach(() => {
    mockStartServer.mockClear();
    mockExistsGlobalConfig.mockClear();
    mockReadGlobalConfig.mockClear();
    mockLogger.debug.mockClear();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.setLevel.mockClear();

    mockExistsGlobalConfig.mockResolvedValue(true);
    mockReadGlobalConfig.mockResolvedValue({
      env: {
        OPENAI_API_KEY: "test-key",
      },
    });
  });

  afterEach(() => {
    mockStartServer.mockRestore();
    mockExistsGlobalConfig.mockRestore();
    mockReadGlobalConfig.mockRestore();
    mockLogger.debug.mockRestore();
    mockLogger.info.mockRestore();
    mockLogger.warn.mockRestore();
    mockLogger.error.mockRestore();
    mockLogger.setLevel.mockRestore();
  });

  describe("startAgentsAction", () => {
    test("should start server successfully with default options", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      const result = await startAgentsAction({
        silent: true,
        verbose: false,
      });

      expect(result).toEqual({
        server: mockServer,
        port: 3031,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: 3031,
        mcp: { enabled: false },
        runner: { enabled: false },
        websocket: { enabled: false },
      });
    });

    test("should start server with custom port", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      const result = await startAgentsAction({
        port: 8080,
        silent: true,
        verbose: false,
      });

      expect(result).toEqual({
        server: mockServer,
        port: 8080,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: 8080,
        mcp: { enabled: false },
        runner: { enabled: false },
        websocket: { enabled: false },
      });
    });

    test("should start server with enabled features", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      const result = await startAgentsAction({
        port: 3031,
        mcp: true,
        runner: true,
        websocket: true,
        silent: true,
        verbose: false,
      });

      expect(result).toEqual({
        server: mockServer,
        port: 3031,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: 3031,
        mcp: { enabled: true },
        runner: { enabled: true },
        websocket: { enabled: true },
      });
    });

    test("should start server with only runner enabled", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      const result = await startAgentsAction({
        port: 3031,
        runner: true,
        silent: true,
        verbose: false,
      });

      expect(result).toEqual({
        server: mockServer,
        port: 3031,
      });

      expect(mockStartServer).toHaveBeenCalledWith({
        port: 3031,
        mcp: { enabled: false },
        runner: { enabled: true },
        websocket: { enabled: false },
      });
    });

    test("should log enabled features in verbose mode", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      await startAgentsAction({
        port: 3031,
        mcp: true,
        runner: true,
        websocket: true,
        silent: true,
        verbose: true,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Enabled features: MCP, Runner, WebSocket",
      );
    });

    test("should throw error when config does not exist", async () => {
      mockExistsGlobalConfig.mockResolvedValue(false);

      await expect(
        startAgentsAction({
          silent: true,
          verbose: false,
        }),
      ).rejects.toThrow(
        "No configuration found. Run 'chara init' first to set up your providers.",
      );
    });

    test("should throw error when config cannot be read", async () => {
      const configError = new Error("Config read failed");
      mockReadGlobalConfig.mockRejectedValue(configError);

      await expect(
        startAgentsAction({
          silent: true,
          verbose: false,
        }),
      ).rejects.toThrow(configError);
    });

    test("should throw error when server fails to start", async () => {
      const serverError = new Error("Server start failed");
      mockStartServer.mockRejectedValue(serverError);

      await expect(
        startAgentsAction({
          silent: true,
          verbose: false,
        }),
      ).rejects.toThrow(serverError);
    });

    test("should set debug logging when verbose is true", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };
      mockStartServer.mockResolvedValue(mockServer);

      await startAgentsAction({
        silent: true,
        verbose: true,
      });

      expect(mockLogger.setLevel).toHaveBeenCalledWith("debug");
    });
  });

  describe("stopAgentsAction", () => {
    test("should stop server successfully", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => Promise.resolve()),
        restart: mock(() => Promise.resolve()),
      };

      await stopAgentsAction({
        server: mockServer,
        silent: true,
        verbose: false,
      });

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle server without stop method", async () => {
      const mockServer = {} as any;

      await expect(
        stopAgentsAction({
          server: mockServer,
          silent: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();
    });

    test("should handle server stop error gracefully", async () => {
      const mockServer = {
        server: {} as any,
        stop: mock(() => {
          throw new Error("Stop failed");
        }),
        restart: mock(() => Promise.resolve()),
      };

      await expect(
        stopAgentsAction({
          server: mockServer,
          silent: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();

      expect(mockServer.stop).toHaveBeenCalledTimes(1);
    });

    test("should handle null server", async () => {
      await expect(
        stopAgentsAction({
          server: null,
          silent: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();
    });

    test("should handle undefined server", async () => {
      await expect(
        stopAgentsAction({
          server: undefined,
          silent: true,
          verbose: false,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
