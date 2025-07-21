import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { fetchTool } from "../fetch";

// Mock fetch globally
const originalFetch = globalThis.fetch;
let mockFetch: any;

beforeEach(() => {
  mockFetch = mock(() => {});
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  mockFetch.mockClear();
});

describe("fetch tool", () => {
  test("should fetch simple text content", async () => {
    const mockContent = "This is plain text content";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/test.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(mockContent),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/test.txt",
    });

    expect(result).toContain("Contents of https://example.com/test.txt:");
    expect(result).toContain(mockContent);
    expect(result).toContain("Content type: text/plain");
  });

  test("should convert HTML to markdown", async () => {
    const mockHtml = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Main Title</h1>
          <p>This is a <strong>paragraph</strong> with <em>emphasis</em>.</p>
          <ul>
            <li>First item</li>
            <li>Second item</li>
          </ul>
          <a href="https://example.com">Link text</a>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/test.html",
      headers: new Headers({ "content-type": "text/html" }),
      text: () => Promise.resolve(mockHtml),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/test.html",
    });

    expect(result).toContain("# Main Title");
    expect(result).toContain("**paragraph**");
    expect(result).toContain("_emphasis_");
    expect(result).toContain("* First item");
    expect(result).toContain("* Second item");
    expect(result).toContain("[Link text](https://example.com)");
  });

  test("should return raw HTML when raw=true", async () => {
    const mockHtml = "<html><body><h1>Raw HTML</h1></body></html>";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/raw.html",
      headers: new Headers({ "content-type": "text/html" }),
      text: () => Promise.resolve(mockHtml),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/raw.html",
      raw: true,
    });

    expect(result).toContain(mockHtml);
    expect(result).not.toContain("# Raw HTML");
  });

  test("should handle content truncation", async () => {
    const longContent = "x".repeat(10000);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/long.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(longContent),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/long.txt",
      maxLength: 1000,
    });

    expect(result).toContain("<truncated>");
    expect(result).toContain("Showing characters 0-1000 of 10000");
    expect(result).toContain("Use startIndex=1000 to continue");
  });

  test("should handle pagination with startIndex", async () => {
    const content = "0123456789".repeat(100); // 1000 chars
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/paginate.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(content),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/paginate.txt",
      startIndex: 500,
      maxLength: 300,
    });

    expect(result).toContain("Showing characters 500-800 of 1000");
    expect(result).toContain("200 characters remaining");
  });

  test("should handle startIndex beyond content length", async () => {
    const content = "Short content";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/short.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(content),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/short.txt",
      startIndex: 100,
    });

    expect(result).toContain("<error>No more content available");
    expect(result).toContain("Start index 100 exceeds content length 13");
  });

  test("should return error message for HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const result = await fetchTool.execute({
      url: "https://example.com/notfound.txt",
    });

    expect(result).toContain(
      "<error>Failed to fetch https://example.com/notfound.txt - HTTP 404: Not Found</error>"
    );
  });

  test("should return error message for network timeouts", async () => {
    mockFetch.mockRejectedValueOnce(new Error("AbortError"));

    const result = await fetchTool.execute({
      url: "https://example.com/timeout.txt",
      timeout: 1000,
    });

    expect(result).toContain(
      "<error>Request timeout: Failed to fetch https://example.com/timeout.txt within 1000ms</error>"
    );
  });

  test("should return error message for network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

    const result = await fetchTool.execute({
      url: "https://example.com/network-error.txt",
    });

    expect(result).toContain(
      "<error>Network error: Network connection failed</error>"
    );
  });

  test("should return error message for invalid URLs", async () => {
    const result = await fetchTool.execute({
      url: "not-a-valid-url",
    });

    expect(result).toContain("<error>Invalid URL: not-a-valid-url</error>");
  });

  test("should handle redirects", async () => {
    const content = "Redirected content";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/redirected.txt", // Final URL after redirect
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(content),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/redirect-me.txt",
    });

    expect(result).toContain("Contents of https://example.com/redirected.txt:");
    expect(result).toContain(content);
  });

  test("should clean up HTML content properly", async () => {
    const htmlWithScripts = `
      <html>
        <head>
          <script>alert('evil');</script>
          <style>.hidden { display: none; }</style>
        </head>
        <body>
          <h1>Clean Title</h1>
          <p>Clean content &amp; entities &lt;test&gt;</p>
          <script>more evil();</script>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/clean.html",
      headers: new Headers({ "content-type": "text/html" }),
      text: () => Promise.resolve(htmlWithScripts),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/clean.html",
    });

    expect(result).toContain("# Clean Title");
    expect(result).toContain("Clean content & entities <test>");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("evil");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("<style>");
  });

  test("should handle different HTML elements", async () => {
    const richHtml = `
      <html>
        <body>
          <h2>Subtitle</h2>
          <blockquote>This is a quote</blockquote>
          <code>inline code</code>
          <pre>code block</pre>
          <ol>
            <li>First</li>
            <li>Second</li>
          </ol>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/rich.html",
      headers: new Headers({ "content-type": "text/html" }),
      text: () => Promise.resolve(richHtml),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/rich.html",
    });

    expect(result).toContain("## Subtitle");
    expect(result).toContain("> This is a quote");
    expect(result).toContain("`inline code`");
    expect(result).toContain("code block");
    expect(result).toContain("1. First");
    expect(result).toContain("2. Second");
  });

  test("should have correct tool metadata", () => {
    expect(fetchTool.description).toContain("Fetches a URL from the internet");
    expect(fetchTool.description).toContain("internet access");
    expect(fetchTool.parameters).toBeDefined();
  });

  test("should handle JSON content", async () => {
    const jsonContent = '{"name": "test", "value": 123}';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://api.example.com/data.json",
      headers: new Headers({ "content-type": "application/json" }),
      text: () => Promise.resolve(jsonContent),
    });

    const result = await fetchTool.execute({
      url: "https://api.example.com/data.json",
    });

    expect(result).toContain("Content type: application/json");
    expect(result).toContain(jsonContent);
  });

  test("should handle empty content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/empty.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(""),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/empty.txt",
    });

    expect(result).toContain("Contents of https://example.com/empty.txt:");
    expect(result).toContain("Content type: text/plain");
  });

  test("should handle concurrent fetch requests", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";

    // Set up mocks for both requests
    mockFetch.mockImplementation((url) => {
      if (url.includes("file1.txt")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          url: "https://example.com/file1.txt",
          headers: new Headers({ "content-type": "text/plain" }),
          text: () => Promise.resolve(content1),
        });
      } else if (url.includes("file2.txt")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          url: "https://example.com/file2.txt",
          headers: new Headers({ "content-type": "text/plain" }),
          text: () => Promise.resolve(content2),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const [result1, result2] = await Promise.all([
      fetchTool.execute({
        url: "https://example.com/file1.txt",
      }),
      fetchTool.execute({
        url: "https://example.com/file2.txt",
      }),
    ]);

    expect(result1).toContain(content1);
    expect(result2).toContain(content2);
  });

  test("should handle markdown conversion errors gracefully", async () => {
    const malformedHtml =
      "<html><body><h1>Title</h1><p>Content</p></body></html>";

    // Mock the NodeHtmlMarkdown.translate to throw an error
    const originalTranslate =
      require("node-html-markdown").NodeHtmlMarkdown.translate;
    require("node-html-markdown").NodeHtmlMarkdown.translate = mock(() => {
      throw new Error("Markdown conversion failed");
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/malformed.html",
      headers: new Headers({ "content-type": "text/html" }),
      text: () => Promise.resolve(malformedHtml),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/malformed.html",
    });

    expect(result).toContain(
      "Warning: HTML to markdown conversion failed, showing raw HTML"
    );
    expect(result).toContain(malformedHtml);

    // Restore original function
    require("node-html-markdown").NodeHtmlMarkdown.translate =
      originalTranslate;
  });

  test("should handle unknown errors", async () => {
    mockFetch.mockRejectedValueOnce("Unknown error object");

    const result = await fetchTool.execute({
      url: "https://example.com/unknown-error.txt",
    });

    expect(result).toContain(
      "<error>Unknown error occurred while fetching https://example.com/unknown-error.txt</error>"
    );
  });

  test("should validate parameter ranges", async () => {
    // Test invalid maxLength - this should be handled by zod schema validation
    // so we don't need to test it here as it would throw before reaching our code

    // Test that valid parameters work
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/test.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve("Valid content"),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/test.txt",
      maxLength: 1000,
      startIndex: 0,
      timeout: 30000,
    });

    expect(result).toContain("Valid content");
  });

  test("should not have ignoreRobotsTxt parameter", () => {
    const parameters = fetchTool.parameters.shape;
    expect(parameters.ignoreRobotsTxt).toBeUndefined();
  });

  test("should handle various HTTP error codes", async () => {
    const testCases = [
      { status: 401, statusText: "Unauthorized" },
      { status: 403, statusText: "Forbidden" },
      { status: 500, statusText: "Internal Server Error" },
      { status: 503, statusText: "Service Unavailable" },
    ];

    for (const testCase of testCases) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: testCase.status,
        statusText: testCase.statusText,
      });

      const result = await fetchTool.execute({
        url: "https://example.com/error.txt",
      });

      expect(result).toContain(
        `<error>Failed to fetch https://example.com/error.txt - HTTP ${testCase.status}: ${testCase.statusText}</error>`
      );
      mockFetch.mockClear();
    }
  });
});
