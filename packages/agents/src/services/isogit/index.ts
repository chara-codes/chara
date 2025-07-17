export * from "./types";
export { IsoGitService } from "./service";

// Export singleton instance for backward compatibility
import { IsoGitService } from "./service";
export const isoGitService = new IsoGitService();
