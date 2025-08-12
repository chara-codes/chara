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
import { projectInfo } from "./project-info";
import { readFile } from "./read-file";
import { terminal } from "./terminal";
import { thinking } from "./thinking";
import { writeFile } from "./write-file";

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
  "write-file": writeFile,
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
  "project-info": projectInfo,
};

// Keep legacy export for backward compatibility
export const tools = {
  "read-file": readFile,
  "edit-file": editFile,
  "write-file": writeFile,
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
  "project-info": projectInfo,
};
