/**
 * Parser for the Chara stream formats (object-stream and text-stream)
 */

// Type definitions for parsing the stream data

type StreamToken = [number, number, any[]];
type InitToken = { "0": [number[], [null, number, number]] };

interface ObjectStreamContent {
  content?: string;
  fileChanges?: any[];
  commands?: any[];
  [key: string]: any;
}

export interface ParsedObjectStream {
  result: number;
  data: number;
  streamContent: ObjectStreamContent[];
}

export interface ParsedTextStream {
  result: number;
  data: number;
  streamContent: string;
}

/**
 * Parse an object stream from the jsonl format
 * @param jsonlContent The content of the object-stream.jsonl file
 * @returns Parsed object stream data
 */
export function parseObjectStream(jsonlContent: string): ParsedObjectStream {
  const lines = jsonlContent.trim().split(/\r?\n/);

  // Initialize the result object
  const result: ParsedObjectStream = {
    result: 0,
    data: 0,
    streamContent: [],
  };

  // Parse the initialization object
  const initObject: InitToken = JSON.parse(lines[0]);

  // Process each line of the JSONL file
  for (let i = 1; i < lines.length; i++) {
    try {
      const token: StreamToken = JSON.parse(lines[i]);
      const [index, level, data] = token;

      if (level === 0) {
        // Handle metadata tokens
        if (data[0][0]?.result !== undefined) {
          result.result = data[0][0].result;
        } else if (data[0][0]?.data !== undefined) {
          result.data = data[0][0].data;
        }
      } else if (level === 1) {
        // Handle content tokens
        if (data[0]?.[0] !== undefined) {
          const content = data[0][0];

          // If it's an object with content, add to streamContent
          if (typeof content === "object" && content !== null) {
            result.streamContent.push(content);
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  return result;
}

/**
 * Parse a text stream from the jsonl format
 * @param jsonlContent The content of the text-stream.jsonl file
 * @returns Parsed text stream data
 */
export function parseTextStream(jsonlContent: string): ParsedTextStream {
  const lines = jsonlContent.trim().split(/\r?\n/);

  // Initialize the result object
  const result: ParsedTextStream = {
    result: 0,
    data: 0,
    streamContent: "",
  };

  // Parse the initialization object
  const initObject: InitToken = JSON.parse(lines[0]);

  // Process each line of the JSONL file
  for (let i = 1; i < lines.length; i++) {
    try {
      const token: StreamToken = JSON.parse(lines[i]);
      const [index, level, data] = token;

      if (level === 0) {
        // Handle metadata tokens
        if (data[0]?.[0]?.result !== undefined) {
          result.result = data[0][0].result;
        } else if (data[0]?.[0]?.data !== undefined) {
          result.data = data[0][0].data;
        }
      } else if (level === 1) {
        // Handle content tokens - these are text chunks
        if (data[0]?.[0] !== undefined) {
          const chunk = data[0][0];
          if (typeof chunk === "string") {
            result.streamContent += chunk;
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  return result;
}

/**
 * Generic function to parse either stream format
 * @param jsonlContent The content of the stream file
 * @param format The format of the stream ('object' or 'text')
 * @returns Just the streamContent from the parsed data
 */
export function parseStream(
  jsonlContent: string,
  format: "object" | "text",
): ObjectStreamContent[] | string {
  if (format === "object") {
    return parseObjectStream(jsonlContent).streamContent;
  } else {
    return parseTextStream(jsonlContent).streamContent;
  }
}
