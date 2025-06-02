/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, FileDiff } from "../store/types"; // Assuming types are in store

export interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onThinkingDelta: (delta: string) => void;
  onToolCall: (toolCall: unknown) => void; // Define a more specific type if available
  onStructuredData: (data: Partial<Message>) => void; // For fileDiffs, commands etc.
  onStreamError: (error: string) => void;
  onStreamOpen?: () => void; // Optional: if you need to do something when stream opens
  onStreamClose?: (aborted: boolean) => void; // Optional: for cleanup or final actions
  onCompletion?: (data: {
    finishReason: string;
    usage?: { promptTokens: number; completionTokens: number };
    isContinued?: boolean;
  }) => void; // Optional: for completion stats
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
    let isThinking = false;

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
              const textDelta = parsedData as string;

              // Handle thinking tags with proper text segmentation
              const processTextWithThinkingTags = (text: string) => {
                // Regular expression to match thinking tags (case-insensitive)
                const thinkingTagRegex = /<\/?think(?:ing)?\s*>/gi;

                let currentIndex = 0;
                let match;

                while ((match = thinkingTagRegex.exec(text)) !== null) {
                  // Process text before the tag
                  if (match.index > currentIndex) {
                    const beforeTag = text.slice(currentIndex, match.index);
                    if (beforeTag) {
                      if (isThinking) {
                        callbacks.onThinkingDelta(beforeTag);
                      } else {
                        callbacks.onTextDelta(beforeTag);
                      }
                    }
                  }

                  // Update thinking state based on tag type
                  const tagContent = match[0].toLowerCase();
                  if (
                    tagContent.startsWith("<think>") ||
                    tagContent.startsWith("<thinking>")
                  ) {
                    isThinking = true;
                  } else if (
                    tagContent.startsWith("</think>") ||
                    tagContent.startsWith("</thinking>")
                  ) {
                    isThinking = false;
                  }

                  currentIndex = match.index + match[0].length;
                }

                // Process remaining text after the last tag
                if (currentIndex < text.length) {
                  const remainingText = text.slice(currentIndex);
                  if (remainingText) {
                    if (isThinking) {
                      callbacks.onThinkingDelta(remainingText);
                    } else {
                      callbacks.onTextDelta(remainingText);
                    }
                  }
                }
              };

              // Process the text delta with thinking tag handling
              processTextWithThinkingTags(textDelta);
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
            case "f": // Message finalization
              console.log("Stream Service: Message finalized", parsedData);
              // This indicates the message is complete
              // The parsedData typically contains messageId
              break;
            case "d": // Done signal with completion stats
              console.log("Stream Service: Stream done", parsedData);
              // This indicates the stream is done with finish reason and usage stats
              // parsedData contains: finishReason, usage (promptTokens, completionTokens)
              if (callbacks.onCompletion) {
                callbacks.onCompletion(parsedData);
              }
              break;
            case "e": // Stream completion/end with usage stats
              console.log("Stream Service: Stream completed", parsedData);
              // This indicates the stream is complete with finish reason and usage stats
              // parsedData contains: finishReason, usage (promptTokens, completionTokens), isContinued
              if (callbacks.onCompletion) {
                callbacks.onCompletion(parsedData);
              }
              break;
            case "3": // Tool result/response
              console.log("Stream Service: Tool result received", parsedData);
              // Handle tool execution results
              if (callbacks.onToolCall) {
                callbacks.onToolCall(parsedData);
              }
              break;
            case "4": // Metadata
              console.log("Stream Service: Metadata received", parsedData);
              // Handle metadata (model info, capabilities, etc.)
              break;
            case "5": // Progress/status updates
              console.log("Stream Service: Progress update", parsedData);
              // Handle progress indicators, status updates
              break;
            case "6": // Debug information
              console.log("Stream Service: Debug info", parsedData);
              // Handle debug information
              break;
            case "7": // Warning messages
              console.log("Stream Service: Warning", parsedData);
              // Handle non-fatal warnings
              break;
            case "9": // Heartbeat/keepalive
              // Handle heartbeat signals (usually silent)
              break;
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
