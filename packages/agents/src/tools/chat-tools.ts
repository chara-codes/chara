import { devServer } from "./dev-server";
import { directory } from "./directory";
import { editFile } from "./edit-file";
import { examination } from "./examination";
import { fetchTool } from "./fetch";
import { fileSystem } from "./file-system";
import { find } from "./find";
import { grep } from "./grep";
import { mkdir } from "./mkdir";
import { moveFile } from "./move-file";
import { readFile } from "./read-file";
import { terminal } from "./terminal";
import { thinking } from "./thinking";
import { writeFile } from "./write-file";

// Tools for write mode - all tools available for interactive development
export const chatToolsWriteMode = {
  "read-file": readFile,
  "edit-file": editFile,
  "write-file": writeFile,
  "file-system": fileSystem,
  "move-file": moveFile,
  mkdir,
  find,
  directory,
  grep,
  fetch: fetchTool,
  terminal,
  thinking,
  "dev-server": devServer,
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
  "dev-server": devServer,
  examination,
};

// Legacy export for backward compatibility
export const chatTools = chatToolsWriteMode;
