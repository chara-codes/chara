/**
 * Utility functions for reading files and detecting MIME types
 */

/**
 * Reads a file and returns its content as a string or base64
 * @param file - The File object to read
 * @returns Promise with file content, MIME type, and whether it's binary
 */
export async function readFileContent(file: File): Promise<{
  content: string;
  mimeType: string;
  isBinary: boolean;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        resolve({
          content: result,
          mimeType: file.type || getMimeTypeFromExtension(file.name),
          isBinary: false,
        });
      } else if (result instanceof ArrayBuffer) {
        // Convert ArrayBuffer to base64 using chunked processing to avoid stack overflow
        const bytes = new Uint8Array(result);
        const base64 = arrayBufferToBase64(bytes);
        resolve({
          content: base64,
          mimeType: file.type || getMimeTypeFromExtension(file.name),
          isBinary: true,
        });
      } else {
        reject(new Error("Failed to read file content"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    // Check if the file is likely binary based on MIME type
    const mimeType = file.type || getMimeTypeFromExtension(file.name);
    const isBinary = isBinaryMimeType(mimeType);

    if (isBinary) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Converts ArrayBuffer to base64 string using chunked processing
 * @param bytes - The Uint8Array to convert
 * @returns base64 encoded string
 */
function arrayBufferToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192; // Process 8KB chunks to avoid stack overflow
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Determines if a MIME type represents binary content
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is binary
 */
function isBinaryMimeType(mimeType: string): boolean {
  const textMimeTypes = [
    "text/",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/typescript",
    "application/x-typescript",
    "application/x-javascript",
  ];

  return !textMimeTypes.some((type) => mimeType.startsWith(type));
}

/**
 * Gets MIME type based on file extension
 * @param filename - The filename to analyze
 * @returns MIME type string
 */
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().split(".").pop();

  const mimeTypes: Record<string, string> = {
    // Text files
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/typescript",
    tsx: "application/typescript",
    jsx: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    csv: "text/csv",
    yaml: "application/yaml",
    yml: "application/yaml",
    toml: "application/toml",
    ini: "text/plain",
    cfg: "text/plain",
    conf: "text/plain",
    log: "text/plain",

    // Programming languages
    py: "text/x-python",
    java: "text/x-java-source",
    c: "text/x-c",
    cpp: "text/x-c++",
    h: "text/x-c",
    hpp: "text/x-c++",
    cs: "text/x-csharp",
    php: "text/x-php",
    rb: "text/x-ruby",
    go: "text/x-go",
    rs: "text/x-rust",
    swift: "text/x-swift",
    kt: "text/x-kotlin",
    scala: "text/x-scala",
    sql: "application/sql",
    sh: "application/x-sh",
    bash: "application/x-sh",
    zsh: "application/x-sh",
    fish: "application/x-sh",

    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    bmp: "image/bmp",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Archives
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",

    // Audio/Video
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    webm: "video/webm",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}

/**
 * Formats file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
