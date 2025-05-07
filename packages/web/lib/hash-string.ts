import { createHash } from "crypto";

/**
 * Generates a unique, deterministic hash from a string.
 * @param folderName - The name of the folder.
 * @returns A hexadecimal hash string.
 */
export function generateStringHash(stringToHash: string): string {
  const hash = createHash("sha256");

  hash.update(stringToHash);

  return hash.digest("hex");
}
