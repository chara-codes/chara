import { tool } from "ai";
import z from "zod";
import { NodeHtmlMarkdown } from "node-html-markdown";

const DEFAULT_USER_AGENT =
  "Chara-Codes/1.0 (+https://github.com/chara-ai/chara)";
const DEFAULT_MAX_LENGTH = 5000;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

interface FetchResult {
  content: string;
  contentType: string;
  statusCode: number;
  url: string;
  isHtml: boolean;
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
 * Get robots.txt URL for a given URL
 */
function getRobotsTxtUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Check if URL can be fetched according to robots.txt (simplified check)
 * This is a basic implementation - for production use, consider using a proper robots.txt parser
 */
async function checkRobotsTxt(url: string, userAgent: string): Promise<void> {
  try {
    const robotsUrl = getRobotsTxtUrl(url);

    const response = await globalThis.fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(10000), // 10 second timeout for robots.txt
    });

    // If robots.txt doesn't exist or returns error, allow fetching
    if (!response.ok) {
      return;
    }

    const robotsTxt = await response.text();
    const lines = robotsTxt
      .split("\n")
      .map((line) => line.trim().toLowerCase());

    let currentUserAgent = "";
    let disallowRules: string[] = [];
    let allowRules: string[] = [];

    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        const agent = line.substring("user-agent:".length).trim();
        if (agent === "*" || agent === userAgent.toLowerCase()) {
          currentUserAgent = agent;
          disallowRules = [];
          allowRules = [];
        } else {
          currentUserAgent = "";
        }
      } else if (currentUserAgent && line.startsWith("disallow:")) {
        const path = line.substring("disallow:".length).trim();
        if (path) disallowRules.push(path);
      } else if (currentUserAgent && line.startsWith("allow:")) {
        const path = line.substring("allow:".length).trim();
        if (path) allowRules.push(path);
      }
    }

    // Simple path matching (without wildcards for now)
    const urlPath = new URL(url).pathname;

    // Check if explicitly allowed
    for (const allowRule of allowRules) {
      if (urlPath.startsWith(allowRule)) {
        return;
      }
    }

    // Check if disallowed
    for (const disallowRule of disallowRules) {
      if (urlPath.startsWith(disallowRule)) {
        throw new Error(
          `Fetching ${url} is disallowed by robots.txt. The site's robots.txt file prohibits autonomous fetching of this page.`,
        );
      }
    }
  } catch (error) {
    // If there's an error checking robots.txt (except disallow), allow the fetch
    if (error instanceof Error && error.message.includes("disallowed")) {
      throw error;
    }
    // For other errors (network issues, parsing errors), allow the fetch
    return;
  }
}

/**
 * Fetch URL and return processed content
 */
async function fetchUrl(
  url: string,
  userAgent: string,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<FetchResult> {
  const response = await globalThis.fetch(url, {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(timeout),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url} - HTTP ${response.status}: ${response.statusText}`,
    );
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
        "Starting character index for pagination - useful if previous fetch was truncated",
      ),
    raw: z
      .boolean()
      .default(false)
      .describe("Return raw HTML content without markdown conversion"),
    ignoreRobotsTxt: z
      .boolean()
      .default(false)
      .describe("Skip robots.txt check (use with caution)"),
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
    ignoreRobotsTxt = false,
    timeout = DEFAULT_TIMEOUT,
  }) => {
    try {
      // Validate URL
      new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Check robots.txt unless explicitly ignored
    if (!ignoreRobotsTxt) {
      await checkRobotsTxt(url, DEFAULT_USER_AGENT);
    }

    // Fetch the URL
    const result = await fetchUrl(url, DEFAULT_USER_AGENT, timeout);

    // Process content
    let processedContent = result.content;
    let prefix = "";

    // Convert HTML to markdown unless raw is requested
    if (result.isHtml && !raw) {
      processedContent = htmlToMarkdown(result.content);
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
