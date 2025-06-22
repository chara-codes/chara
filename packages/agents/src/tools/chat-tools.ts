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

// Tools for write mode - all tools available for interactive development
export const chatToolsWriteMode = {
  "read-file": readFile,
  "edit-file": editFile,
  directory: directory,
  "move-file": moveFile,
  "get-file-info": getFileInfo,
  grep: grep,
  fetch: fetchTool,
  terminal: terminal,
  thinking: thinking,
  "env-info": envInfo,
};

// Tools for ask mode - read-only tools that don't modify the system
export const chatToolsAskMode = {
  "read-file": readFile,
  directory: directory,
  "get-file-info": getFileInfo,
  grep: grep,
  fetch: fetchTool,
  thinking: thinking,
  "env-info": envInfo,
};

// Legacy export for backward compatibility
export const chatTools = chatToolsWriteMode;
