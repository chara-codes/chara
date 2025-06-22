import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { getFileInfo } from "./get-file-info";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { directory } from "./directory";

// Tools specifically for init agent - focused on project analysis and configuration
export const initTools = {
  "read-file": readFile,
  "edit-file": editFile, // For creating .chara.json
  directory: directory, // New unified directory tool
  "get-file-info": getFileInfo,
  grep: grep,
  thinking: thinking,
};
