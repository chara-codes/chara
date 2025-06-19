"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { runnerService, type RunnerServiceCallbacks } from "../services";

export interface RunnerProcess {
  processId: string;
  status: "starting" | "active" | "stopped" | "error";
  serverInfo: {
    name: string;
    command: string;
    cwd: string;
    pid?: number;
    uptime?: number;
    serverUrl?: string;
    host?: string;
    port?: number;
    os?: string;
    shell?: string;
    startTime?: Date;
  };
  output: Array<{
    id: string;
    timestamp: Date;
    type: "stdout" | "stderr";
    content: string;
  }>;
  error?: string;
}

interface RunnerState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;

  // Runner processes
  processes: Record<string, RunnerProcess>;
  activeProcessId: string | null;

  // UI state
  isTerminalOpen: boolean;
  terminalHeight: number;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  getStatus: (processId?: string) => void;
  restart: (processId: string, newCommand?: string) => void;
  clearOutput: (processId: string) => void;
  clearAllOutput: () => void;
  setActiveProcess: (processId: string | null) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;

  // Internal state setters
  setConnectionState: (
    isConnected: boolean,
    isConnecting: boolean,
    error?: string,
  ) => void;
  setReconnectAttempts: (attempts: number) => void;
  updateProcess: (processId: string, updates: Partial<RunnerProcess>) => void;
  addOutput: (
    processId: string,
    type: "stdout" | "stderr",
    content: string,
  ) => void;
}

const TERMINAL_HEIGHT_CONSTRAINTS = {
  MIN: 200,
  MAX: 600,
  DEFAULT: 300,
};

export const useRunnerStore = create<RunnerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      reconnectAttempts: 0,
      processes: {},
      activeProcessId: null,
      isTerminalOpen: false,
      terminalHeight: TERMINAL_HEIGHT_CONSTRAINTS.DEFAULT,

      // Connection actions
      connect: async () => {
        const state = get();
        if (state.isConnected || state.isConnecting) {
          return;
        }

        set({ isConnecting: true, connectionError: null });

        const callbacks: RunnerServiceCallbacks = {
          onConnectionOpen: () => {
            set({
              isConnected: true,
              isConnecting: false,
              connectionError: null,
              reconnectAttempts: 0,
            });

            // Request initial status for all processes
            get().getStatus();
          },

          onConnectionClose: (wasClean) => {
            set({
              isConnected: false,
              isConnecting: false,
              connectionError: wasClean ? null : "Connection lost",
            });
          },

          onConnectionError: (error) => {
            set({
              isConnected: false,
              isConnecting: false,
              connectionError: "Failed to connect to runner service",
            });
          },

          onRunnerStarted: (data) => {
            const process: RunnerProcess = {
              processId: data.processId,
              status: "active",
              serverInfo: {
                ...data.serverInfo,
                startTime: new Date(data.serverInfo.startTime),
              },
              output: [],
            };

            set((state) => ({
              processes: {
                ...state.processes,
                [data.processId]: process,
              },
              activeProcessId: state.activeProcessId || data.processId,
            }));
          },

          onRunnerStopped: (data) => {
            get().updateProcess(data.processId, {
              status: "stopped",
              serverInfo: {
                ...get().processes[data.processId]?.serverInfo,
                ...data.serverInfo,
              },
            });
          },

          onRunnerOutput: (data) => {
            get().addOutput(data.processId, data.type, data.chunk);
          },

          onRunnerError: (data) => {
            get().updateProcess(data.processId, {
              status: "error",
              error: data.error,
              serverInfo: {
                ...get().processes[data.processId]?.serverInfo,
                ...data.serverInfo,
              },
            });
          },

          onRunnerStatus: (data) => {
            const existingProcess = get().processes[data.processId];

            // Convert logs from status to output format if available
            let outputLogs = existingProcess?.output || [];
            if (data.logs && data.logs.length > 0) {
              outputLogs = data.logs.map((log) => ({
                id: log.id,
                timestamp: new Date(log.timestamp),
                type: log.type === "error" ? "stderr" : log.type,
                content: log.content,
              }));
            }

            const process: RunnerProcess = {
              processId: data.processId,
              status: data.status,
              serverInfo: {
                ...existingProcess?.serverInfo,
                ...data.serverInfo,
              },
              output: outputLogs,
              error: existingProcess?.error,
            };

            set((state) => ({
              processes: {
                ...state.processes,
                [data.processId]: process,
              },
              activeProcessId: state.activeProcessId || data.processId,
            }));
          },

          onRunnerRestarted: (data) => {
            get().updateProcess(data.processId, {
              status: "active",
              serverInfo: {
                ...get().processes[data.processId]?.serverInfo,
                ...data.serverInfo,
                command: data.newCommand,
              },
              error: undefined, // Clear any previous errors
            });

            // Clear output on restart
            get().clearOutput(data.processId);
          },

          onRunnerInfoUpdated: (data) => {
            const existingProcess = get().processes[data.processId];
            if (existingProcess) {
              get().updateProcess(data.processId, {
                serverInfo: {
                  ...existingProcess.serverInfo,
                  ...data.serverInfo,
                  ...data.updates,
                },
              });
            }
          },
        };

        try {
          await runnerService.connect(callbacks);
        } catch (error) {
          set({
            isConnecting: false,
            connectionError:
              error instanceof Error ? error.message : "Connection failed",
          });
          throw error;
        }
      },

      disconnect: () => {
        runnerService.disconnect();
        set({
          isConnected: false,
          isConnecting: false,
          connectionError: null,
          reconnectAttempts: 0,
        });
      },

      getStatus: (processId) => {
        if (get().isConnected) {
          runnerService.getStatus(processId);
        }
      },

      restart: (processId, newCommand) => {
        if (get().isConnected) {
          runnerService.restart(processId, newCommand);
        }
      },

      clearOutput: (processId) => {
        set((state) => ({
          processes: {
            ...state.processes,
            [processId]: {
              ...state.processes[processId],
              output: [],
            },
          },
        }));
      },

      clearAllOutput: () => {
        set((state) => ({
          processes: Object.keys(state.processes).reduce(
            (acc, processId) => {
              acc[processId] = {
                ...state.processes[processId],
                output: [],
              };
              return acc;
            },
            {} as Record<string, RunnerProcess>,
          ),
        }));
      },

      setActiveProcess: (processId) => {
        set({ activeProcessId: processId });
      },

      toggleTerminal: () => {
        set((state) => ({ isTerminalOpen: !state.isTerminalOpen }));
      },

      setTerminalHeight: (height) => {
        const constrainedHeight = Math.max(
          TERMINAL_HEIGHT_CONSTRAINTS.MIN,
          Math.min(height, TERMINAL_HEIGHT_CONSTRAINTS.MAX),
        );
        set({ terminalHeight: constrainedHeight });
      },

      // Internal state setters
      setConnectionState: (isConnected, isConnecting, error) => {
        set({
          isConnected,
          isConnecting,
          connectionError: error || null,
        });
      },

      setReconnectAttempts: (attempts) => {
        set({ reconnectAttempts: attempts });
      },

      updateProcess: (processId, updates) => {
        set((state) => {
          const existingProcess = state.processes[processId];
          if (!existingProcess) return state;

          return {
            processes: {
              ...state.processes,
              [processId]: {
                ...existingProcess,
                ...updates,
                serverInfo: {
                  ...existingProcess.serverInfo,
                  ...updates.serverInfo,
                },
              },
            },
          };
        });
      },

      addOutput: (processId, type, content) => {
        set((state) => {
          const existingProcess = state.processes[processId];
          if (!existingProcess) return state;

          const newOutput = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type,
            content,
          };

          return {
            processes: {
              ...state.processes,
              [processId]: {
                ...existingProcess,
                output: [...existingProcess.output, newOutput],
              },
            },
          };
        });
      },
    }),
    {
      name: "runner-store",
    },
  ),
);

