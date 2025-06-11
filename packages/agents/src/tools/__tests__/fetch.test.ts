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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
    });

    expect(result).toContain("# Main Title");
    expect(result).toContain("**paragraph**");
    expect(result).toContain("*emphasis*");
    expect(result).toContain("- First item");
    expect(result).toContain("- Second item");
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
    });

    expect(result).toContain("<error>No more content available");
    expect(result).toContain("Start index 100 exceeds content length 13");
  });

  test("should handle HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(
      fetchTool.execute({
        url: "https://example.com/notfound.txt",
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow(
      "Failed to fetch https://example.com/notfound.txt - HTTP 404: Not Found",
    );
  });

  test("should handle network timeouts", async () => {
    mockFetch.mockRejectedValueOnce(new Error("AbortError"));

    await expect(
      fetchTool.execute({
        url: "https://example.com/timeout.txt",
        timeout: 1000,
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow();
  });

  test("should validate invalid URLs", async () => {
    await expect(
      fetchTool.execute({
        url: "not-a-valid-url",
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow("Invalid URL: not-a-valid-url");
  });

  test("should handle robots.txt checking", async () => {
    // Mock robots.txt response that disallows the path
    const robotsTxt = `
      User-agent: *
      Disallow: /private/
      Allow: /public/
    `;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(robotsTxt),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        url: "https://example.com/private/data.txt",
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve("Private data"),
      });

    await expect(
      fetchTool.execute({
        url: "https://example.com/private/data.txt",
      }),
    ).rejects.toThrow("disallowed by robots.txt");

    // Should have called fetch twice: once for robots.txt, once for the actual URL (which failed)
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only robots.txt call
  });

  test("should allow fetching when robots.txt allows", async () => {
    const robotsTxt = `
      User-agent: *
      Disallow: /private/
      Allow: /public/
    `;

    const content = "Public content";

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(robotsTxt),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        url: "https://example.com/public/data.txt",
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(content),
      });

    const result = await fetchTool.execute({
      url: "https://example.com/public/data.txt",
    });

    expect(result).toContain(content);
    expect(mockFetch).toHaveBeenCalledTimes(2); // robots.txt + actual content
  });

  test("should handle missing robots.txt gracefully", async () => {
    const content = "Content when no robots.txt";

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        url: "https://example.com/data.txt",
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(content),
      });

    const result = await fetchTool.execute({
      url: "https://example.com/data.txt",
    });

    expect(result).toContain(content);
  });

  test("should skip robots.txt when ignoreRobotsTxt is true", async () => {
    const content = "Content without robots check";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com/data.txt",
      headers: new Headers({ "content-type": "text/plain" }),
      text: () => Promise.resolve(content),
    });

    const result = await fetchTool.execute({
      url: "https://example.com/data.txt",
      ignoreRobotsTxt: true,
    });

    expect(result).toContain(content);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only the actual content fetch
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
    });

    expect(result).toContain("## Subtitle");
    expect(result).toContain("> This is a quote");
    expect(result).toContain("`inline code`");
    expect(result).toContain("```\ncode block\n```");
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
      ignoreRobotsTxt: true,
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
      ignoreRobotsTxt: true,
    });

    expect(result).toContain("Contents of https://example.com/empty.txt:");
    expect(result).toContain("Content type: text/plain");
  });

  test("should handle concurrent fetch requests", async () => {
    const content1 = "Content 1";
    const content2 = "Content 2";

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        url: "https://example.com/file1.txt",
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(content1),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        url: "https://example.com/file2.txt",
        headers: new Headers({ "content-type": "text/plain" }),
        text: () => Promise.resolve(content2),
      });

    const [result1, result2] = await Promise.all([
      fetchTool.execute({
        url: "https://example.com/file1.txt",
        ignoreRobotsTxt: true,
      }),
      fetchTool.execute({
        url: "https://example.com/file2.txt",
        ignoreRobotsTxt: true,
      }),
    ]);

    expect(result1).toContain(content1);
    expect(result2).toContain(content2);
  });

  test("should validate parameter ranges", async () => {
    // Test invalid maxLength
    await expect(
      fetchTool.execute({
        url: "https://example.com/test.txt",
        maxLength: -1,
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow();

    // Test invalid maxLength (too large)
    await expect(
      fetchTool.execute({
        url: "https://example.com/test.txt",
        maxLength: 2000000,
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow();

    // Test invalid startIndex
    await expect(
      fetchTool.execute({
        url: "https://example.com/test.txt",
        startIndex: -1,
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow();

    // Test invalid timeout
    await expect(
      fetchTool.execute({
        url: "https://example.com/test.txt",
        timeout: 100000,
        ignoreRobotsTxt: true,
      }),
    ).rejects.toThrow();
  });
});
