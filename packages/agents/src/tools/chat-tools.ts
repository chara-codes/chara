import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { moveFile } from "./move-file";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";
import { runner } from "./runner";
import { examination } from "./examination";
import { mkdir } from "./mkdir";
import { directory } from "./directory";
import { find } from "./find";

// Tools for write mode - all tools available for interactive development
export const chatToolsWriteMode = {
  "read-file": readFile,
  "edit-file": editFile,
  "file-system": fileSystem,
  "move-file": moveFile,
  mkdir,
  find,
  directory,
  grep,
  fetch: fetchTool,
  terminal,
  thinking,
  runner,
  examination,
};

// Tools for ask mode - read-only tools that don't modify the system
export const chatToolsAskMode = {
  "read-file": readFile,
  "file-system": fileSystem,
  grep,
  find,
  fetch: fetchTool,
  thinking,
  directory,
  runner,
  examination,
};

// Legacy export for backward compatibility
export const chatTools = chatToolsWriteMode;
