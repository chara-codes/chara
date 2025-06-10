import { useState, useEffect } from "react";
import { trpc, mapHistoryMessage } from "@/utils";
import { skipToken } from "@tanstack/react-query";
import { MESSAGE_HISTORY_PAGE_SIZE } from "@/constants";
import { useProject } from "@/contexts/project-context";

export function useChatHistory() {
  const { selectedProject } = useProject();
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isFetchingMoreHistory, setIsFetchingMoreHistory] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);

  const {
    data: historyData,
    refetch: refetchHistory,
  } = trpc.chat.getHistory.useQuery(
    selectedProject?.id
      ? {
          projectId: selectedProject.id,
          lastMessageId: oldestMessageId,
          limit: MESSAGE_HISTORY_PAGE_SIZE,
        }
      : skipToken,
    { enabled: false }
  );

  // Fetch history on init (when selectedProject changes)
  useEffect(() => {
    if (selectedProject?.id) {
      setOldestMessageId(null);
      setHistoryMessages([]);
      setHasMoreHistory(true);
      setIsFetchingMoreHistory(true);
      refetchHistory();
    }
  }, [selectedProject?.id]);

  // Append paginated history messages
  useEffect(() => {
    if (historyData?.history) {
      const mappedMessages = historyData.history.map(mapHistoryMessage);
      setHistoryMessages((prev) =>
        oldestMessageId ? [...mappedMessages, ...prev] : mappedMessages
      );
      setHasMoreHistory(historyData?.hasMore ?? false);
      setIsFetchingMoreHistory(false);
      if (mappedMessages.length > 0) {
        setOldestMessageId(mappedMessages[0].id);
      }
    }
  }, [historyData]);

  const fetchMoreHistory = async () => {
    if (!hasMoreHistory || isFetchingMoreHistory) {
      return;
    }
    setIsFetchingMoreHistory(true);
    await refetchHistory();
  };

  return {
    historyMessages,
    hasMoreHistory,
    isFetchingMoreHistory,
    fetchMoreHistory,
  };
}
