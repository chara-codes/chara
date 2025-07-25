import type { LanguageModelV1FinishReason } from "@ai-sdk/provider";
import { parseDataStreamPart } from "@ai-sdk/ui-utils";
import type { ChatMode, Message, StreamMessage } from "../types";
import { THINKING_TAG_REGEX } from "../utils";

export interface EditOperation {
  type: "insert" | "replace";
  file_path: string;
  code?: string;
  start_line?: number;
  end_line?: number;
  status?: "pending" | "applying" | "complete" | "error";
  error?: string;
}

export interface StreamCallbacks {
  onStreamOpen?: () => void;
  onStreamClose?: (aborted: boolean) => void;
  onStreamError: (error: string) => void;
  onTextDelta: (delta: string) => void;
  onThinkingDelta: (delta: string) => void;
  onToolCall: (toolCall: any) => void;
  onToolCallArgsUpdate?: (
    toolCallId: string,
    args: Record<string, unknown>,
    argsText: string
  ) => void;
  onStructuredData: (data: Partial<Message>) => void;
  onCompletion: (completion: {
    finishReason: LanguageModelV1FinishReason;
    usage?: {
      promptTokens: number;
      completionTokens: number;
    };
  }) => void;
}

export interface StreamRequestPayload {
  messages: StreamMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  user?: { id: string };
  chatId: string;
  userMessageId?: string;
}

