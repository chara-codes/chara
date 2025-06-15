import { currentDir } from "./current-dir";
import { readFile } from "./read-file";
import { readMultipleFiles } from "./read-multiple-files";
import { listDirectory } from "./list-directory";
import { directoryTree } from "./directory-tree";
import { getFileInfo } from "./get-file-info";
import { grep } from "./grep";
import { thinking } from "./thinking";

import { writeFile } from "./write-file";

// Tools specifically for init agent - focused on project analysis and configuration
export const initTools = {
  "current-dir": currentDir,
  "read-file": readFile,
  "read-multiple-files": readMultipleFiles,
  "list-directory": listDirectory,
  "directory-tree": directoryTree,
  "get-file-info": getFileInfo,
  grep: grep,
  thinking: thinking,
  "write-file": writeFile, // Only for creating .chara.json
};
