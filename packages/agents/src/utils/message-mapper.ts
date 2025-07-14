import type { CoreMessage } from "ai";

export const mapMessages = (messages: CoreMessage[]): CoreMessage[] => {
  return messages
    .map((message) => {
      if (Array.isArray(message.content)) {
        return {
          ...message,
          content: message.content.map((item) => {
            if (item.type === "image") {
              return {
                type: "image" as const,
                image: (item as any).image,
                mimeType: item.mimeType,
              };
            } else if (item.type === "text") {
              return {
                type: "text",
                text: (item as any).text,
              };
            } else {
              return item;
            }
          }),
        };
      }
      return message;
    })
    .filter(Boolean);
};
