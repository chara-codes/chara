"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import { format, isValid } from "date-fns"; // Added isValid import
import type { Chat } from "../../store/types";
import { TrashIcon } from "../atoms/icons";

interface ChatHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
}

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f9fafb;
  border-radius: 4px;
`;

const HistoryContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px; // Reduced from 16px
`;

const DateSection = styled.div`
  margin-bottom: 16px; // Reduced from 20px
`;

const DateHeader = styled.h3`
  font-size: 13px; // Reduced from 14px
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px; // Reduced from 12px
  padding-bottom: 6px; // Reduced from 8px
  border-bottom: 1px solid #e5e7eb;
`;

const ChatList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ChatItem = styled.li`
  margin-bottom: 6px; // Reduced from 8px
  border-radius: 6px; // Reduced from 8px
  background-color: white;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
`;

const ChatButton = styled.button`
  display: flex;
  flex-direction: column;
  width: calc(100% - 30px); /* Make room for delete button */
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background-color: #f9fafb;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px; // Reduced from 8px
`;

const ChatTitle = styled.h4`
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85%;
`;

const ChatTime = styled.span`
  font-size: 11px; // Reduced from 12px
  color: #6b7280;
`;

const ChatPreview = styled.p`
  font-size: 12px; // Reduced from 13px
  color: #4b5563;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MessageCount = styled.div`
  font-size: 11px; // Reduced from 12px
  color: #6b7280;
  margin-top: 4px; // Reduced from 8px
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
`;

const EmptyStateTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const EmptyStateText = styled.p`
  font-size: 14px;
  color: #6b7280;
  max-width: 300px;
  margin: 0 auto;
`;

const ChatItemContainer = styled.div`
  display: flex;
  align-items: stretch;
  position: relative;
  width: 100%;
`;

const DeleteButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;

  ${ChatItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #ef4444;
  }
`;

const DeleteConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DeleteConfirmationDialog = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DeleteConfirmationTitle = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 12px 0;
`;

const DeleteConfirmationText = styled.p`
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 16px 0;
`;

const DeleteConfirmationButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #e5e7eb;
  }
`;

const ConfirmButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background-color: #ef4444;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #dc2626;
  }
