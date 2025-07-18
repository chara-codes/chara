/**
 * Utility functions for handling thinking tags in message content
 */

/**
 * Regular expression to match thinking tags (case-insensitive)
 * Matches both well-formed and malformed thinking tags including:
 * - <think> and <thinking>
 * - </think> and </thinking>
 * - Malformed tags like </think or </thinking (missing closing >)
 * - Tags with attributes or extra whitespace
 */
export const THINKING_TAG_REGEX = /<\/?think(?:ing)?(?:\s[^>]*)?>?/gi;

/**
 * Removes thinking tags from text content.
 * This should be used in UI components to clean content before displaying
 * to ensure no thinking tags leak through to the user interface.
 *
 * @param text - The text content to clean
 * @returns The text with all thinking tags removed
 *
 * @example
 * ```typescript
 * const dirtyText = "Some text <thinking>hidden</thinking> visible </think>";
 * const cleanText = cleanThinkingTags(dirtyText);
 * // Result: "Some text hidden visible"
 * ```
 */
export const cleanThinkingTags = (text: string): string => {
  if (!text) return text;

  return text.replace(THINKING_TAG_REGEX, "").trim();
};

/**
 * Checks if text contains any thinking tags (well-formed or malformed)
 *
 * @param text - The text to check
 * @returns True if thinking tags are found, false otherwise
 */
export const containsThinkingTags = (text: string): boolean => {
  if (!text) return false;

  const regex = new RegExp(THINKING_TAG_REGEX.source, THINKING_TAG_REGEX.flags);
  return regex.test(text);
};

/**
 * Extracts thinking content from text, removing the tags but keeping the content
 *
 * @param text - The text containing thinking tags
 * @returns Array of thinking content strings
 */
export const extractThinkingContent = (text: string): string[] => {
  if (!text) return [];

  const thinkingContentRegex =
    /<think(?:ing)?\s*>([^<]*(?:<(?!\/think(?:ing)?>)[^<]*)*)<\/think(?:ing)?\s*>/gi;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while (true) {
    match = thinkingContentRegex.exec(text);
    if (match === null) break;

    if (match[1]) {
      matches.push(match[1].trim());
    }
  }

  return matches;
};
