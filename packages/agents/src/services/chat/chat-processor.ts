import { chatAgent } from "../../agents/chat-agent";
import { gitAgent } from "../../agents/git-agent";
import { chatToolsAskMode, chatToolsWriteMode } from "../../tools/chat-tools";
import { mapMessages } from "../../utils";
import { logger } from "../../utils/logger";
import { isoGitService } from "../isogit";
import { trpc } from "../trpc";
import { chatHooksManager } from "./hooks";
import { subscriptionManager } from "./subscription-manager";
import type { ChatSendEvent } from "./types";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "idle" | "in_progress" | "completed" | "error";
  result?: any;
  timestamp: string;
}

export class ChatProcessor {
  // Map of chatId to AbortController for cancelling ongoing requests
  private chatAbortControllers = new Map<number, AbortController>();
  private mcpTools: Record<string, unknown> = {};

  setTools(tools: Record<string, unknown>) {
    this.mcpTools = tools;
  }

  private async updateAssistantMessage(
    assistantMessageId: number | null,
    content: string,
    toolCalls: Record<string, ToolCall>
  ): Promise<void> {
    if (!assistantMessageId) return;

    try {
      await trpc.chat.updateMessage.mutate({
        messageId: assistantMessageId,
        content,
        toolCalls: Object.keys(toolCalls).length > 0 ? toolCalls : undefined,
      });
    } catch (error) {
      logger.error("Failed to update assistant message:", error);
    }
  }

  private async handleCancellation(
    chatId: number,
    assistantMessageId: number | null,
    accumulatedContent: string,
    toolCalls: Record<string, ToolCall>
  ): Promise<void> {
    logger.info(`Chat ${chatId} was cancelled`);

    const finalContent = accumulatedContent + "\n\n(Canceled by user)";

    await this.updateAssistantMessage(
      assistantMessageId,
      finalContent,
      toolCalls
    );

    subscriptionManager.broadcastToChat(chatId, {
      event: "chat:status",
      data: { status: "error", chatId },
    });

    await chatHooksManager.onChatCancel(chatId);
  }

  private broadcastChunk(
    chatId: number,
    assistantMessageId: number | null,
    chunk: any,
    type: string
  ): void {
    subscriptionManager.broadcastToChat(chatId, {
      event: "chat:chunk",
      data: {
        chatId,
        assistantMessageId,
        chunk: typeof chunk === "string" ? chunk : JSON.stringify(chunk),
        type: type as "text" | "tool-call" | "tool-result",
      },
    });
  }

  async handleChatSend(data: ChatSendEvent["data"]): Promise<void> {
    const { chatId, model, messages, userMessageId, mode } = data;

    let assistantMessageId: number | null = null;
    let accumulatedContent = "";
    const toolCalls: Record<string, ToolCall> = {};
    const textBlocks: Record<string, string> = {};

    // Create abort controller for this chat
    const abortController = new AbortController();
    this.chatAbortControllers.set(chatId, abortController);

    try {
      const workingDir = process.cwd();

      // Trigger chat start hook
      await chatHooksManager.onChatStart(chatId, data);

      // Broadcast initial status
      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:status",
        data: { status: "in_progress", chatId, mode, model },
      });

      // Initialize repository if needed
      if (!(await isoGitService.isRepositoryInitialized(workingDir))) {
        await isoGitService.initializeRepository(workingDir);
      }

      // Update message with commit info
      const { status, commit } = await isoGitService.getLastCommit(workingDir);
      if (status === "success" && userMessageId) {
        await trpc.chat.updateMessage.mutate({
          messageId: Number(userMessageId),
          commit: commit?.oid,
        });

        await chatHooksManager.onMessageUpdate(
          Number(userMessageId),
          commit?.oid
        );
      }

      // Create assistant message
      try {
        const assistantMessage = await trpc.chat.saveMessage.mutate({
          chatId,
          role: "assistant",
          content: "",
        });
        assistantMessageId = assistantMessage.id;
      } catch (error) {
        logger.error("Failed to create assistant message:", error);
      }

      // Combine tools
      const localChatTools =
        mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
      const allTools = { ...localChatTools, ...this.mcpTools };

