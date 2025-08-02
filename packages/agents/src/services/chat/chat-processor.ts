import { logger } from "@chara-codes/logger";
import { chatAgent } from "../../agents/chat-agent";
import { gitAgent } from "../../agents/git-agent";
import { chatToolsAskMode, chatToolsWriteMode } from "../../tools/chat-tools";
import { mapMessages } from "../../utils";
import { isoGitService } from "../isogit";
import { trpc } from "../trpc";
import { chatHooksManager } from "./hooks";
import { statusManager } from "./status-manager";
import { subscriptionManager } from "./subscription-manager";
import type { ChatSendEvent } from "./types";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "in-progress" | "success" | "error";
  result?: any;
  timestamp?: string;
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

    // Add cancellation message to content
    const finalContent = accumulatedContent + "\n\n(Canceled by user)";

    // Update message with cancellation info
    await this.updateAssistantMessage(
      assistantMessageId,
      finalContent,
      toolCalls
    );

    // Update status and broadcast
    const completedStatus = statusManager.updateChatStatus(chatId, {
      status: "completed",
      completedAt: Date.now(),
    });

    subscriptionManager.broadcastToChat(chatId, {
      event: "chat:status",
      data: completedStatus,
    });

    await chatHooksManager.onChatCancel(chatId);
  }

  private handleToolCall(
    chunk: any,
    toolCalls: Record<string, ToolCall>,
    accumulatedContent: string
  ): string {
    // Add tool call to collection
    const toolCall: ToolCall = {
      id: chunk.toolCallId,
      name: chunk.toolName,
      arguments: chunk.args,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    toolCalls[chunk.toolCallId] = toolCall;

    // Add tool call tag to accumulated content
    const toolCallTag = `[toolCall:${chunk.toolCallId},${chunk.toolName}]`;
    return accumulatedContent + toolCallTag;
  }

  private handleToolResult(
    chunk: { toolCallId: string; isError?: boolean; result?: any },
    toolCalls: Record<string, ToolCall>,
    accumulatedContent: string
  ): string {
    // Update tool call status and result
    const toolCall = toolCalls[chunk.toolCallId];
    if (toolCall) {
      toolCall.status = chunk.isError ? "error" : "success";
      toolCall.result = chunk.result;

      // Add error information to content if tool call failed
      if (chunk.isError) {
        const errorInfo = `\n[Error in ${toolCall.name}: ${
          chunk.result?.error || "Unknown error"
        }]`;
        return accumulatedContent + errorInfo;
      }
    }
    return accumulatedContent;
  }

  private updateStatusAndBroadcast(
    chatId: number,
    status: any,
    event: string = "chat:status"
  ): void {
    subscriptionManager.broadcastToChat(chatId, {
      event: event as any,
      data: status,
    });
  }

  async handleChatSend(data: ChatSendEvent["data"]): Promise<void> {
    const { chatId, model, messages, userMessageId, mode } = data;

    // Track assistant message and accumulated content
    let assistantMessageId: number | null = null;
    let accumulatedContent = "";
    const toolCalls: Record<string, ToolCall> = {};

    // Check if chat is already in progress
    if (statusManager.isChatInProgress(chatId)) {
      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:error",
        data: {
          chatId,
          assistantMessageId: null,
          error: "Chat is already in progress",
          code: "CHAT_IN_PROGRESS",
        },
      });
      return;
    }

    // Create abort controller for this chat
    const abortController = new AbortController();
    this.chatAbortControllers.set(chatId, abortController);

    try {
      const workingDir = process.cwd();

      // Trigger chat start hook
      await chatHooksManager.onChatStart(chatId, data);

      // Update status to in_progress
      const newStatus = statusManager.updateChatStatus(chatId, {
        status: "in_progress",
        startedAt: Date.now(),
        mode,
        model,
      });

      // Broadcast status update
      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:status",
        data: newStatus,
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

        // Trigger message update hook
        await chatHooksManager.onMessageUpdate(
          Number(userMessageId),
          commit?.oid
        );
      }

      // Create assistant message for the response
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

      // Combine agent-specific tools with MCP tools
      const localChatTools =
        mode === "write" ? chatToolsWriteMode : chatToolsAskMode;
      const allTools = { ...localChatTools, ...this.mcpTools };

      // Start chat agent with abort signal and callbacks
      const result = await chatAgent(
        {
          model,
          messages: mapMessages(messages),
          mode: mode === "write" ? "write" : "ask",
          workingDir,
          tools: allTools,
          callbacks: {
            onStepFinish: async (stepResult) => {
              // Log step completion for debugging
              logger.debug(`Step completed for chat ${chatId}:`, {
                stepType: stepResult.stepType,
                toolCalls: stepResult.toolCalls?.length || 0,
              });

              // Update assistant message with current content and tool calls
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
              // Broadcast error to subscribers
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

      // Process the stream and broadcast chunks
      try {
        for await (const chunk of result.fullStream) {
          // Check if stream was aborted
          if (abortController.signal.aborted) {
            logger.info(
              `Stream for chat ${chatId} was aborted during processing`
            );
            break;
          }
          // Handle different chunk types
          if (chunk.type === "text-delta") {
            // Accumulate content for message updates
            accumulatedContent += chunk.textDelta;

            // Broadcast text chunks to subscribers
            subscriptionManager.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                assistantMessageId,
                chunk: chunk.textDelta,
                type: "text",
              },
            });
          } else if (chunk.type === "tool-call") {
            accumulatedContent = this.handleToolCall(
              chunk,
              toolCalls,
              accumulatedContent
            );

            subscriptionManager.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                assistantMessageId,
                chunk: JSON.stringify(chunk),
                type: "tool-call",
              },
            });
          } else if (chunk.type === "tool-result") {
            accumulatedContent = this.handleToolResult(
              chunk,
              toolCalls,
              accumulatedContent
            );

            subscriptionManager.broadcastToChat(chatId, {
              event: "chat:chunk",
              data: {
                chatId,
                assistantMessageId,
                chunk: JSON.stringify(chunk),
                type: "tool-result",
              },
            });
          }
        }
      } catch (streamError) {
        // Check if this was an abort error
        if (abortController.signal.aborted) {
          await this.handleCancellation(
            chatId,
            assistantMessageId,
            accumulatedContent,
            toolCalls
          );
          return;
        }

        // Re-throw other stream errors to be handled by outer catch
        throw streamError;
      }

      // Only broadcast completion if not aborted
      if (!abortController.signal.aborted) {
        // Broadcast completion event
        subscriptionManager.broadcastToChat(chatId, {
          event: "chat:complete",
          data: {
            chatId,
            assistantMessageId,
            usage: result.usage,
          },
        });

        // Update status to completed
        const completedStatus = statusManager.updateChatStatus(chatId, {
          status: "completed",
          completedAt: Date.now(),
        });

        this.updateStatusAndBroadcast(chatId, completedStatus);

        // Final update to assistant message with complete content and tool calls
        await this.updateAssistantMessage(
          assistantMessageId,
          accumulatedContent,
          toolCalls
        );

        // Trigger completion hook
        await chatHooksManager.onChatComplete(chatId, "", result.usage);
      }
    } catch (error) {
      // Check if this was a cancellation
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

      // Try to handle git commit even on error if in write mode
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

      // Add error information to content
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

      // Update status to error
      const errorStatus = statusManager.updateChatStatus(chatId, {
        status: "error",
        error: errorMessage,
        completedAt: Date.now(),
      });

      this.updateStatusAndBroadcast(chatId, errorStatus);

      // Final update to assistant message with accumulated content and tool calls even on error
      await this.updateAssistantMessage(
        assistantMessageId,
        accumulatedContent,
        toolCalls
      );

      // Trigger error hook
      await chatHooksManager.onChatError(chatId, errorMessage);
    } finally {
      // Clean up abort controller
      this.chatAbortControllers.delete(chatId);
    }
  }

  handleChatCancel(chatId: number): void {
    logger.info(`Cancelling chat ${chatId}`);

    // Get the abort controller for this chat
    const abortController = this.chatAbortControllers.get(chatId);
    if (abortController) {
      // Abort the ongoing stream
      abortController.abort();

      // The abort will be handled in the stream processing logic
      logger.debug(`Successfully signaled cancellation for chat ${chatId}`);
    } else {
      logger.warn(`No active stream found for chat ${chatId} to cancel`);

      // Still broadcast status update for UI consistency
      const idleStatus = statusManager.updateChatStatus(chatId, {
        status: "idle",
      });

      subscriptionManager.broadcastToChat(chatId, {
        event: "chat:status",
        data: idleStatus,
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
    // Cancel all ongoing chats
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
