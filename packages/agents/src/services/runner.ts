import { spawn, type Subprocess } from "bun";
import { appEvents } from "./events";
import { randomUUID } from "node:crypto";
import { platform, release } from "node:os";

export interface ServerInfo {
  serverUrl?: string;
  name: string;
  status: "starting" | "active" | "stopped" | "error";
  os: string;
  shell: string;
  cwd: string;
  command: string;
  pid?: number;
  startTime?: Date;
  uptime?: number;
}

export interface RunnerOptions {
  command: string;
}

export class RunnerService {
  private processes: Map<string, { subprocess: Subprocess; info: ServerInfo }> =
    new Map();
  private defaultShell: string;
  private defaultCwd: string;

  constructor() {
    this.defaultShell = process.env.SHELL || "/bin/bash";
    this.defaultCwd = process.cwd();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for remote control
   */
  private setupEventListeners(): void {
    // Listen for get-status requests
    appEvents.on("runner:get-status", (event) => {
      if (event.processId) {
        // Get specific process status
        const serverInfo = this.getServerInfo(event.processId);
        if (serverInfo) {
          appEvents.emit("runner:status", {
            processId: event.processId,
            status: serverInfo.status,
            serverInfo: {
              name: serverInfo.name,
              command: serverInfo.command,
              cwd: serverInfo.cwd,
              pid: serverInfo.pid,
              uptime: serverInfo.uptime,
            },
          });
        }
      } else {
        // Get all processes status
        const allProcesses = this.getAllProcesses();
        allProcesses.forEach(({ id, info }) => {
          appEvents.emit("runner:status", {
            processId: id,
            status: info.status,
            serverInfo: {
              name: info.name,
              command: info.command,
              cwd: info.cwd,
              pid: info.pid,
              uptime: info.uptime,
            },
          });
        });
      }
    });

    // Listen for restart requests
    appEvents.on("runner:restart", async (event) => {
      const success = await this.restart(event.processId, event.newCommand);
      if (!success) {
        appEvents.emit("runner:error", {
          processId: event.processId,
          error: "Failed to restart process",
          serverInfo: {
            name: "unknown",
            command: event.newCommand || "unknown",
            cwd: "unknown",
          },
        });
      }
    });
  }

  /**
   * Start a new process and stream its output to events
   */
  async start(options: RunnerOptions): Promise<string> {
    const processId = randomUUID();
    return this.startWithId(processId, options);
  }

  /**
   * Internal method to start a process with a specific ID (used for restarts)
   */
  private async startWithId(
    processId: string,
    options: RunnerOptions,
  ): Promise<string> {
    const { command } = options;

    // Parse command into parts
    const commandParts = command
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);
    if (commandParts.length === 0) {
      throw new Error("Command cannot be empty");
    }

    const mainCommand = commandParts[0];
    const args = commandParts.slice(1);

    // Auto-detect environment settings
    const cwd = process.cwd();
    const shell = process.env.SHELL || this.defaultShell;
    if (!mainCommand) {
      throw new Error("Main command cannot be empty");
    }
    const name = this.generateProcessName(mainCommand, args);

    const serverInfo: ServerInfo = {
      name,
      status: "starting",
      os: `${platform()} ${release()}`,
      shell,
      cwd,
      command,
      startTime: new Date(),
    };

    try {
      // Emit starting event
      appEvents.emit("runner:status", {
        processId,
        status: "starting",
        serverInfo: {
          name: serverInfo.name,
          command: serverInfo.command,
          cwd: serverInfo.cwd,
          pid: undefined,
          uptime: undefined,
        },
      });

      // Spawn the process
      const subprocess = spawn([mainCommand, ...args], {
        cwd,
        env: { ...process.env },
        stdout: "pipe",
        stderr: "pipe",
        stdin: "pipe",
      });

      serverInfo.pid = subprocess.pid;
      serverInfo.status = "active";

      // Store the process
      this.processes.set(processId, { subprocess, info: serverInfo });

      // Setup URL detection from output
      this.setupUrlDetection(processId);

      // Emit started event
      appEvents.emit("runner:started", {
        processId,
        serverInfo: {
          name: serverInfo.name,
          command: serverInfo.command,
          cwd: serverInfo.cwd,
          pid: serverInfo.pid!,
          serverUrl: serverInfo.serverUrl,
          os: serverInfo.os,
          shell: serverInfo.shell,
          startTime: serverInfo.startTime!,
        },
      });

      // Stream stdout
      this.streamOutput(processId, subprocess.stdout, "stdout");

      // Stream stderr
      this.streamOutput(processId, subprocess.stderr, "stderr");

      // Handle process exit
      subprocess.exited.then((exitCode) => {
        const processData = this.processes.get(processId);
        if (processData) {
          processData.info.status = exitCode === 0 ? "stopped" : "error";

          // Calculate uptime
          if (processData.info.startTime) {
            processData.info.uptime =
              Date.now() - processData.info.startTime.getTime();
          }

          appEvents.emit("runner:stopped", {
            processId,
            exitCode,
            serverInfo: {
              name: processData.info.name,
              command: processData.info.command,
              cwd: processData.info.cwd,
              uptime: processData.info.uptime,
            },
          });

          // Clean up after a delay to allow final events to be processed
          setTimeout(() => {
            this.processes.delete(processId);
          }, 1000);
        }
      });

      return processId;
    } catch (error) {
      serverInfo.status = "error";

      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: serverInfo.name,
          command: serverInfo.command,
          cwd: serverInfo.cwd,
        },
      });

      throw error;
    }
  }

  /**
   * Stop a running process
   */
  async stop(processId: string): Promise<boolean> {
    const processData = this.processes.get(processId);
    if (!processData) {
      return false;
    }

    try {
      processData.info.status = "stopped";
      processData.subprocess.kill();

      appEvents.emit("runner:status", {
        processId,
        status: "stopped",
        serverInfo: {
          name: processData.info.name,
          command: processData.info.command,
          cwd: processData.info.cwd,
          pid: processData.info.pid,
          uptime: processData.info.uptime,
        },
      });

      return true;
    } catch (error) {
      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: processData.info.name,
          command: processData.info.command,
          cwd: processData.info.cwd,
        },
      });

      return false;
    }
  }

  /**
   * Restart a process with the same command or a new command
   */
  async restart(processId: string, newCommand?: string): Promise<boolean> {
    const processData = this.processes.get(processId);
    if (!processData) {
      return false;
    }

    const originalCommand = processData.info.command;
    const commandToUse = newCommand || originalCommand;

    try {
      // Stop the existing process
      const stopped = await this.stop(processId);
      if (!stopped) {
        return false;
      }

      // Wait for the process to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start a new process with the same ID but new/same command
      await this.startWithId(processId, { command: commandToUse });

      appEvents.emit("runner:restarted", {
        processId,
        oldCommand: originalCommand,
        newCommand: commandToUse,
        serverInfo: {
          name: this.processes.get(processId)?.info.name || "",
          command: commandToUse,
          cwd: this.processes.get(processId)?.info.cwd || "",
          pid: this.processes.get(processId)?.info.pid,
        },
      });

      return true;
    } catch (error) {
      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: processData.info.name,
          command: commandToUse,
          cwd: processData.info.cwd,
        },
      });

      return false;
    }
  }

  /**
   * Update process info (name, serverUrl, etc.) for a running process
   */
  updateProcessInfo(
    processId: string,
    updates: Partial<Pick<ServerInfo, "name" | "serverUrl">>,
  ): boolean {
    const processData = this.processes.get(processId);
    if (!processData) {
      return false;
    }

    // Update the allowed fields
    if (updates.name !== undefined) {
      processData.info.name = updates.name;
    }
    if (updates.serverUrl !== undefined) {
      processData.info.serverUrl = updates.serverUrl;
    }

    // Emit update event
    appEvents.emit("runner:info-updated", {
      processId,
      updates,
      serverInfo: {
        name: processData.info.name,
        command: processData.info.command,
        cwd: processData.info.cwd,
        pid: processData.info.pid,
        serverUrl: processData.info.serverUrl,
      },
    });

    return true;
  }

  /**
   * Get server information for a process
   */
  getServerInfo(processId: string): ServerInfo | null {
    const processData = this.processes.get(processId);
    if (!processData) {
      return null;
    }

    // Calculate uptime
    if (processData.info.startTime) {
      processData.info.uptime =
        Date.now() - processData.info.startTime.getTime();
    }

    return { ...processData.info };
  }

  /**
   * Get all running processes
   */
  getAllProcesses(): Array<{ id: string; info: ServerInfo }> {
    return Array.from(this.processes.entries()).map(([id, { info }]) => ({
      id,
      info: { ...info },
    }));
  }

  /**
   * Send input to a running process
   */
  async sendInput(processId: string, input: string): Promise<boolean> {
    const processData = this.processes.get(processId);
    if (!processData || processData.info.status !== "active") {
      return false;
    }

    try {
      const stdin = processData.subprocess.stdin;
      if (stdin && typeof stdin === "object" && "write" in stdin) {
        // Handle FileSink or similar writable object
        (stdin as any).write(input);
      } else if (stdin && typeof stdin === "object" && "getWriter" in stdin) {
        // Handle WritableStream
        const writer = (stdin as WritableStream).getWriter();
        await writer.write(new TextEncoder().encode(input));
        writer.releaseLock();
      }

      appEvents.emit("runner:output", {
        processId,
        type: "stdout",
        chunk: `> ${input}`,
        command: processData.info.command,
        cwd: processData.info.cwd,
      });

      return true;
    } catch (error) {
      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: processData.info.name,
          command: processData.info.command,
          cwd: processData.info.cwd,
        },
      });

      return false;
    }
  }

  /**
   * Check if a process is running
   */
  isRunning(processId: string): boolean {
    const processData = this.processes.get(processId);
    return processData?.info.status === "active";
  }

  /**
   * Stop all running processes
   */
  async stopAll(): Promise<void> {
    const promises = Array.from(this.processes.keys()).map((id) =>
      this.stop(id),
    );
    await Promise.all(promises);
  }

  /**
   * Stream output from a readable stream to events
   */
  private async streamOutput(
    processId: string,
    stream: ReadableStream<Uint8Array>,
    type: "stdout" | "stderr",
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const processData = this.processes.get(processId);

        if (processData && chunk) {
          appEvents.emit("runner:output", {
            processId,
            type,
            chunk,
            command: processData.info.command,
            cwd: processData.info.cwd,
          });
        }
      }
    } catch (error) {
      const processData = this.processes.get(processId);
      if (processData) {
        appEvents.emit("runner:error", {
          processId,
          error: String(error),
          serverInfo: {
            name: processData.info.name,
            command: processData.info.command,
            cwd: processData.info.cwd,
          },
        });
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate a descriptive process name based on command
   */
  private generateProcessName(command: string, args: string[]): string {
    const fullCommand = [command, ...args].join(" ");

    // Common development server patterns
    if (
      fullCommand.includes("npm run dev") ||
      fullCommand.includes("npm start")
    ) {
      return "npm-dev-server";
    }
    if (
      fullCommand.includes("bun run dev") ||
      fullCommand.includes("bun dev")
    ) {
      return "bun-dev-server";
    }
    if (
      fullCommand.includes("yarn dev") ||
      fullCommand.includes("yarn start")
    ) {
      return "yarn-dev-server";
    }
    if (
      fullCommand.includes("pnpm dev") ||
      fullCommand.includes("pnpm start")
    ) {
      return "pnpm-dev-server";
    }
    if (fullCommand.includes("next dev")) {
      return "next-dev-server";
    }
    if (fullCommand.includes("vite")) {
      return "vite-dev-server";
    }
    if (fullCommand.includes("webpack-dev-server")) {
      return "webpack-dev-server";
    }
    if (fullCommand.includes("nodemon")) {
      return "nodemon-server";
    }
    if (fullCommand.includes("ts-node")) {
      return "ts-node-server";
    }
    if (fullCommand.includes("npx serve")) {
      return "serve-static-server";
    }

    // Docker containers
    if (command === "docker" && args.includes("run")) {
      const imageIndex = args.findIndex((arg) => !arg.startsWith("-"));
      const imageName = args[imageIndex] || "unknown";
      return `docker-${imageName.split(":")[0]}`;
    }

    // Default naming
    return `${command}-process`;
  }

  /**
   * Setup URL detection from process output
   */
  private setupUrlDetection(processId: string): void {
    const processData = this.processes.get(processId);
    if (!processData) return;

    // URL patterns commonly found in development server output
    const urlPatterns = [
      // Next.js: "- Local:        http://localhost:3000"
      /(?:Local|local):\s*(?:https?:\/\/[^\s]+)/i,
      // Vite: "Local:   http://localhost:5173/"
      /Local:\s*(https?:\/\/[^\s]+)/i,
      // Generic: "Server running on http://localhost:3000"
      /(?:running|listening|available).*?(https?:\/\/[^\s\)]+)/i,
      // Serve: "   http://localhost:3000"
      /^\s+(https?:\/\/[^\s]+)/i,
      // Serve: "Accepting connections at http://localhost:3000"
      /(?:Accepting connections at|INFO\s+).*?(https?:\/\/[^\s\)]+)/i,
      // Generic: "http://localhost:3000"
      /(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/[^\s]*)?)/i,
      // Webpack dev server: "webpack compiled with 1 warning" followed by URL
      /(https?:\/\/[^\s]+)/i,
    ];

    // Override the output handler to detect URLs
    const detectUrl = (chunk: string) => {
      for (const pattern of urlPatterns) {
        const match = chunk.match(pattern);
        if (match) {
          let detectedUrl = match[1] || match[0];

          // Clean up the URL
          detectedUrl = detectedUrl.replace(/[\)\],\s]*$/, "");

          // Validate it's a proper URL
          try {
            new URL(detectedUrl);
            processData.info.serverUrl = detectedUrl;

            // Emit updated server info
            appEvents.emit("runner:started", {
              processId,
              serverInfo: {
                name: processData.info.name,
                command: processData.info.command,
                cwd: processData.info.cwd,
                pid: processData.info.pid!,
                serverUrl: processData.info.serverUrl,
                os: processData.info.os,
                shell: processData.info.shell,
                startTime: processData.info.startTime!,
              },
            });

            break;
          } catch {
            // Invalid URL, continue searching
          }
        }
      }
    };

    // Intercept output events for this process
    const outputHandler = (event: any) => {
      if (event.processId === processId) {
        detectUrl(event.chunk);
      }
    };

    appEvents.on("runner:output", outputHandler);

    // Clean up handler when process stops
    const stopHandler = (event: any) => {
      if (event.processId === processId) {
        appEvents.off("runner:output", outputHandler);
        appEvents.off("runner:stopped", stopHandler);
      }
    };

    appEvents.on("runner:stopped", stopHandler);
  }
}

