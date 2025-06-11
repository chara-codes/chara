import JSONL from "jsonl-parse-stringify";

/**
 * Parser for the Chara stream formats (object-stream and text-stream)
 */
/**
 * Parser for the Chara stream formats (object-stream and text-stream)
 */

// Type definitions for parsing the stream data

type StreamToken = [number, number, any[]];

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
  // Initialize the result object
  const result: ParsedObjectStream = {
    result: 0,
    data: 0,
    streamContent: [],
  };

  try {
    // Parse the JSONL content
    const tokens = JSONL.parse(jsonlContent);

    // Skip the initialization object (first line)
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i] as StreamToken;
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
    }
  } catch (error) {
    console.error("Error parsing object stream:", error);
  }

  return result;
}

/**
 * Parse a text stream from the jsonl format
 * @param jsonlContent The content of the text-stream.jsonl file
 * @returns Parsed text stream data
 */
export function parseTextStream(jsonlContent: string): ParsedTextStream {
  // Initialize the result object
  const result: ParsedTextStream = {
    result: 0,
    data: 0,
    streamContent: "",
  };

  try {
    // Parse the JSONL content
    const tokens = JSONL.parse(jsonlContent);

    // Skip the initialization object (first line)
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i] as StreamToken;
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
    }
  } catch (error) {
    console.error("Error parsing text stream:", error);
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
  try {
    if (format === "object") {
      return parseObjectStream(jsonlContent).streamContent;
    } else {
      return parseTextStream(jsonlContent).streamContent;
    }
  } catch (error) {
    console.error(`Error parsing ${format} stream:`, error);
    return format === "object" ? [] : "";
  }
}
