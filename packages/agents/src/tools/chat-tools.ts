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

// Tools specifically for chat agent - focused on interactive development
export const chatTools = {
  "read-file": readFile,
  "write-file": writeFile,
  "read-multiple-files": readMultipleFiles,
  "edit-file": editFile,
  "create-directory": createDirectory,
  "list-directory": listDirectory,
  "move-file": moveFile,
  "get-file-info": getFileInfo,
  grep: grep,
  fetch: fetchTool,
  terminal: terminal,
  thinking: thinking,
  "save-to-history": saveToHistory,
  diff: diff,
  "env-info": envInfo,
  "search-files": searchFiles,
};
