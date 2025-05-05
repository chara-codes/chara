/**
 * Determines if a response is a text or HTML response based on its Content-Type header
 * @param headers Response headers
 * @returns Boolean indicating if the response is text/html
 */
export function isTextResponse(headers: Headers): boolean {
  const contentType = headers.get("content-type") || "";
  return (
    contentType.includes("text/") ||
    contentType.includes("html") ||
    contentType.includes("xml")
  );
}
