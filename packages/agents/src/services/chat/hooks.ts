import { logger } from "../../utils/logger";
import type { ChatHooks, ChatSendEvent, ChatStatus } from "./types";

export class ChatHooksManager {
  private hooks: ChatHooks = {};

  registerHooks(hooks: Partial<ChatHooks>) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  async onChatStart(chatId: number, data: ChatSendEvent["data"]) {
    if (this.hooks.onChatStart) {
      try {
        await this.hooks.onChatStart(chatId, data);
      } catch (error) {
        logger.error(`Error in onChatStart hook for chat ${chatId}:`, error);
      }
    }
  }

  async onChatComplete(chatId: number, response: string, usage?: unknown) {
    if (this.hooks.onChatComplete) {
      try {
        await this.hooks.onChatComplete(chatId, response, usage);
      } catch (error) {
        logger.error(`Error in onChatComplete hook for chat ${chatId}:`, error);
      }
    }
  }

  async onChatError(chatId: number, error: string) {
    if (this.hooks.onChatError) {
      try {
        await this.hooks.onChatError(chatId, error);
      } catch (error) {
        logger.error(`Error in onChatError hook for chat ${chatId}:`, error);
      }
    }
  }

  async onChatCancel(chatId: number) {
    if (this.hooks.onChatCancel) {
      try {
        await this.hooks.onChatCancel(chatId);
      } catch (error) {
        logger.error(`Error in onChatCancel hook for chat ${chatId}:`, error);
      }
    }
  }

  async onStatusUpdate(status: ChatStatus) {
    if (this.hooks.onStatusUpdate) {
      try {
        await this.hooks.onStatusUpdate(status);
      } catch (error) {
        logger.error(
          `Error in onStatusUpdate hook for chat ${status.chatId}:`,
          error
        );
      }
    }
  }

  async onMessageUpdate(messageId: number, commit?: string) {
    if (this.hooks.onMessageUpdate) {
      try {
        await this.hooks.onMessageUpdate(messageId, commit);
      } catch (error) {
        logger.error(
          `Error in onMessageUpdate hook for message ${messageId}:`,
          error
        );
      }
    }
  }
}

export const chatHooksManager = new ChatHooksManager();
