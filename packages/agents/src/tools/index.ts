import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";

// Legacy imports for backward compatibility

// Export specialized tool configurations
export { chatTools, chatToolsWriteMode, chatToolsAskMode } from "./chat-tools";
export { initTools } from "./init-tools";

// Modern tool exports with new unified file system tool
export const modernTools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
};

// Keep legacy export for backward compatibility
export const tools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem, // Unified file system tool
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
};