// Selector hooks for common use cases
export const useRunnerConnection = () => {
  const isConnected = useRunnerStore((state) => state.isConnected);
  const isConnecting = useRunnerStore((state) => state.isConnecting);
  const connectionError = useRunnerStore((state) => state.connectionError);
  const reconnectAttempts = useRunnerStore((state) => state.reconnectAttempts);

  return { isConnected, isConnecting, connectionError, reconnectAttempts };
};

export const useRunnerProcesses = () =>
  useRunnerStore((state) => state.processes);

export const useActiveRunnerProcess = () =>
  useRunnerStore((state) => {
    const { processes, activeProcessId } = state;
    return activeProcessId ? processes[activeProcessId] : null;
  });

export const useRunnerTerminal = () => {
  const isTerminalOpen = useRunnerStore((state) => state.isTerminalOpen);
  const terminalHeight = useRunnerStore((state) => state.terminalHeight);

  return { isTerminalOpen, terminalHeight };
};

// Action selectors
export const useRunnerConnect = () => useRunnerStore((state) => state.connect);
export const useRunnerDisconnect = () =>
  useRunnerStore((state) => state.disconnect);
export const useRunnerGetStatus = () =>
  useRunnerStore((state) => state.getStatus);
export const useRunnerRestart = () => useRunnerStore((state) => state.restart);
export const useRunnerClearOutput = () =>
  useRunnerStore((state) => state.clearOutput);
export const useRunnerSetActiveProcess = () =>
  useRunnerStore((state) => state.setActiveProcess);
export const useRunnerToggleTerminal = () =>
  useRunnerStore((state) => state.toggleTerminal);
export const useRunnerSetTerminalHeight = () =>
  useRunnerStore((state) => state.setTerminalHeight);

// Constants for external use
export const RUNNER_TERMINAL_HEIGHT_CONSTRAINTS = TERMINAL_HEIGHT_CONSTRAINTS;
