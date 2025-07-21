import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";
import { find } from "./find";
import { directory } from "./directory";
import { mkdir } from "./mkdir";
import { devServer } from "./dev-server";
import { examination } from "./examination";

// Legacy imports for backward compatibility

// Export specialized tool configurations
export { chatTools, chatToolsWriteMode, chatToolsAskMode } from "./chat-tools";
export { initTools } from "./init-tools";

// Export individual tools
export { mkdir };
export { fileSystem };
export { find };
export { directory };

// Modern tool exports with new unified file system tool
export const modernTools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem,
  find: find,
  directory: directory,
  mkdir: mkdir,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  "dev-server": devServer,
  examination: examination,
};

// Keep legacy export for backward compatibility
export const tools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "file-system": fileSystem, // Unified file system tool
  find: find,
  directory: directory,
  mkdir: mkdir,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  "dev-server": devServer,
  examination: examination,
};
