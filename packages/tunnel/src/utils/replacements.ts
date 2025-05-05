import type { TextReplacement } from "../types/server.types";
import { logger } from "./logger";

/**
 * Applies a series of text replacements to a string
 * @param content The text content to modify
 * @param replacements Array of pattern/replacement pairs to apply
 * @returns The modified text with all replacements applied
 */
export function applyReplacements(
  content: string,
  replacements: TextReplacement[],
): string {
  if (!replacements || replacements.length === 0) return content;

  let result = content;

  for (const { pattern, replacement } of replacements) {
    try {
      const regex =
        typeof pattern === "string" ? new RegExp(pattern, "g") : pattern;

      result = result.replace(regex, replacement);
    } catch (error) {
      logger.error(`Error applying replacement: ${error}`);
    }
  }

  return result;
}
