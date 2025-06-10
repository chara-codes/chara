const getHistoryMessageContent = (msg: any): string => {
  if (msg.role !== "assistant") {
    return msg.message;
  }

  try {
    const parsed = JSON.parse(msg.message);
    return parsed.summary ?? "";
  } catch {
    return "";
  }
};

export const mapHistoryMessage = (msg: any) => {
  return {
    id: msg.id.toString(),
    content: getHistoryMessageContent(msg),
    role: msg.role,
    timestamp: new Date(msg.timestamp),
  };
};