      // Start chat agent
      const result = await chatAgent(
        {
          model,
          messages: mapMessages(messages),
          mode: mode === "write" ? "write" : "ask",
          workingDir,
          tools: allTools,
          callbacks: {
            onStepFinish: async (stepResult) => {
              logger.debug(`Step completed for chat ${chatId}:`, {
                text: stepResult.text,
                toolCalls: stepResult.toolCalls?.length || 0,
              });

              await this.updateAssistantMessage(
                assistantMessageId,
                accumulatedContent,
                toolCalls
              );
            },
            onFinish: async () => {
              if (mode === "write") {
                try {
                  const commitMessage = await gitAgent({
                    model,
                    messages: mapMessages(messages),
                  });
                  await isoGitService.saveToHistory(
                    workingDir,
                    commitMessage.text
                  );
                } catch (error) {
                  logger.error("Failed to save to git history:", error);
                }
              }
            },
            onError: async (error: Error) => {
              logger.error(`Chat agent error for chat ${chatId}:`, error);
              subscriptionManager.broadcastToChat(chatId, {
                event: "chat:error",
                data: {
                  chatId,
                  assistantMessageId,
                  error: error.message,
                  code: "CHAT_AGENT_ERROR",
                },
              });
            },
          },
        },
        { abortSignal: abortController.signal }
      );

      // Process the stream with AI SDK v5 chunk types
      for await (const chunk of result.fullStream) {
        if (abortController.signal.aborted) {
          logger.info(
            `Stream for chat ${chatId} was aborted during processing`
          );
          break;
        }

        switch (chunk.type) {
          case "start": {
            logger.debug("Stream started");
            break;
          }

          case "text-start": {
            logger.debug(`Text block started: ${chunk.id}`);
            textBlocks[chunk.id] = "";
            break;
          }

          case "text-delta": {
            const textContent = chunk.text;
            textBlocks[chunk.id] += textContent;
            accumulatedContent += textContent;

            this.broadcastChunk(
              chatId,
              assistantMessageId,
              textContent,
              "text"
            );
            break;
          }

          case "text-end": {
            logger.debug(`Text block completed: ${chunk.id}`);
            break;
          }

          case "tool-input-start": {
            const toolCall: ToolCall = {
              id: chunk.id,
              name: chunk.toolName,
              arguments: {},
              status: "input-streaming",
              timestamp: new Date().toISOString(),
            };
            toolCalls[chunk.id] = toolCall;

            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "tool-input-start",
                id: chunk.id,
                toolName: chunk.toolName,
              },
              "tool-input-start"
            );
            break;
          }

