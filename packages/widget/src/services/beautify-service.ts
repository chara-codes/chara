import type { Message } from "../store/types";

/**
 * @deprecated This service is deprecated and kept for reference only.
 * The beautify functionality has been migrated to use the stream service
 * for real-time streaming responses. See chat-store.ts beautifyPrompt method
 * for the current implementation using processChatStream.
 */

export interface BeautifyRequest {
  currentPrompt: string;
  messageHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface BeautifyResponse {
  beautifiedText: string;
}

/**
 * @deprecated Use chat-store.ts beautifyPrompt method instead.
 * This function has been replaced with a stream-based implementation.
 */
export async function beautifyPrompt(
  currentPrompt: string,
  messages: Message[]
): Promise<string> {
  const agentBaseUrl =
    import.meta.env?.VITE_AGENTS_BASE_URL || "http://localhost:3031/";
  const apiUrl = `${agentBaseUrl}api/beautify`;

  const messageHistory = messages.map((message) => ({
    role: message.isUser ? ("user" as const) : ("assistant" as const),
    content: message.content,
  }));

  const payload: BeautifyRequest = {
    currentPrompt,
    messageHistory,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Beautify request failed: ${response.status} ${response.statusText}`);
    }

    const data: BeautifyResponse = await response.json();
    return data.beautifiedText;
  } catch (error) {
    console.error("Error beautifying prompt:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to beautify prompt"
    );
  }
}