export const useStreamText = () => {
  const stream = async (input: string, signal: AbortSignal) => {
    const params: Record<string, string | number> = {
      batch: 1,
      input: JSON.stringify({ 0: { question: input } }),
    };

    const query = Object.keys(params)
      .map(
        (k) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`,
      )
      .join("&");

    const response = await fetch(
      `http://localhost:3030/trpc/messages.ask?${query}`,
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

            const text = decoder.decode(value);
            yield text;
          }
        } finally {
          reader.releaseLock();
        }
      },
    };
  };
  return { stream };
};