          case "tool-input-delta": {
            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "tool-input-delta",
                id: chunk.id,
                delta: chunk.delta,
              },
              "tool-input-delta"
            );
            break;
          }

          case "tool-input-end": {
            const toolCall = toolCalls[chunk.id];
            if (toolCall) {
              toolCall.status = "input-available";
            }

            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "tool-input-end",
                id: chunk.id,
              },
              "tool-input-end"
            );
            break;
          }

          case "tool-call": {
            const toolCall = toolCalls[chunk.toolCallId];
            if (toolCall) {
              toolCall.arguments = chunk.input;
              toolCall.status = "executing";
            }

            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "tool-call",
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                input: chunk.input,
              },
              "tool-call"
            );

            // Add tool call marker to content
            accumulatedContent += `\n[Tool: ${chunk.toolName}]`;
            break;
          }

          case "tool-result": {
            const toolCall = toolCalls[chunk.toolCallId];
            if (toolCall) {
              toolCall.status =
                chunk.result &&
                typeof chunk.result === "object" &&
                "isError" in chunk.result &&
                chunk.result.isError
                  ? "error"
                  : "completed";
              toolCall.result = chunk.result;
            }

            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "tool-result",
                toolCallId: chunk.toolCallId,
                result: chunk.result,
                isError:
                  chunk.result &&
                  typeof chunk.result === "object" &&
                  "isError" in chunk.result &&
                  chunk.result.isError,
              },
              "tool-result"
            );

            if (
              chunk.result &&
              typeof chunk.result === "object" &&
              "isError" in chunk.result &&
              chunk.result.isError
            ) {
              accumulatedContent += `\n[Tool Error: ${
                (chunk.result as any)?.error || "Unknown error"
              }]`;
            }
            break;
          }

          case "reasoning-start": {
            logger.debug(`Reasoning block started: ${chunk.id}`);
            break;
          }

          case "reasoning-delta": {
            // Reasoning content can be handled similarly to text
            this.broadcastChunk(
              chatId,
              assistantMessageId,
              chunk.text,
              "reasoning"
            );
            break;
          }

          case "reasoning-end": {
            logger.debug(`Reasoning block completed: ${chunk.id}`);
            break;
          }

          case "source": {
            this.broadcastChunk(
              chatId,
              assistantMessageId,
              {
                type: "source",
                sourceType: chunk.sourceType,
                id: chunk.id,
                url: chunk.sourceType === "url" ? chunk.url : undefined,
                title: chunk.title,
              },
              "source"
            );
            break;
          }

          case "finish": {
            logger.debug("Stream finished", {
              usage: chunk.totalUsage,
              finishReason: chunk.finishReason,
            });

            subscriptionManager.broadcastToChat(chatId, {
              event: "chat:complete",
              data: {
                chatId,
                assistantMessageId,
                usage: chunk.totalUsage,
                finishReason: chunk.finishReason,
              },
            });
            break;
          }

          default: {
            logger.debug("Unhandled chunk type:", chunk.type);
            break;
          }
        }
      }

      if (!abortController.signal.aborted) {
        // Broadcast completion status
        subscriptionManager.broadcastToChat(chatId, {
          event: "chat:status",
          data: { status: "completed", chatId },
        });

        // Final update to assistant message
        await this.updateAssistantMessage(
          assistantMessageId,
          accumulatedContent,
          toolCalls
        );

        // Trigger completion hook
        await chatHooksManager.onChatComplete(
          chatId,
          accumulatedContent,
          (await result.usage) || undefined
        );
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        await this.handleCancellation(
          chatId,
          assistantMessageId,
          accumulatedContent,
          toolCalls
        );
        return;
      }

      logger.error(`Chat error for chat ${chatId}:`, error);

      // Handle git commit even on error if in write mode
      if (mode === "write") {
        try {
          const commitMessage = await gitAgent({
            model,
            messages: mapMessages(messages),
          });
          await isoGitService.saveToHistory(process.cwd(), commitMessage.text);
        } catch (gitError) {
          logger.error("Failed to save to git history after error:", gitError);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      accumulatedContent += `\n\n[Chat Error: ${errorMessage}]`;

      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:error",
        data: {
          chatId,
          assistantMessageId,
          error: errorMessage,
          code: "CHAT_ERROR",
        },
      });

      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:status",
        data: { status: "error", chatId, error: errorMessage },
      });

      await this.updateAssistantMessage(
        assistantMessageId,
        accumulatedContent,
        toolCalls
      );

      await chatHooksManager.onChatError(chatId, errorMessage);
    } finally {
      this.chatAbortControllers.delete(chatId);
    }
  }

  handleChatCancel(chatId: number): void {
    logger.info(`Cancelling chat ${chatId}`);

    const abortController = this.chatAbortControllers.get(chatId);
    if (abortController) {
      abortController.abort();
      logger.debug(`Successfully signaled cancellation for chat ${chatId}`);
    } else {
      logger.warn(`No active stream found for chat ${chatId} to cancel`);

      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:status",
        data: { status: "idle", chatId },
      });
    }
  }

  getActiveChats(): number[] {
    return Array.from(this.chatAbortControllers.keys());
  }

  isProcessing(chatId: number): boolean {
    return this.chatAbortControllers.has(chatId);
  }

  destroy(): void {
    for (const [chatId, controller] of this.chatAbortControllers) {
      logger.info(`Cancelling chat ${chatId} during shutdown`);
      controller.abort();
    }
    this.chatAbortControllers.clear();
  }

  clear(): void {
    this.chatAbortControllers.clear();
  }
}

export const chatProcessor = new ChatProcessor();
