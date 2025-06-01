import type { Message, FileDiff } from "../store/types"; // Assuming types are in store

export interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onToolCall: (toolCall: unknown) => void; // Define a more specific type if available
  onStructuredData: (data: Partial<Message>) => void; // For fileDiffs, commands etc.
  onStreamError: (error: string) => void;
  onStreamOpen?: () => void; // Optional: if you need to do something when stream opens
  onStreamClose?: (aborted: boolean) => void; // Optional: for cleanup or final actions
}

export interface StreamRequestPayload {
  messages: Array<{
    role: string;
    content: string;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    tool_calls?: any[];
    tool_call_id?: string;
  }>; // Adjust based on agent needs
  model: string;
  // Add other necessary payload fields like contextItems, mode, etc.
  // context_items?: Array<{ name: string; type: string; data?: unknown }>;
}

export async function processChatStream(
  apiUrl: string,
  payload: StreamRequestPayload,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  try {
    if (callbacks.onStreamOpen) {
      callbacks.onStreamOpen();
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (signal.aborted) {
      console.log("Stream Service: Fetch aborted by user before response.");
      if (callbacks.onStreamClose) callbacks.onStreamClose(true);
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Agent request failed: ${response.status} ${errorText || response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) {
        if (signal.aborted)
          console.log("Stream Service: Stream reading aborted by user.");
        break;
      }

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split("\n");
      streamBuffer = lines.pop() || ""; // Keep the last partial line in buffer

      for (const line of lines) {
        if (line.trim() === "") continue;

        try {
          const typeChar = line[0];
          const jsonDataString = line.substring(line.indexOf(":") + 1);
          if (!jsonDataString) continue;

          const parsedData = JSON.parse(jsonDataString);

          switch (typeChar) {
            case "0": // Text delta
              callbacks.onTextDelta(parsedData as string);
              break;
            case "1": // Tool Call
              callbacks.onToolCall(parsedData);
              break;
            case "2": // Data (for FileDiffs, etc.) or Tool Result
              // This part needs to be robust based on actual agent output for '2:'
              // Assuming '2:' sends an array of objects, each potentially having parts of a Message
              if (Array.isArray(parsedData)) {
                for (const dataItem of parsedData) {
                  const structuredUpdate: Partial<Message> = {};
                  if (dataItem.fileDiffs) {
                    structuredUpdate.fileDiffs = (
                      dataItem.fileDiffs as FileDiff[]
                    ).map(
                      (diff) => ({ ...diff, status: "pending" }) as FileDiff,
                    );
                  }
                  if (dataItem.filesToChange) {
                    structuredUpdate.filesToChange = dataItem.filesToChange;
                  }
                  if (dataItem.commandsToExecute) {
                    structuredUpdate.commandsToExecute =
                      dataItem.commandsToExecute;
                  }
                  if (dataItem.executedCommands) {
                    structuredUpdate.executedCommands =
                      dataItem.executedCommands;
                  }
                  // Add other structured data fields as needed
                  if (Object.keys(structuredUpdate).length > 0) {
                    callbacks.onStructuredData(structuredUpdate);
                  }
                }
              } else if (
                typeof parsedData === "object" &&
                parsedData !== null
              ) {
                // Could be a single tool result or other structured data object
                // For now, let's assume it might be a single structured data item
                const structuredUpdate: Partial<Message> = {};
                if (parsedData.fileDiffs) {
                  structuredUpdate.fileDiffs = (
                    parsedData.fileDiffs as FileDiff[]
                  ).map((diff) => ({ ...diff, status: "pending" }) as FileDiff);
                }
                // ... (add other fields like above)
                if (Object.keys(structuredUpdate).length > 0) {
                  callbacks.onStructuredData(structuredUpdate);
                } else {
                  // If not fitting known structured data, treat as generic tool result/data
                  console.log(
                    "Stream Service: Received single object for '2:'",
                    parsedData,
                  );
                  // Potentially pass to onToolCall or a new callback if it's a tool result
                }
              }
              break;
            case "8": // Error from stream
              callbacks.onStreamError(parsedData as string);
              // Consider if the stream should be forcefully closed here
              if (callbacks.onStreamClose) callbacks.onStreamClose(false); // Signal error, not aborted
              return; // Stop processing on stream error
            default:
              console.warn(
                "Stream Service: Unknown stream data type:",
                typeChar,
                parsedData,
              );
          }
        } catch (e) {
          console.error("Stream Service: Error parsing stream line:", line, e);
          // Optionally call callbacks.onStreamError with a generic parsing error
        }
      }
      if (signal.aborted) break; // Check again after processing a batch of lines
    }

    if (callbacks.onStreamClose) {
      callbacks.onStreamClose(signal.aborted);
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Stream Service: Fetch aborted by user (caught in service).");
      if (callbacks.onStreamClose) callbacks.onStreamClose(true);
    } else {
      console.error("Stream Service: Failed to process stream:", error);
      callbacks.onStreamError(
        error instanceof Error
          ? error.message
          : "Unknown stream processing error",
      );
      if (callbacks.onStreamClose) callbacks.onStreamClose(false); // Signal error
    }
  }
}
