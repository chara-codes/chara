import JSONL from "jsonl-parse-stringify";

/**
 * Parses a JSONL chunk from a stream and extracts the text content
 * @param chunk The raw chunk received from the stream
 * @returns The extracted text content
 */
export function parseStreamChunk(chunk: string): string {
  try {
    const parsedChunk = JSONL.parse(chunk);
    let textToAdd = "";

    if (Array.isArray(parsedChunk)) {
      // Handle array formats like [3,1,[["text"]]]
      for (const item of parsedChunk) {
        if (Array.isArray(item) && item.length >= 3) {
          const dataArray = item[2];
          if (
            Array.isArray(dataArray) &&
            dataArray.length > 0 &&
            Array.isArray(dataArray[0])
          ) {
            // If we're joining array elements, make sure they're strings
            // Don't try to concatenate objects or other complex types
            if (dataArray[0].every((element) => typeof element === "string")) {
              textToAdd += dataArray[0].join("");
            } else {
              // For non-string elements, only take string values
              textToAdd += dataArray[0]
                .filter((element) => typeof element === "string")
                .join("");
            }
          }
        }
      }
    }

    return textToAdd;
  } catch (err) {
    console.error("Error parsing chunk:", err);
    console.log("Problematic chunk:", chunk);
    // Return empty string on parsing errors
    return "";
  }
}
