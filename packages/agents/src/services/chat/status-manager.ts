import { logger } from "../../utils/logger";
import { chatHooksManager } from "./hooks";
import type { ChatStatus } from "./types";

export class StatusManager {
  // Map of chatId to current status
  private chatStatuses = new Map<number, ChatStatus>();
  private cleanupInterval: Timer;

  constructor() {
    // Clean up stale statuses every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleStatuses();
    }, 5 * 60 * 1000);
  }

  updateChatStatus(
    chatId: number,
    statusUpdate: Partial<ChatStatus>
  ): ChatStatus {
    const currentStatus = this.chatStatuses.get(chatId) || {
      chatId,
      status: "idle" as const,
    };

    const newStatus = { ...currentStatus, ...statusUpdate };
    this.chatStatuses.set(chatId, newStatus);

    // Trigger hook for status update
    chatHooksManager.onStatusUpdate(newStatus).catch((error) => {
      logger.error(
        `Failed to execute status update hook for chat ${chatId}:`,
        error
      );
    });

    return newStatus;
  }

  getChatStatus(chatId: number): ChatStatus | undefined {
    return this.chatStatuses.get(chatId);
  }

  getActiveChats(): number[] {
    return Array.from(this.chatStatuses.keys()).filter(
      (chatId) => this.chatStatuses.get(chatId)?.status === "in_progress"
    );
  }

  getAllChatStatuses(): Map<number, ChatStatus> {
    return new Map(this.chatStatuses);
  }

  isChatInProgress(chatId: number): boolean {
    const status = this.chatStatuses.get(chatId);
    return status?.status === "in_progress";
  }

  deleteChatStatus(chatId: number): boolean {
    return this.chatStatuses.delete(chatId);
  }

  private cleanupStaleStatuses(): void {
    const now = Date.now();
    const timeout = 2 * 60 * 60 * 1000; // 2 hours

    for (const [chatId, status] of this.chatStatuses) {
      const lastActivity = status.completedAt || status.startedAt || 0;
      if (now - lastActivity > timeout && status.status !== "in_progress") {
        this.chatStatuses.delete(chatId);
        logger.debug(`Cleaned up stale status for chat ${chatId}`);
      }
    }
  }

  getStatusCounts(): {
    idle: number;
    inProgress: number;
    completed: number;
    error: number;
  } {
    const counts = { idle: 0, inProgress: 0, completed: 0, error: 0 };

    for (const status of this.chatStatuses.values()) {
      switch (status.status) {
        case "idle":
          counts.idle++;
          break;
        case "in_progress":
          counts.inProgress++;
          break;
        case "completed":
          counts.completed++;
          break;
        case "error":
          counts.error++;
          break;
      }
    }

    return counts;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.chatStatuses.clear();
  }

  clear(): void {
    this.chatStatuses.clear();
  }
}

export const statusManager = new StatusManager();
