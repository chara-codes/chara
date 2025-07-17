import os from "node:os";
import { v4 as uuidv4 } from "uuid";
import { appEvents } from "../events";
import type { ServerInfo, RunnerOptions, ProcessData, LogEntry } from "./types";
import { setupUrlDetection } from "./url-detection";
import { generateProcessName } from "./process-names";
import { streamOutput } from "./output-streaming";

export type { ServerInfo, RunnerOptions } from "./types";

/**
 * Service for managing long-running processes like development servers
 */
class RunnerService {
  private processes = new Map<string, ProcessData>();
  private defaultShell = "/bin/bash";
  private defaultCwd = process.cwd();
  private readonly LOG_BUFFER_SIZE = 30; // Maximum number of logs to keep in buffer

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for process management
   */
  private setupEventListeners(): void {
    // Listen for get-status requests
    appEvents.on("runner:get-status", async (event) => {
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
              serverUrl: serverInfo.serverUrl,
              host: serverInfo.host,
              port: serverInfo.port,
            },
            logs: this.getProcessLogs(event.processId),
          });
        }
      } else {
        // Get all processes status
        const allProcesses = this.getAllProcesses();

        // If only one process exists, return its status
        if (allProcesses.length === 1) {
          const { id, info } = allProcesses[0];
          appEvents.emit("runner:status", {
            processId: id,
            status: info.status,
            serverInfo: {
              name: info.name,
              command: info.command,
              cwd: info.cwd,
              pid: info.pid,
              uptime: info.uptime,
              serverUrl: info.serverUrl,
              host: info.host,
              port: info.port,
            },
            logs: this.getProcessLogs(id),
          });
        } else {
          // Return all processes if multiple exist
          for (const { id, info } of allProcesses) {
            appEvents.emit("runner:status", {
              processId: id,
              status: info.status,
              serverInfo: {
                name: info.name,
                command: info.command,
                cwd: info.cwd,
                pid: info.pid,
                uptime: info.uptime,
                serverUrl: info.serverUrl,
                host: info.host,
                port: info.port,
              },
              logs: this.getProcessLogs(id),
            });
          }
        }
      }
    });

    // Listen for restart requests
    appEvents.on("runner:restart", async (event) => {
      const success = await this.restart(event.processId, event.newCommand);
      if (!success) {
        appEvents.emit("runner:error", {
          processId: event.processId,
          error: "Failed to restart process",
          serverInfo: null,
        });
      }
    });

    // Listen for clear logs requests
    appEvents.on("runner:clear-logs", (event) => {
      this.clearProcessLogs(event.processId);

      // Add a log entry indicating logs were cleared
      this.addLogToBuffer(event.processId, {
        id: uuidv4(),
        timestamp: new Date(),
        type: "stdout",
        content: "--- Logs cleared ---",
        processId: event.processId,
      });

      // Emit status update to notify clients
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
            serverUrl: serverInfo.serverUrl,
            host: serverInfo.host,
            port: serverInfo.port,
          },
          logs: this.getProcessLogs(event.processId),
        });
      }
    });
  }

  /**
   * Start a new process
   */
  async start(options: RunnerOptions): Promise<string> {
    const processId = uuidv4();
    return this.startWithId(processId, options);
  }

  /**
   * Start a process with a specific ID
   */
  private async startWithId(
    processId: string,
    options: RunnerOptions
  ): Promise<string> {
    const { command, cwd = this.defaultCwd } = options;

    // Parse command and arguments
    const parts = command.trim().split(/\s+/);
    const mainCommand = parts[0];
    const args = parts.slice(1);

    // Create server info
    const serverInfo: ServerInfo = {
      name: generateProcessName(String(mainCommand), args),
      status: "starting",
      os: `${os.platform()} ${os.release()}`,
      shell: this.defaultShell,
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
          serverUrl: undefined,
          host: undefined,
          port: undefined,
        },
      });

      // Spawn the process
      const subprocess = Bun.spawn([String(mainCommand), ...args], {
        cwd,
        env: { ...process.env },
        stdout: "pipe",
        stderr: "pipe",
      });

      serverInfo.pid = subprocess.pid;
      serverInfo.status = "active";

      // Store the process
      const processData: ProcessData = {
        subprocess,
        info: serverInfo,
        logBuffer: [],
      };
      this.processes.set(processId, processData);

      // Setup URL detection from output
      setupUrlDetection(processId, processData);

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
      streamOutput(
        processId,
        subprocess.stdout,
        "stdout",
        this.processes,
        this.addLogToBuffer.bind(this)
      );

      // Stream stderr
      streamOutput(
        processId,
        subprocess.stderr,
        "stderr",
        this.processes,
        this.addLogToBuffer.bind(this)
      );

      // Handle process exit
      subprocess.exited.then((exitCode) => {
        const processData = this.processes.get(processId);
        if (processData) {
          processData.info.status = exitCode === 0 ? "stopped" : "error";

          appEvents.emit("runner:stopped", {
            processId,
            exitCode,
            serverInfo: {
              name: processData.info.name,
              command: processData.info.command,
              cwd: processData.info.cwd,
            },
          });

          // Clean up after some time to allow for final events
          setTimeout(() => {
            this.processes.delete(processId);
          }, 5000);
        }
      });

      return processId;
    } catch (error) {
      console.error(`Command ${command} not available:`, error);

      // Update status to error
      serverInfo.status = "error";
      const processData: ProcessData = {
        subprocess: null,
        info: serverInfo,
        logBuffer: [],
      };
      this.processes.set(processId, processData);

      // Add error to log buffer
      this.addLogToBuffer(processId, {
        id: uuidv4(),
        timestamp: new Date(),
        type: "error",
        content: String(error),
        processId,
      });

      // Emit error event
      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: serverInfo.name,
          command: serverInfo.command,
          cwd: serverInfo.cwd,
        },
      });

      return processId;
    }
  }

  /**
   * Stop a running process
   */
  async stop(processId: string): Promise<boolean> {
    const processData = this.processes.get(processId);

    if (!processData || !processData.subprocess) {
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
          serverUrl: processData.info.serverUrl,
          host: processData.info.host,
          port: processData.info.port,
        },
        logs: this.getProcessLogs(processId),
      });

      return true;
    } catch (error) {
      // Add error to log buffer
      this.addLogToBuffer(processId, {
        id: uuidv4(),
        timestamp: new Date(),
        type: "error",
        content: String(error),
        processId,
      });

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
   * Restart a process
   */
  async restart(processId: string, newCommand?: string): Promise<boolean> {
    const processData = this.processes.get(processId);

    if (!processData) {
      return false;
    }

    const oldCommand = processData.info.command;
    const commandToUse = newCommand || oldCommand;
    const cwd = processData.info.cwd;

    try {
      // Stop the current process
      if (processData.subprocess) {
        processData.subprocess.kill();
        // Wait for process to exit
        await processData.subprocess.exited;
      }

      // Clear the subprocess reference but keep the processData
      processData.subprocess = null;
      processData.info.status = "starting";

      // Parse command and arguments
      const parts = commandToUse.trim().split(/\s+/);
      const mainCommand = parts[0];
      const args = parts.slice(1);

      // Update server info for restart
      processData.info.command = commandToUse;
      processData.info.startTime = new Date();
      processData.info.pid = undefined;
      processData.info.status = "starting";

      // Emit starting event
      appEvents.emit("runner:status", {
        processId,
        status: "starting",
        serverInfo: {
          name: processData.info.name,
          command: processData.info.command,
          cwd: processData.info.cwd,
          pid: undefined,
          uptime: undefined,
          serverUrl: processData.info.serverUrl,
          host: processData.info.host,
          port: processData.info.port,
        },
        logs: this.getProcessLogs(processId),
      });

      // Spawn the new process
      const subprocess = Bun.spawn([String(mainCommand), ...args], {
        cwd,
        env: { ...process.env },
        stdout: "pipe",
        stderr: "pipe",
      });

      processData.subprocess = subprocess;
      processData.info.pid = subprocess.pid;
      processData.info.status = "active";

      // Setup URL detection from output
      setupUrlDetection(processId, processData);

      // Emit restarted event
      appEvents.emit("runner:restarted", {
        processId,
        oldCommand,
        newCommand: commandToUse,
        serverInfo: {
          name: processData.info.name,
          command: commandToUse,
          cwd,
          pid: processData.info.pid,
        },
      });

      // Stream stdout
      streamOutput(
        processId,
        subprocess.stdout,
        "stdout",
        this.processes,
        this.addLogToBuffer.bind(this)
      );

      // Stream stderr
      streamOutput(
        processId,
        subprocess.stderr,
        "stderr",
        this.processes,
        this.addLogToBuffer.bind(this)
      );

      // Handle process exit
      subprocess.exited.then((exitCode) => {
        const processData = this.processes.get(processId);
        if (processData) {
          processData.info.status = exitCode === 0 ? "stopped" : "error";

          appEvents.emit("runner:stopped", {
            processId,
            exitCode,
            serverInfo: {
              name: processData.info.name,
              command: processData.info.command,
              cwd: processData.info.cwd,
            },
          });

          // Clean up after some time to allow for final events
          setTimeout(() => {
            this.processes.delete(processId);
          }, 5000);
        }
      });

      return true;
    } catch (error) {
      // Add error to log buffer
      this.addLogToBuffer(processId, {
        id: uuidv4(),
        timestamp: new Date(),
        type: "error",
        content: String(error),
        processId,
      });

      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: processData.info.name,
          command: oldCommand,
          cwd,
        },
      });
      return false;
    }
  }

  /**
   * Update process info
   */
  updateProcessInfo(
    processId: string,
    updates: Partial<Pick<ServerInfo, "name" | "serverUrl" | "host" | "port">>
  ): boolean {
    const processData = this.processes.get(processId);

    if (!processData) {
      return false;
    }

    // Update the process info
    if (updates.name !== undefined) {
      processData.info.name = updates.name;
    }
    if (updates.serverUrl !== undefined) {
      processData.info.serverUrl = updates.serverUrl;
    }
    if (updates.host !== undefined) {
      processData.info.host = updates.host;
    }
    if (updates.port !== undefined) {
      processData.info.port = updates.port;
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
    return Array.from(this.processes.entries()).map(([id, processData]) => ({
      id,
      info: { ...processData.info },
    }));
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
      this.stop(id)
    );
    await Promise.all(promises);
  }

  /**
   * Add a log entry to the process buffer
   */
  addLogToBuffer(processId: string, logEntry: LogEntry): void {
    const processData = this.processes.get(processId);
    if (!processData) {
      return;
    }

    // Add log to buffer
    processData.logBuffer.push(logEntry);

    // Maintain buffer size limit
    if (processData.logBuffer.length > this.LOG_BUFFER_SIZE) {
      processData.logBuffer.shift(); // Remove oldest log
    }
  }

  /**
   * Get logs for a specific process
   */
  getProcessLogs(processId: string): LogEntry[] {
    const processData = this.processes.get(processId);
    return processData ? [...processData.logBuffer] : [];
  }

  /**
   * Clear logs for a specific process
   */
  clearProcessLogs(processId: string): void {
    const processData = this.processes.get(processId);
    if (processData) {
      processData.logBuffer = [];
    }
  }
}

// Export the class for testing
export { RunnerService };

// Create a singleton instance
export const runnerService = new RunnerService();

// Event-based control functions
export const requestStatus = (processId?: string): void => {
  appEvents.emit("runner:get-status", { processId });
};

export const requestRestart = (
  processId: string,
  newCommand?: string
): void => {
  appEvents.emit("runner:restart", { processId, newCommand });
};

export const clearLogs = (processId: string): void => {
  appEvents.emit("runner:clear-logs", { processId });
};