`;

// Helper function to group chats by date
const groupChatsByDate = (chats: Chat[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayChats: Chat[] = [];
  const yesterdayChats: Chat[] = [];
  const olderChats: Chat[] = [];

  for (const chat of chats) {
    // Ensure we have a valid date before processing
    const chatDate = new Date(chat.timestamp || Date.now());

    // Skip invalid dates
    if (!isValid(chatDate)) continue;

    chatDate.setHours(0, 0, 0, 0);

    if (chatDate.getTime() === today.getTime()) {
      todayChats.push(chat);
    } else if (chatDate.getTime() === yesterday.getTime()) {
      yesterdayChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  }

  return {
    today: todayChats,
    yesterday: yesterdayChats,
    older: olderChats,
  };
};

// Helper function to format chat time with error handling
const formatChatTime = (timestamp: string | number | Date) => {
  try {
    // Handle different timestamp formats
    const date =
      timestamp instanceof Date ? timestamp : new Date(timestamp || Date.now());

    // Check if the date is valid before formatting
    if (!isValid(date)) {
      return "Unknown time";
    }

    return format(date, "h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown time";
  }
};

// Helper function to get chat preview
const getChatPreview = (chat: Chat) => {
  if (chat.messages && chat.messages.length > 0) {
    const lastMessage = chat.messages[chat.messages.length - 1];
    let contentText = "";

    if (typeof lastMessage.content === "string") {
      contentText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      // Extract only the first text part (main message content)
      const firstTextPart = lastMessage.content.find(
        (part) => part.type === "text" && part.text,
      );
      contentText = firstTextPart?.text || "";
    }

    return (
      contentText.substring(0, 60) + (contentText.length > 60 ? "..." : "")
    );
  }
  return "No messages";
};

// Helper function to get chat title
const getChatTitle = (chat: Chat) => {
  if (chat.title) return chat.title;

  if (chat.messages && chat.messages.length > 0) {
    const firstUserMessage = chat.messages.find((m) => m.isUser);
    if (firstUserMessage) {
      let contentText = "";

      if (typeof firstUserMessage.content === "string") {
        contentText = firstUserMessage.content;
      } else if (Array.isArray(firstUserMessage.content)) {
        // Extract only the first text part (main message content)
        const firstTextPart = firstUserMessage.content.find(
          (part) => part.type === "text" && part.text,
        );
        contentText = firstTextPart?.text || "";
      }

      return (
        contentText.substring(0, 30) + (contentText.length > 30 ? "..." : "")
      );
    }
  }

  return "Untitled Chat";
};

const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  onSelectChat,
  onDeleteChat,
}) => {
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(
    null,
  );

  // Use chats directly since we no longer filter
  const filteredChats = chats;

  // Group chats by date
  const groupedChats = groupChatsByDate(filteredChats);

  // Handle delete chat
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    setPendingDeleteChatId(chatId);
  };

  const confirmDelete = () => {
    if (pendingDeleteChatId && onDeleteChat) {
      onDeleteChat(pendingDeleteChatId);
    }
    setPendingDeleteChatId(null);
  };

  const cancelDelete = () => {
    setPendingDeleteChatId(null);
  };

  return (
    <HistoryContainer>
      <HistoryContent>
        {filteredChats.length === 0 ? (
          <EmptyState>
            <EmptyStateTitle>No conversations found</EmptyStateTitle>
            <EmptyStateText>
              You haven't had any conversations yet. Start a new chat to begin.
            </EmptyStateText>
          </EmptyState>
        ) : (
          <>
            {groupedChats.today.length > 0 && (
              <DateSection>
                <DateHeader>Today</DateHeader>
                <ChatList>
                  {groupedChats.today.map((chat) => (
                    <ChatItem key={chat.id}>
                      <ChatItemContainer>
                        <ChatButton onClick={() => onSelectChat(chat.id)}>
                          <ChatHeader>
                            <ChatTitle>{getChatTitle(chat)}</ChatTitle>
                            <ChatTime>
                              {formatChatTime(chat.timestamp)}
                            </ChatTime>
                          </ChatHeader>
                          <ChatPreview>{getChatPreview(chat)}</ChatPreview>
                          <MessageCount>
                            {chat.messages
                              ? `${chat.messages.length} messages`
                              : "0 messages"}
                          </MessageCount>
                        </ChatButton>
                        <DeleteButton
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <TrashIcon width={14} height={14} />
                        </DeleteButton>
                      </ChatItemContainer>
                    </ChatItem>
                  ))}
                </ChatList>
              </DateSection>
            )}

            {groupedChats.yesterday.length > 0 && (
              <DateSection>
                <DateHeader>Yesterday</DateHeader>
                <ChatList>
                  {groupedChats.yesterday.map((chat) => (
                    <ChatItem key={chat.id}>
                      <ChatItemContainer>
                        <ChatButton onClick={() => onSelectChat(chat.id)}>
                          <ChatHeader>
                            <ChatTitle>{getChatTitle(chat)}</ChatTitle>
                            <ChatTime>
                              {formatChatTime(chat.timestamp)}
                            </ChatTime>
                          </ChatHeader>
                          <ChatPreview>{getChatPreview(chat)}</ChatPreview>
                          <MessageCount>
                            {chat.messages
                              ? `${chat.messages.length} messages`
                              : "0 messages"}
                          </MessageCount>
                        </ChatButton>
                        <DeleteButton
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <TrashIcon width={14} height={14} />
                        </DeleteButton>
                      </ChatItemContainer>
                    </ChatItem>
                  ))}
                </ChatList>
              </DateSection>
            )}

            {groupedChats.older.length > 0 && (
              <DateSection>
                <DateHeader>Previous</DateHeader>
                <ChatList>
                  {groupedChats.older.map((chat) => (
                    <ChatItem key={chat.id}>
                      <ChatItemContainer>
                        <ChatButton onClick={() => onSelectChat(chat.id)}>
                          <ChatHeader>
                            <ChatTitle>{getChatTitle(chat)}</ChatTitle>
                            <ChatTime>
                              {formatChatTime(chat.timestamp)}
                            </ChatTime>
                          </ChatHeader>
                          <ChatPreview>{getChatPreview(chat)}</ChatPreview>
                          <MessageCount>
                            {chat.messages
                              ? `${chat.messages.length} messages`
                              : "0 messages"}
                          </MessageCount>
                        </ChatButton>
                        <DeleteButton
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <TrashIcon width={14} height={14} />
                        </DeleteButton>
                      </ChatItemContainer>
                    </ChatItem>
                  ))}
                </ChatList>
              </DateSection>
            )}
          </>
        )}
      </HistoryContent>
      {pendingDeleteChatId && (
        <DeleteConfirmationOverlay onClick={cancelDelete}>
          <DeleteConfirmationDialog onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmationTitle>
              Delete Conversation
            </DeleteConfirmationTitle>
            <DeleteConfirmationText>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </DeleteConfirmationText>
            <DeleteConfirmationButtons>
              <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
              <ConfirmButton onClick={confirmDelete}>Delete</ConfirmButton>
            </DeleteConfirmationButtons>
          </DeleteConfirmationDialog>
        </DeleteConfirmationOverlay>
      )}
    </HistoryContainer>
  );
};

export default ChatHistory;
