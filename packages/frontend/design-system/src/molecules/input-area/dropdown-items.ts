import type { DropdownItem, InputContextItem } from "@chara-codes/core";
import type { RunnerProcess } from "@chara-codes/core";
import type { FileSystemEntry } from "@chara-codes/server";
import { getVanillaTrpcClient } from "@chara-codes/core";

// Function to create dropdown items
export const createDropdownItems = (
  startElementSelection: () => void,
  triggerFileUpload: () => void,
  onAddContext: (item: InputContextItem) => void,
  runnerProcesses?: Record<string, RunnerProcess>,
  fileList?: FileSystemEntry[],
  fileListLoading?: boolean,
  fileListError?: string
): DropdownItem[] => {
  return [
    // Dynamic file items from actual file system
    ...(fileListLoading
      ? [
          {
            id: "files-loading",
            label: "Loading files...",
            type: "Files",
            section: "Files",
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            action: () => {}, // No-op
          },
        ]
      : fileListError
      ? [
          {
            id: "files-error",
            label: `Error loading files: ${fileListError}`,
            type: "Files",
            section: "Files",
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            action: () => {}, // No-op
          },
        ]
      : fileList
      ? createFileItems(fileList, onAddContext)
      : []),

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

// Helper function to create file items from file system entries
const createFileItems = (
  files: FileSystemEntry[],
  onAddContext: (item: InputContextItem) => void
): DropdownItem[] => {
  const fileItems: DropdownItem[] = [];

  // Recursively process files
  const processFiles = (entries: FileSystemEntry[]) => {
    entries.forEach((entry) => {
      if (entry.type === "file" && !entry.isGitIgnored) {
        fileItems.push({
          id: `file-${entry.path}`,
          label: entry.path, // Show full path from working directory
          type: "File",
          section: "Files",
          action: async () => {
            try {
              const client = getVanillaTrpcClient();
              const content = await client.context.getFileContent.query({
                filePath: entry.path,
              });

              onAddContext({
                name: entry.path,
                type: "File",
                data: content.content,
                mimeType: content.mimeType,
                isBinary: content.isBinary,
              });
            } catch (error) {
              console.error(`Failed to load file ${entry.path}:`, error);
            }
          },
        });
      }

      // Process children recursively
      if (entry.children && entry.children.length > 0) {
        processFiles(entry.children);
      }
    });
  };

  processFiles(files);
  return fileItems;
};

// Helper function to create terminal items from runner processes
const createTerminalItems = (
  processes: Record<string, RunnerProcess>,
  onAddContext: (item: InputContextItem) => void
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
    });
  });

  return terminalItems;
};
