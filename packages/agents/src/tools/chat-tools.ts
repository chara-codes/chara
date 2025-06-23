import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";

// Tools for write mode - all tools available for interactive development
export const chatToolsWriteMode = {
  "read-file": readFile,
  "edit-file": editFile,
  "file-system": fileSystem,
  "move-file": moveFile,
  grep: grep,
  fetch: fetchTool,
  terminal: terminal,
  thinking: thinking,
};

// Tools for ask mode - read-only tools that don't modify the system
export const chatToolsAskMode = {
  "read-file": readFile,
  "file-system": fileSystem,
  grep: grep,
  fetch: fetchTool,
  thinking: thinking,
};

// Legacy export for backward compatibility
export const chatTools = chatToolsWriteMode;