// Create a singleton instance
export const runnerService = new RunnerService();

// Convenience functions
export const startDevelopmentServer = (command: string): Promise<string> => {
  return runnerService.start({ command });
};

export const startNpmDev = async (cwd?: string): Promise<string> => {
  const command = cwd ? `cd ${cwd} && npm run dev` : "npm run dev";
  return runnerService.start({ command });
};

export const startBunDev = async (cwd?: string): Promise<string> => {
  const command = cwd ? `cd ${cwd} && bun run dev` : "bun run dev";
  return runnerService.start({ command });
};

export const startYarnDev = async (cwd?: string): Promise<string> => {
  const command = cwd ? `cd ${cwd} && yarn dev` : "yarn dev";
  return runnerService.start({ command });
};

export const startPnpmDev = async (cwd?: string): Promise<string> => {
  const command = cwd ? `cd ${cwd} && pnpm dev` : "pnpm dev";
  return runnerService.start({ command });
};

export const startNextDev = async (cwd?: string): Promise<string> => {
  const command = cwd ? `cd ${cwd} && next dev` : "next dev";
  return runnerService.start({ command });
};

export const startViteDev = async (
  cwd?: string,
  port?: number,
): Promise<string> => {
  const portFlag = port ? ` --port ${port}` : "";
  const command = cwd ? `cd ${cwd} && vite${portFlag}` : `vite${portFlag}`;
  return runnerService.start({ command });
};

export const startServe = async (
  directory?: string,
  port?: number,
): Promise<string> => {
  const dir = directory || ".";
  const portFlag = port ? ` -p ${port}` : "";
  const command = `npx serve ${dir}${portFlag}`;
  return runnerService.start({ command });
};

// Event-based convenience functions
export const requestStatus = (processId?: string): void => {
  appEvents.emit("get-status", { processId });
};

export const requestRestart = (
  processId: string,
  newCommand?: string,
): void => {
  appEvents.emit("restart", { processId, newCommand });
};
