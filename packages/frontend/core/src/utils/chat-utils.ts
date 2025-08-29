/**
 * Utility functions for chat operations
 */

/**
 * Generate a clean title from message content
 *
 * @param content - The message content to generate title from
 * @param maxLength - Maximum length of the title (default: 50)
 * @returns A clean title string
 */
export function generateTitleFromContent(
  content: string,
  maxLength: number = 50
): string {
  if (!content || typeof content !== 'string') {
    return 'New Chat';
  }

  return content
    .trim()
    .substring(0, maxLength)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim() || 'New Chat';
}

/**
 * Check if a chat title is the default "New Chat" title
 *
 * @param title - The chat title to check
 * @returns True if it's a default title that should be updated
 */
export function isDefaultChatTitle(title: string): boolean {
  return title === 'New Chat';
}

/**
 * Validate if content is suitable for generating a title
 *
 * @param content - The content to validate
 * @returns True if content can be used for title generation
 */
export function isValidTitleContent(content: string): boolean {
  return Boolean(content && content.trim().length > 0);
}

/**
 * Generate a title with fallback options
 *
 * @param content - Primary content for title generation
 * @param fallback - Fallback title if content is invalid
 * @returns A valid title string
 */
export function generateTitleWithFallback(
  content: string,
  fallback: string = 'New Chat'
): string {
  if (!isValidTitleContent(content)) {
    return fallback;
  }

  return generateTitleFromContent(content);
}
