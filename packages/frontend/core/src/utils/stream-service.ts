import type { StreamCallbacks, StreamRequestPayload } from "../types";

/**
 * Processes a chat stream from the API
 */
export async function processChatStream(
  url: string,
  payload: StreamRequestPayload,
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const {
    onTextDelta,
    onThinkingDelta,
    onToolCall,
    onStructuredData,
    onStreamError,
    onStreamClose,
    onCompletion
  } = callbacks;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          // Process any remaining data in buffer
          processEventData(buffer.trim());
        }
        onStreamClose?.(false);
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split by newline and process complete events
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last (potentially incomplete) line in the buffer

      for (const line of lines) {
        if (line.trim()) {
          processEventData(line.trim());
        }
      }
    }
  } catch (error) {
    // Handle AbortError separately
    if (error instanceof Error && error.name === "AbortError") {
      onStreamClose?.(true);
      return;
    }

    // Handle all other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Stream processing error:", errorMessage);
    onStreamError?.(errorMessage);
    onStreamClose?.(false);
    throw error;
  }

  function processEventData(dataLine: string) {
    if (dataLine.startsWith("data: ")) {
      const jsonData = dataLine.slice(6); // Remove "data: " prefix

      try {
        const parsedData = JSON.parse(jsonData);

        if (parsedData.type === "text") {
          onTextDelta(parsedData.content);
        } else if (parsedData.type === "thinking") {
          onThinkingDelta?.(parsedData.content);
        } else if (parsedData.type === "tool_call") {
          onToolCall?.(parsedData.data);
        } else if (parsedData.type === "structured_data") {
          onStructuredData?.(parsedData.data);
        } else if (parsedData.type === "completion") {
          onCompletion?.(parsedData.data);
        } else if (parsedData.type === "error") {
          onStreamError?.(parsedData.error);
        }
      } catch (e) {
        console.error("Failed to parse JSON from stream:", e, jsonData);
        onStreamError?.(`Failed to parse stream data: ${e}`);
      }
    }
  }
}
