import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { getFileInfo } from "./get-file-info";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { envInfo } from "./env-info";
import { directory } from "./directory";

// Legacy imports for backward compatibility

// Export specialized tool configurations
export { chatTools, chatToolsWriteMode, chatToolsAskMode } from "./chat-tools";
export { initTools } from "./init-tools";

// Modern tool exports with new unified directory tool
export const modernTools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "get-file-info": getFileInfo,
  directory: directory,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  "env-info": envInfo,
};

// Keep legacy export for backward compatibility
export const tools = {
  "read-file": readFile,
  "edit-file": editFile,
  "move-file": moveFile,
  "get-file-info": getFileInfo,
  directory: directory, // Include new tool in legacy export too
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  "env-info": envInfo,
};
