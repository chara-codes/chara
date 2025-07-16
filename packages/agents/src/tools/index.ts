import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";
import { directory } from "./directory";
import { mkdir } from "./mkdir";
import { runner } from "./runner";
import { examination } from "./examination";

// Legacy imports for backward compatibility

// Export specialized tool configurations
export { chatTools, chatToolsWriteMode, chatToolsAskMode } from "./chat-tools";
export { initTools } from "./init-tools";

// Export individual tools
export { mkdir };
export { fileSystem };
export { directory };

// Modern tool exports with new unified file system tool
export const modernTools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem,
  directory: directory,
  mkdir: mkdir,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  runner: runner,
  examination: examination,
};

// Keep legacy export for backward compatibility
export const tools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem, // Unified file system tool
  directory: directory,
  mkdir: mkdir,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  runner: runner,
  examination: examination,
};
