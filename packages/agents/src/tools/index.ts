import { currentDir } from "./current-dir";
import { readFile } from "./read-file";
import { writeFile } from "./write-file";
import { readMultipleFiles } from "./read-multiple-files";
import { editFile } from "./edit-file";
import { createDirectory } from "./create-directory";
import { listDirectory } from "./list-directory";
import { directoryTree } from "./directory-tree";
import { moveFile } from "./move-file";
import { searchFiles } from "./search-files";
import { getFileInfo } from "./get-file-info";
import { fetchTool } from "./fetch";
import { terminal } from "./terminal";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { initGit } from "./init-git";
import { saveToHistory } from "./save-to-history";
import { diff } from "./diff";

export const tools = {
  "read-file": readFile,
  "current-dir": currentDir,
  "write-file": writeFile,
  "read-multiple-files": readMultipleFiles,
  "edit-file": editFile,
  "create-directory": createDirectory,
  "list-directory": listDirectory,
  "directory-tree": directoryTree,
  "move-file": moveFile,
  "search-files": searchFiles,
  "get-file-info": getFileInfo,
  fetch: fetchTool,
  terminal: terminal,
  grep: grep,
  thinking: thinking,
  "init-git": initGit,
  "save-to-history": saveToHistory,
  diff: diff,
};