export async function processChatStream(
  apiUrl: string,
  payload: StreamRequestPayload,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  mode: ChatMode = "write"
): Promise<void> {
  try {
    if (callbacks.onStreamOpen) {
      callbacks.onStreamOpen();
    }

    const response = await fetch(`${apiUrl}?mode=${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (signal.aborted) {
      console.log("Stream Service: Fetch aborted by user before response.");
      if (callbacks.onStreamClose) {
        callbacks.onStreamClose(true);
      }
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Agent request failed: ${response.status} ${
          errorText || response.statusText
        }`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = "";
    let isThinking = false;

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
        lastValidArgs?: Record<string, unknown>;
      }
    >();

    while (true) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) {
        if (signal.aborted)
          console.log("Stream Service: Stream reading aborted by user.");
        break;
      }

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split("\n");
      streamBuffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;

        try {
          const parsedPart = parseDataStreamPart(line);

          switch (parsedPart.type) {
            case "text": {
              const textDelta = parsedPart.value;

              const processTextWithThinkingTags = (text: string) => {
                const thinkingTagRegex = new RegExp(
                  THINKING_TAG_REGEX.source,
                  THINKING_TAG_REGEX.flags
                );
                let currentIndex = 0;
                let match: RegExpExecArray | null;
                const partialTagRegex = /<\/?think(?:ing)?(?:\s[^>]*)?$/i;
                const partialMatch = partialTagRegex.exec(text);
                let textToProcess = text;
                if (partialMatch) {
                  textToProcess = text.slice(0, partialMatch.index);
                }

                match = thinkingTagRegex.exec(textToProcess);
                while (match !== null) {
                  if (match.index > currentIndex) {
                    const beforeTag = textToProcess.slice(
                      currentIndex,
                      match.index
                    );
                    if (beforeTag) {
                      if (isThinking) {
                        callbacks.onThinkingDelta(beforeTag);
                      } else {
                        callbacks.onTextDelta(beforeTag);
                      }
                    }
                  }

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
                  match = thinkingTagRegex.exec(textToProcess);
                }

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
              };

              processTextWithThinkingTags(textDelta);

              if (!isThinking) {
                // Text delta handling without segments
              }
              break;
            }

            case "tool_call_streaming_start": {
              const { toolCallId, toolName } = parsedPart.value;
              console.log("Stream Service: Tool call begin", parsedPart.value);
              pendingToolCalls.set(toolCallId, {
                id: toolCallId,
                name: toolName,
                argsText: "",
                status: "pending",
                timestamp: new Date().toISOString(),
              });

              // Tool call started
              break;
            }

            case "tool_call_delta": {
              const { toolCallId } = parsedPart.value;
              const pending = pendingToolCalls.get(toolCallId);
              if (pending) {
                pending.status = "in-progress";

                const streamingToolCall = {
                  id: pending.id,
                  name: pending.name,
                  arguments: pending.arguments || {},
                  status: pending.status,
                  timestamp: pending.timestamp,
                  isStreaming: true,
                  argsText: pending.argsText,
                };

                if (callbacks.onToolCall) {
                  callbacks.onToolCall(streamingToolCall);
                }
                if (callbacks.onToolCallArgsUpdate && pending.arguments) {
                  callbacks.onToolCallArgsUpdate(
                    toolCallId,
                    pending.arguments,
                    pending.argsText
                  );
                }
              }
              break;
            }

            case "tool_call": {
              const { toolCallId, args } = parsedPart.value;
              console.log(
                "Stream Service: Tool call complete with arguments",
                parsedPart.value
              );
              const pending = pendingToolCalls.get(toolCallId);
              if (pending) {
                pending.arguments = args as Record<string, unknown>;
                pending.status = "in-progress";

                if (
                  pending.name === "edit-file" ||
                  pending.name === "edit_file"
                ) {
                  const edits =
                    (args as { edits: EditOperation[] }).edits || [];
                  const processedEdits = Array.isArray(edits)
                    ? edits.map((edit: EditOperation) => ({
                        ...edit,
                        status: "pending" as const,
                      }))
                    : [];
                  pending.arguments = {
                    ...args,
                    edits: processedEdits,
                  };
                }
              }
              break;
            }

            case "tool_result": {
              const { toolCallId, result } = parsedPart.value;
              console.log("Stream Service: Tool call result", parsedPart.value);
              const pending = pendingToolCalls.get(toolCallId);
              if (pending) {
                pending.result = result;
                const hasError =
                  result && typeof result === "object" && "error" in result;
                pending.status = hasError ? "error" : "success";

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
                          ? String((result as { error?: string })?.error)
                          : undefined,
                      }))
                    : [];
                  pending.arguments = {
                    ...pending.arguments,
                    edits: finalEdits,
                  };
                }

                const toolCall = {
                  id: pending.id,
                  name: pending.name,
                  arguments: pending.arguments || {},
                  status: pending.status,
                  result: result,
                  timestamp: pending.timestamp,
                };
                callbacks.onToolCall(toolCall);

                pendingToolCalls.delete(toolCallId);
              }
              break;
            }

            case "error": {
              const errorMessage = parsedPart.value;
              console.error(
                "Stream Service: Error message received:",
                errorMessage
              );

              let errorHandled = false;
              for (const [, pending] of pendingToolCalls.entries()) {
                if (pending.status === "in-progress") {
                  if (
                    pending.name === "edit-file" ||
                    pending.name === "edit_file"
                  ) {
                    const edits = pending.arguments?.edits || [];
                    const failedEdits = Array.isArray(edits)
                      ? edits.map((edit: EditOperation) => ({
                          ...edit,
                          status: "error" as const,
                          error: errorMessage,
                        }))
                      : [];
                    pending.arguments = {
                      ...pending.arguments,
                      edits: failedEdits,
                    };
                  }
                  pending.status = "error";
                  pending.result = { error: errorMessage };
                  errorHandled = true;
                  break;
                }
              }

              if (!errorHandled) {
                callbacks.onStreamError(errorMessage);
              }
              break;
            }

            case "data": {
              const data = parsedPart.value;
              if (Array.isArray(data) && data.length > 0) {
                const structuredUpdate: Partial<Message> = {};
                if (Object.keys(structuredUpdate).length > 0) {
                  callbacks.onStructuredData(structuredUpdate);
                }
              }
              break;
            }

            case "finish_message": {
              console.log("Stream Service: Stream done", parsedPart.value);
              if (callbacks.onCompletion) {
                callbacks.onCompletion(parsedPart.value);
              }
              break;
            }

            case "finish_step": {
              console.log("Stream Service: Stream completed", parsedPart.value);
              if (callbacks.onCompletion) {
                // Adapt the type if necessary, or assume it's compatible
                callbacks.onCompletion(parsedPart.value);
              }
              break;
            }

            case "start_step": {
              console.log(
                "Stream Service: Message finalized",
                parsedPart.value
              );
              break;
            }

            default:
              console.warn(
                "Stream Service: Unknown stream data type:",
                (parsedPart as any).type,
                parsedPart.value
              );
          }
        } catch (e) {
          console.error("Stream Service: Error parsing stream line:", line, e);
        }
      }
      if (signal.aborted) break;
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
          : "Unknown stream processing error"
      );
      if (callbacks.onStreamClose) callbacks.onStreamClose(false);
    }
  }
}
