import { ProjectInformation } from "@/contexts/project-context";

export const useAIChat = <Input>(
  url: string,
  streamObject = true,
  project?: ProjectInformation | null,
) => {
  const stream = async (input: Input, signal: AbortSignal) => {
    input.project = project;
    const params: Record<string, string | number> = {
      batch: 1,
      input: JSON.stringify({ 0: input }),
    };

    const query = Object.keys(params)
      .map(
        (k) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`,
      )
      .join("&");

    const response = await fetch(
      `${url}/chat.${streamObject ? "streamObject" : "streamText"}?${query}`,
      {
        signal,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "trpc-accept": "application/jsonl",
          "transfer-encoding": "chunked",
        },
      },
    );

    return {
      async *[Symbol.asyncIterator]() {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield decoder.decode(value);
          }
        } finally {
          reader.releaseLock();
        }
      },
    };
  };
  return { stream };
};
