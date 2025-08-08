import type { ServerWebSocket } from "bun";
import { logger } from "../../utils/logger";
import type { ChatEvent, ChatSubscription } from "./types";

export class SubscriptionManager {
  // Map of chatId to list of subscribed WebSocket connections
  private chatSubscriptions = new Map<number, ChatSubscription[]>();
  // Map of WebSocket to subscribed chatIds for cleanup
  private clientSubscriptions = new Map<
    ServerWebSocket<unknown>,
    Set<number>
  >();

  subscribeToChat(chatId: number, ws: ServerWebSocket<unknown>): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: ChatSubscription = {
      ws,
      subscriptionId,
      subscribedAt: Date.now(),
    };

    // Add to chat subscriptions
    if (!this.chatSubscriptions.has(chatId)) {
      this.chatSubscriptions.set(chatId, []);
    }
    const chatSubs = this.chatSubscriptions.get(chatId);
    if (chatSubs) {
      chatSubs.push(subscription);
    }

    // Track client subscriptions for cleanup
    if (!this.clientSubscriptions.has(ws)) {
      this.clientSubscriptions.set(ws, new Set());
    }
    const clientSubs = this.clientSubscriptions.get(ws);
    if (clientSubs) {
      clientSubs.add(chatId);
    }

    logger.debug(
      `Client subscribed to chat ${chatId}. Total subscribers: ${
        this.chatSubscriptions.get(chatId)?.length || 0
      }`
    );

    return subscriptionId;
  }

  unsubscribeFromChat(chatId: number, ws: ServerWebSocket<unknown>): boolean {
    const subscriptions = this.chatSubscriptions.get(chatId);
    if (subscriptions) {
      const updatedSubscriptions = subscriptions.filter((sub) => sub.ws !== ws);

      if (updatedSubscriptions.length === 0) {
        this.chatSubscriptions.delete(chatId);
        logger.debug(
          `No more subscribers for chat ${chatId}, removed subscription list`
        );
      } else {
        this.chatSubscriptions.set(chatId, updatedSubscriptions);
        logger.debug(
          `Client unsubscribed from chat ${chatId}. Remaining subscribers: ${updatedSubscriptions.length}`
        );
      }
    }

    // Remove from client subscriptions
    const clientSubs = this.clientSubscriptions.get(ws);
    if (clientSubs) {
      const removed = clientSubs.delete(chatId);
      if (clientSubs.size === 0) {
        this.clientSubscriptions.delete(ws);
      }
      return removed;
    }

    return false;
  }

  unsubscribeFromAllChats(ws: ServerWebSocket<unknown>): number {
    const subscribedChats = this.clientSubscriptions.get(ws);
    if (subscribedChats) {
      const chatCount = subscribedChats.size;
      // Unsubscribe from each chat individually
      for (const chatId of subscribedChats) {
        this.unsubscribeFromChat(chatId, ws);
      }
      logger.debug(`Client unsubscribed from all ${chatCount} chats`);
      return chatCount;
    } else {
      logger.debug(`Client had no active chat subscriptions to remove`);
      return 0;
    }
  }

  cleanupClientSubscriptions(ws: ServerWebSocket<unknown>): void {
    const subscribedChats = this.clientSubscriptions.get(ws);
    if (subscribedChats) {
      // Unsubscribe from all chats
      for (const chatId of subscribedChats) {
        this.unsubscribeFromChat(chatId, ws);
      }
      this.clientSubscriptions.delete(ws);
      logger.debug(`Cleaned up subscriptions for disconnected client`);
    }
  }

  sendToClient(ws: ServerWebSocket<unknown>, event: ChatEvent): boolean {
    try {
      ws.send(JSON.stringify(event));
      return true;
    } catch (error) {
      logger.error(`Failed to send WebSocket event to client:`, error);
      // Clean up this client's subscriptions
      this.cleanupClientSubscriptions(ws);
      return false;
    }
  }

  broadcastToChat(chatId: number, event: ChatEvent): number {
    const subscriptions = this.chatSubscriptions.get(chatId);
    if (!subscriptions || subscriptions.length === 0) {
      return 0;
    }

    const message = JSON.stringify(event);
    const disconnectedClients: ServerWebSocket<unknown>[] = [];
    let successCount = 0;

    for (const subscription of subscriptions) {
      try {
        subscription.ws.send(message);
        successCount++;
      } catch (error) {
        logger.error(
          `Failed to broadcast to subscriber of chat ${chatId}:`,
          error
        );
        disconnectedClients.push(subscription.ws);
      }
    }

    // Clean up disconnected clients
    for (const ws of disconnectedClients) {
      this.unsubscribeFromChat(chatId, ws);
    }

    return successCount;
  }

  getSubscriberCount(chatId: number): number {
    return this.chatSubscriptions.get(chatId)?.length || 0;
  }

  getClientSubscriptions(ws: ServerWebSocket<unknown>): number[] {
    const subscribedChats = this.clientSubscriptions.get(ws);
    return subscribedChats ? Array.from(subscribedChats) : [];
  }

  getAllSubscribedChats(): number[] {
    return Array.from(this.chatSubscriptions.keys());
  }

  hasSubscribers(chatId: number): boolean {
    return this.getSubscriberCount(chatId) > 0;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clear(): void {
    this.chatSubscriptions.clear();
    this.clientSubscriptions.clear();
  }
}

export const subscriptionManager = new SubscriptionManager();
