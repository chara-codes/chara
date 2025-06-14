/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, FileDiff, MessageContent } from "../types"; // Assuming types are in store
import { MessageSegmentBuilder } from "./message-segment-builder.ts";
import { THINKING_TAG_REGEX } from "../utils";

// Type definitions for edit operations
interface EditOperation {
  oldText: string;
  newText: string;
  status?: "pending" | "applying" | "complete" | "error";
  error?: string;
}

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
  onSegmentUpdate?: (
    segments: Array<{
      type: "text" | "tool-call";
      content: string;
      toolCall?: {
        id: string;
        name: string;
        arguments: Record<string, unknown>;
        status: "pending" | "in-progress" | "success" | "error";
        result?: unknown;
        timestamp: string;
      };
    }>,
  ) => void; // For inline tool call rendering
}

export interface StreamRequestPayload {
  messages: Array<{
    role: string;
    content: string | MessageContent[];
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

    // Track partial tool calls during streaming
    const pendingToolCalls = new Map<
      string,
      {
        id: string;
        name: string;
        argsText: string;
        arguments?: Record<string, unknown>;
        status: "pending" | "in-progress" | "success" | "error";
        result?: unknown;
        timestamp: string;
      }
    >();

    // Message segment builder for inline tool calls
    const segmentBuilder = new MessageSegmentBuilder();

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
            case "0": {
              // Text delta
              const textDelta = parsedData as string;

              // Handle thinking tags with proper text segmentation
              const processTextWithThinkingTags = (text: string) => {
                // Use shared thinking tag regex for consistent handling
                const thinkingTagRegex = new RegExp(
                  THINKING_TAG_REGEX.source,
                  THINKING_TAG_REGEX.flags,
                );

                let currentIndex = 0;
                let match: RegExpExecArray | null;

                // Check if text ends with a partial tag that might be completed in next chunk
                const partialTagRegex = /<\/?think(?:ing)?(?:\s[^>]*)?$/i;
                const partialMatch = partialTagRegex.exec(text);

                // If we have a partial tag at the end, process everything except the partial tag
                let textToProcess = text;
                if (partialMatch) {
                  textToProcess = text.slice(0, partialMatch.index);
                  // The partial tag will be handled when the complete tag arrives
                }

                // Avoid assignment in expressions
                while (true) {
                  match = thinkingTagRegex.exec(textToProcess);
                  if (match === null) break;

                  // Process text before the tag
                  if (match.index > currentIndex) {
                    const beforeTag = textToProcess.slice(
                      currentIndex,
                      match.index,
                    );
                    if (beforeTag) {
                      if (isThinking) {
                        callbacks.onThinkingDelta(beforeTag);
                      } else {
                        callbacks.onTextDelta(beforeTag);
                      }
                    }
                  }

                  // Update thinking state based on tag type
                  const tagContent = match[0].toLowerCase().trim();
                  if (
                    tagContent.startsWith("<think>") ||
                    tagContent.startsWith("<thinking>") ||
                    tagContent.startsWith("<think ") ||
                    tagContent.startsWith("<thinking ")
                  ) {
                    isThinking = true;
                  } else if (
                    tagContent.startsWith("</think>") ||
                    tagContent.startsWith("</thinking>") ||
                    tagContent.startsWith("</think") ||
                    tagContent.startsWith("</thinking")
                  ) {
                    isThinking = false;
                  }

                  currentIndex = match.index + match[0].length;
                }

                // Process remaining text after the last tag (excluding partial tag)
                if (currentIndex < textToProcess.length) {
                  const remainingText = textToProcess.slice(currentIndex);
                  if (remainingText) {
                    if (isThinking) {
                      callbacks.onThinkingDelta(remainingText);
                    } else {
                      callbacks.onTextDelta(remainingText);
                    }
                  }
                }

                // If we have a partial tag, don't process it yet - wait for completion
                if (partialMatch) {
                  // Store partial tag for next processing cycle if needed
                  // For now, we'll just ignore it and let it be completed in the next chunk
                }
              };

              // Process the text delta with thinking tag handling
              processTextWithThinkingTags(textDelta);

              // Also add to segment builder if not thinking
              if (!isThinking) {
                segmentBuilder.addTextDelta(textDelta);
                if (callbacks.onSegmentUpdate) {
                  callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                }
              }
              break;
            }
            case "1": // Tool Call
              callbacks.onToolCall(parsedData);
              break;
            case "b": // Tool call begin
              // Start a new tool call
              console.log("Stream Service: Tool call begin", parsedData);
              if (parsedData.toolCallId && parsedData.toolName) {
                pendingToolCalls.set(parsedData.toolCallId, {
                  id: parsedData.toolCallId,
                  name: parsedData.toolName,
                  argsText: "",
                  status: "pending",
                  timestamp: new Date().toISOString(),
                });

                // Tool call will be sent to UI only when completed
                console.log(
                  "Stream Service: Tool call started",
                  parsedData.toolCallId,
                );

                // Add to segment builder for inline rendering
                segmentBuilder.beginToolCall(
                  parsedData.toolCallId,
                  parsedData.toolName,
                );
                if (callbacks.onSegmentUpdate) {
                  callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                }
              }
              break;
            case "c": // Tool call arguments delta
              // Build up arguments text
              console.log("Stream Service: Tool call args delta", parsedData);
              if (
                parsedData.toolCallId &&
                parsedData.argsTextDelta !== undefined
              ) {
                const pending = pendingToolCalls.get(parsedData.toolCallId);
                if (pending) {
                  pending.argsText += parsedData.argsTextDelta;
                  pending.status = "in-progress";
                  console.log("Stream Service: Updated args text", {
                    toolCallId: parsedData.toolCallId,
                    argsText: pending.argsText,
                  });

                  // Try to parse partial arguments for display
                  try {
                    if (pending.argsText.trim()) {
                      const partialArgs = JSON.parse(pending.argsText);
                      pending.arguments = partialArgs;

                      // For edit-file tool calls, process streaming edits
                      if (
                        pending.name === "edit-file" ||
                        pending.name === "edit_file"
                      ) {
                        const edits = partialArgs.edits || [];
                        // Add streaming status to each edit operation
                        const processedEdits = Array.isArray(edits)
                          ? edits.map((edit: EditOperation) => ({
                              ...edit,
                              status: "applying" as const,
                            }))
                          : [];
                        pending.arguments = {
                          ...partialArgs,
                          edits: processedEdits,
                        };
                      }
                    }
                  } catch {
                    // Keep building arguments text
                  }

                  // Tool call arguments are being built, will send to UI when completed
                  console.log(
                    "Stream Service: Tool call arguments updated",
                    parsedData.toolCallId,
                  );

                  // Update segment builder
                  segmentBuilder.updateToolCallArgs(
                    parsedData.toolCallId,
                    pending.arguments || {},
                  );
                  if (callbacks.onSegmentUpdate) {
                    callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                  }
                }
              }
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
            case "d": {
              // Done signal with completion stats
              console.log("Stream Service: Stream done", parsedData);
              // This indicates the stream is done with finish reason and usage stats
              // parsedData contains: finishReason, usage (promptTokens, completionTokens)

              // Finalize segments when stream completes
              const finalSegments = segmentBuilder.finalize();
              if (callbacks.onSegmentUpdate) {
                callbacks.onSegmentUpdate(finalSegments);
              }

              if (callbacks.onCompletion) {
                callbacks.onCompletion(parsedData);
              }
              break;
            }
            case "e": {
              // Stream completion/end with usage stats
              console.log("Stream Service: Stream completed", parsedData);
              // This indicates the stream is complete with finish reason and usage stats
              // parsedData contains: finishReason, usage (promptTokens, completionTokens), isContinued

              // Finalize segments when stream completes
              const finalSegmentsE = segmentBuilder.finalize();
              if (callbacks.onSegmentUpdate) {
                callbacks.onSegmentUpdate(finalSegmentsE);
              }

              if (callbacks.onCompletion) {
                callbacks.onCompletion(parsedData);
              }
              break;
            }
            case "3": // Error message or tool result/response
              console.log("Stream Service: Type 3 chunk received", parsedData);
              // Check if this is an error message (string) or tool result (object)
              if (typeof parsedData === "string") {
                // Handle error message - could be a tool call error
                console.error(
                  "Stream Service: Error message received:",
                  parsedData,
                );

                // Try to find which tool call this error belongs to
                let errorHandled = false;
                for (const [
                  toolCallId,
                  pending,
                ] of pendingToolCalls.entries()) {
                  if (pending.status === "in-progress") {
                    // Mark edits as failed for edit-file tool calls
                    if (
                      pending.name === "edit-file" ||
                      pending.name === "edit_file"
                    ) {
                      const edits = pending.arguments?.edits || [];
                      const failedEdits = Array.isArray(edits)
                        ? edits.map((edit: EditOperation) => ({
                            ...edit,
                            status: "error" as const,
                            error: parsedData,
                          }))
                        : [];
                      pending.arguments = {
                        ...pending.arguments,
                        edits: failedEdits,
                      };
                    }

                    pending.status = "error";
                    pending.result = { error: parsedData };

                    // Update segment builder
                    segmentBuilder.errorToolCall(toolCallId, parsedData);
                    if (callbacks.onSegmentUpdate) {
                      callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                    }

                    errorHandled = true;
                    break;
                  }
                }

                if (!errorHandled) {
                  callbacks.onStreamError(parsedData);
                }
              } else {
                // Handle tool execution results
                console.log("Stream Service: Tool result received", parsedData);
                if (callbacks.onToolCall) {
                  callbacks.onToolCall(parsedData);
                }
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
            case "9": // Tool call complete with arguments
              // Finalize tool call with complete arguments
              console.log(
                "Stream Service: Tool call complete with arguments",
                parsedData,
              );
              if (parsedData.toolCallId && parsedData.args) {
                const pending = pendingToolCalls.get(parsedData.toolCallId);
                if (pending) {
                  pending.arguments = parsedData.args;
                  pending.status = "in-progress";

                  // For edit-file tool calls, mark edits as pending before execution
                  if (
                    pending.name === "edit-file" ||
                    pending.name === "edit_file"
                  ) {
                    const edits = parsedData.args.edits || [];
                    const processedEdits = Array.isArray(edits)
                      ? edits.map((edit: EditOperation) => ({
                          ...edit,
                          status: "pending" as const,
                        }))
                      : [];
                    pending.arguments = {
                      ...parsedData.args,
                      edits: processedEdits,
                    };
                  }

                  // Update segment builder with arguments
                  segmentBuilder.updateToolCallArgs(
                    parsedData.toolCallId,
                    pending.arguments || {},
                  );
                  if (callbacks.onSegmentUpdate) {
                    callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                  }
                }
              }
              break;
            case "a": // Tool call result
              // Add result to tool call
              console.log("Stream Service: Tool call result", parsedData);
              if (parsedData.toolCallId && parsedData.result) {
                const pending = pendingToolCalls.get(parsedData.toolCallId);
                if (pending) {
                  pending.result = parsedData.result;

                  // Determine success/error status based on result
                  const hasError =
                    parsedData.result &&
                    typeof parsedData.result === "object" &&
                    "error" in parsedData.result;

                  pending.status = hasError ? "error" : "success";

                  // For edit-file tool calls, update edit statuses based on result
                  if (
                    pending.name === "edit-file" ||
                    pending.name === "edit_file"
                  ) {
                    const edits = pending.arguments?.edits || [];
                    const finalEdits = Array.isArray(edits)
                      ? edits.map((edit: EditOperation) => ({
                          ...edit,
                          status: hasError
                            ? ("error" as const)
                            : ("complete" as const),
                          error: hasError
                            ? String(
                                (parsedData.result as { error?: string })
                                  ?.error,
                              )
                            : undefined,
                        }))
                      : [];
                    pending.arguments = {
                      ...pending.arguments,
                      edits: finalEdits,
                    };
                  }

                  // Send final tool call with result
                  const toolCall = {
                    id: pending.id,
                    name: pending.name,
                    arguments: pending.arguments || {},
                    status: pending.status,
                    result: parsedData.result,
                    timestamp: pending.timestamp,
                  };
                  console.log(
                    "Stream Service: Sending final tool call with result",
                    toolCall,
                  );
                  callbacks.onToolCall(toolCall);

                  // Complete tool call in segment builder
                  segmentBuilder.completeToolCall(
                    parsedData.toolCallId,
                    parsedData.result,
                  );
                  if (callbacks.onSegmentUpdate) {
                    callbacks.onSegmentUpdate(segmentBuilder.getSegments());
                  }

                  // Clean up completed tool call
                  pendingToolCalls.delete(parsedData.toolCallId);
                }
              }
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

    // Finalize segments when stream closes
    const finalSegmentsClose = segmentBuilder.finalize();
    if (callbacks.onSegmentUpdate) {
      callbacks.onSegmentUpdate(finalSegmentsClose);
    }

    if (callbacks.onStreamClose) {
      callbacks.onStreamClose(signal.aborted);
    }
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
