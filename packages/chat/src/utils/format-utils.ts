import type { Chat, Message } from '../types';

/**
 * Format a chat timestamp for display
 */
export function formatChatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return timestamp;
  }
}

/**
 * Get a preview of the chat content (first few characters of the first message)
 */
export function getChatPreview(chat: Chat, maxLength: number = 50): string {
  if (!chat.messages || chat.messages.length === 0) {
    return 'Empty chat';
  }
  
  const firstUserMessage = chat.messages.find(m => m.isUser);
  
  if (!firstUserMessage) {
    return 'No user messages';
  }
  
  const preview = firstUserMessage.content;
  
  if (preview.length <= maxLength) {
    return preview;
  }
  
  return `${preview.substring(0, maxLength)}...`;
}

/**
 * Sort chats by timestamp, most recent first
 */
export function sortChatsByDate(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA;
  });
}
