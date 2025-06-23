import { readFile } from "./read-file";
import { editFile } from "./edit-file";
import { grep } from "./grep";
import { thinking } from "./thinking";
import { fileSystem } from "./file-system";

// Tools specifically for init agent - focused on project analysis and configuration
export const initTools = {
  "read-file": readFile,
  "edit-file": editFile, // For creating .chara.json
  "file-system": fileSystem, // Unified file system tool
  grep: grep,
  thinking: thinking,
};
