import { readFile } from "./read-file";
import { writeFile } from "./write-file";
import { readMultipleFiles } from "./read-multiple-files";
import { editFile } from "./edit-file";
import { createDirectory } from "./create-directory";
import { listDirectory } from "./list-directory";
import { moveFile } from "./move-file";
import { getFileInfo } from "./get-file-info";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { saveToHistory } from "./save-to-history";
import { diff } from "./diff";
import { envInfo } from "./env-info";
import { searchFiles } from "./search-files";

// Tools for write mode - all tools available for interactive development
export const chatToolsWriteMode = {
  "read-file": readFile,
  "edit-file": editFile,
  "create-directory": createDirectory,
  "list-directory": listDirectory,
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
  "list-directory": listDirectory,
  "get-file-info": getFileInfo,
  grep: grep,
  fetch: fetchTool,
  thinking: thinking,
  "env-info": envInfo,
};

// Legacy export for backward compatibility
export const chatTools = chatToolsWriteMode;
