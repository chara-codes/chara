import type { DropdownItem, InputContextItem } from "@chara/core";
import type { RunnerProcess } from "@chara/core";

// Function to create dropdown items
export const createDropdownItems = (
  startElementSelection: () => void,
  triggerFileUpload: () => void,
  onAddContext: (item: InputContextItem) => void,
  runnerProcesses?: Record<string, RunnerProcess>,
): DropdownItem[] => {
  return [
    // File items
    { id: "file-1", label: "package.json", type: "File", section: "Files" },
    { id: "file-2", label: "README.md", type: "File", section: "Files" },
    { id: "file-3", label: "index.js", type: "File", section: "Files" },
    { id: "file-4", label: "tsconfig.json", type: "File", section: "Files" },
    { id: "file-5", label: ".env.example", type: "File", section: "Files" },

    // Documentation items
    {
      id: "doc-1",
      label: "API Reference",
      type: "Documentation",
      section: "Documentation",
    },
    {
      id: "doc-2",
      label: "Getting Started",
      type: "Documentation",
      section: "Documentation",
    },
    {
      id: "doc-3",
      label: "Tutorials",
      type: "Documentation",
      section: "Documentation",
    },
    {
      id: "doc-4",
      label: "Best Practices",
      type: "Documentation",
      section: "Documentation",
    },
    {
      id: "doc-5",
      label: "Troubleshooting",
      type: "Documentation",
      section: "Documentation",
    },

    // Dynamic terminal items from runner processes
    ...(runnerProcesses
      ? createTerminalItems(runnerProcesses, onAddContext)
      : []),

    // Actions section
    {
      id: "select-element",
      label: "Select Element",
      type: "Actions",
      section: "Actions",
      action: startElementSelection,
    },
    {
      id: "upload",
      label: "Upload File...",
      type: "Actions",
      section: "Actions",
      action: triggerFileUpload,
    },
  ];
};

// Helper function to create terminal items from runner processes
const createTerminalItems = (
  processes: Record<string, RunnerProcess>,
  onAddContext: (item: InputContextItem) => void,
): DropdownItem[] => {
  const terminalItems: DropdownItem[] = [];

  Object.values(processes).forEach((process) => {
    const processName =
      process.serverInfo.name || `Process ${process.processId}`;

    // Full logs item
    terminalItems.push({
      id: `terminal-full-${process.processId}`,
      label: `${processName} - Full Logs`,
      type: "Terminal",
      section: "Terminal",
      action: () => {
        onAddContext({
          name: `${processName} - Full Logs`,
          type: "Terminal",
          data: process.output,
        });
      },
      metadata: {
        processId: process.processId,
        logType: "full",
      },
    });

    // Error logs item process.output.filter((log) => log.type === "stderr")
    terminalItems.push({
      id: `terminal-errors-${process.processId}`,
      label: `${processName} - Errors`,
      type: "Terminal",
      section: "Terminal",
      action: () => {
        onAddContext({
          name: `${processName} - Error Logs`,
          type: "Terminal",
          data: process.output.filter((log) => log.type === "stderr"),
        });
      },
      metadata: {
        processId: process.processId,
        logType: "errors",
      },
    });

    // Regular logs item
    terminalItems.push({
      id: `terminal-regular-${process.processId}`,
      label: `${processName} - Regular Logs`,
      type: "Terminal",
      section: "Terminal",
      action: () => {
        onAddContext({
          name: `${processName} - Regular Logs`,
          type: "Terminal",
          data: process.output.filter((log) => log.type !== "stderr"),
        });
      },
      metadata: {
        processId: process.processId,
        logType: "regular",
      },
    });
  });

  return terminalItems;
};
