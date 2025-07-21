import { tool } from "ai";
import z from "zod";
import { NodeHtmlMarkdown } from "node-html-markdown";

const DEFAULT_USER_AGENT =
  "Chara-Codes (+https://github.com/chara-codes/chara)";
const DEFAULT_MAX_LENGTH = 5000;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

interface FetchResult {
  content: string;
  contentType: string;
  statusCode: number;
  url: string;
  isHtml: boolean;
}

interface FetchError {
  error: string;
  code?: string;
  statusCode?: number;
}

/**
 * Convert HTML to Markdown using node-html-markdown
 */
function htmlToMarkdown(html: string): string {
  return NodeHtmlMarkdown.translate(html);
}

/**
 * Check if content appears to be HTML
 */
function isHtmlContent(content: string, contentType: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerContentType = contentType.toLowerCase();

  return (
    lowerContentType.includes("text/html") ||
    lowerContent.includes("<html") ||
    lowerContent.includes("<!doctype html") ||
    (lowerContent.includes("<body") && lowerContent.includes("<head"))
  );
}

/**
 * Fetch URL and return processed content
 */
async function fetchUrl(
  url: string,
  userAgent: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<FetchResult | FetchError> {
  try {
    const response = await globalThis.fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        error: `Failed to fetch ${url} - HTTP ${response.status}: ${response.statusText}`,
        code: "HTTP_ERROR",
        statusCode: response.status,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const content = await response.text();
    const isHtml = isHtmlContent(content, contentType);

    return {
      content,
      contentType,
      statusCode: response.status,
      url: response.url, // This will be the final URL after redirects
      isHtml,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("AbortError")) {
        return {
          error: `Request timeout: Failed to fetch ${url} within ${timeout}ms`,
          code: "TIMEOUT",
        };
      }
      return {
        error: `Network error: ${error.message}`,
        code: "NETWORK_ERROR",
      };
    }
    return {
      error: `Unknown error occurred while fetching ${url}`,
      code: "UNKNOWN_ERROR",
    };
  }
}

export const fetchTool = tool({
  description: `Fetches a URL from the internet and optionally extracts its contents as markdown.

This tool grants you internet access. You can fetch the most up-to-date information from websites.
HTML content is automatically converted to markdown for better readability, but you can request raw HTML if needed.`,
  parameters: z.object({
    url: z.string().describe("URL to fetch (must be a valid HTTP/HTTPS URL)"),
    maxLength: z
      .number()
      .int()
      .positive()
      .max(1000000)
      .default(DEFAULT_MAX_LENGTH)
      .describe("Maximum number of characters to return"),
    startIndex: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe(
        "Starting character index for pagination - useful if previous fetch was truncated"
      ),
    raw: z
      .boolean()
      .default(false)
      .describe("Return raw HTML content without markdown conversion"),
    timeout: z
      .number()
      .int()
      .positive()
      .max(60000)
      .default(DEFAULT_TIMEOUT)
      .describe("Request timeout in milliseconds (max 60 seconds)"),
  }),
  execute: async ({
    url,
    maxLength = DEFAULT_MAX_LENGTH,
    startIndex = 0,
    raw = false,
    timeout = DEFAULT_TIMEOUT,
  }) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      return `<error>Invalid URL: ${url}</error>`;
    }

    // Fetch the URL
    const result = await fetchUrl(url, DEFAULT_USER_AGENT, timeout);

    // Handle fetch errors
    if ("error" in result) {
      return `<error>${result.error}</error>`;
    }

    // Process content
    let processedContent = result.content;
    let prefix = "";

    // Convert HTML to markdown unless raw is requested
    if (result.isHtml && !raw) {
      try {
        processedContent = htmlToMarkdown(result.content);
      } catch (error) {
        // If markdown conversion fails, fall back to raw HTML
        processedContent = result.content;
        prefix = `Warning: HTML to markdown conversion failed, showing raw HTML\nContent type: ${result.contentType}\n\n`;
      }
    } else if (!result.isHtml) {
      prefix = `Content type: ${result.contentType}\n\n`;
    }

    // Handle pagination
    const originalLength = processedContent.length;

    if (startIndex >= originalLength) {
      return `${prefix}Contents of ${result.url}:\n\n<error>No more content available. Start index ${startIndex} exceeds content length ${originalLength}.</error>`;
    }

    const endIndex = Math.min(startIndex + maxLength, originalLength);
    const truncatedContent = processedContent.slice(startIndex, endIndex);

    // Add pagination info if content was truncated
    let paginationInfo = "";
    if (endIndex < originalLength) {
      const remainingChars = originalLength - endIndex;
      paginationInfo = `\n\n<truncated>Content truncated. Showing characters ${startIndex}-${endIndex} of ${originalLength}. ${remainingChars} characters remaining. Use startIndex=${endIndex} to continue.</truncated>`;
    }

    return `${prefix}Contents of ${result.url}:\n\n${truncatedContent}${paginationInfo}`;
  },
});
