import fs from "fs";
import { myLogger } from "./logger";

export function isNonEmptyDirectory(projectPath: string): boolean {
  try {
    const files = fs.readdirSync(projectPath).filter((f) => !f.startsWith("."));
    myLogger.info("Found files:", files.length);
    return files.length > 0;
  } catch (e) {
    myLogger.error(e);
    return false;
  }
}
