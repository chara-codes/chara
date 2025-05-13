import { on } from "events";
import { ee } from "../../utils/event-emitter";
import { publicProcedure } from "../trpc";

export const subscription = publicProcedure.subscription(async function* (opts) {
  console.log("Subscription handler initialized");

  // Create an AbortController to manage cancellation
  const abortController = new AbortController();
  opts.signal?.addEventListener("abort", () => abortController.abort());

  // Helper function to create an event listener with the abort signal
  const createEventListener = (eventName: string) =>
    on(ee, eventName, { signal: abortController.signal });

  // Set up event listeners
  const eventListeners = {
    ping: createEventListener("server:ping"),
    instructions: createEventListener("instructions:execute"),
    results: createEventListener("instructions:results"),
    summary: createEventListener("instructions:summary"),
  };

  console.log("Event listeners initialized for all relevant events");

  try {
    // Loop until the subscription is canceled
    while (!abortController.signal.aborted) {
      // Wait for any event to occur
      const result = await Promise.race([
        eventListeners.ping.next().then((value) => ({ type: "server_ping", value })),
        eventListeners.instructions.next().then((value) => ({
          type: "instructions_execute",
          value,
        })),
        eventListeners.results.next().then((value) => ({
          type: "instructions_results",
          value,
        })),
        eventListeners.summary.next().then((value) => ({
          type: "instructions_summary",
          value,
        })),
      ]);

      // Process the received event
      if (!result?.value?.value) continue; // Skip if no valid data is received
      const [data] = result.value.value;

      switch (result.type) {
        case "server_ping":
          console.log("Ping event received:", data);
          yield { type: "server_ping", data };
          break;

        case "instructions_execute":
          console.log("Instructions event received, data:", data);
          yield { type: "instructions_execute", data };
          break;

        case "instructions_results":
          console.log("Instruction results received, data:", data);
          yield { type: "instructions_results", data };
          break;

        case "instructions_summary":
          console.log(`[SUBSCRIPTION] Summary stream event received (ID: ${data.summaryId})`);
          yield* handleSummaryStream(data, abortController.signal);
          break;

        default:
          console.warn("Unknown event type received:", result.type);
      }
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      console.log("Subscription aborted");
    } else {
      console.error("Error in subscription handler:", error);
      throw error;
    }
  }
});

/**
 * Handles the streaming of summary data.
 */
async function* handleSummaryStream(
  data: { summaryId: string; stream: AsyncIterable<string> },
  abortSignal: AbortSignal,
) {
  // Notify the client that the summary is starting
  yield {
    type: "instructions_summary_start",
    data: {
      summaryId: data.summaryId,
      timestamp: Date.now(),
    },
  };

  console.log(`[SUBSCRIPTION] Sent instructions_summary_start event for summary ${data.summaryId}`);

  let fullSummary = "";
  let chunkCount = 0;

  try {
    // Stream the summary chunks
    for await (const chunk of data.stream) {
      if (abortSignal.aborted) break;

      chunkCount++;
      fullSummary += chunk;

      console.log(
        `[SUBSCRIPTION] Streaming summary chunk ${chunkCount}: "${chunk.substring(0, 30)}${
          chunk.length > 30 ? "..." : ""
        }"`,
      );

      yield {
        type: "instructions_summary_chunk",
        data: {
          summaryId: data.summaryId,
          chunk,
          timestamp: Date.now(),
        },
      };
    }

    console.log(
      `[SUBSCRIPTION] Summary streaming complete. Sent ${chunkCount} chunks`,
    );
    console.log(`[SUBSCRIPTION] Full summary:\n${fullSummary}`);

    // Notify the client that the summary has ended
    yield {
      type: "instructions_summary_end",
      data: {
        summaryId: data.summaryId,
        timestamp: Date.now(),
      },
    };
    console.log(`[SUBSCRIPTION] Sent instructions_summary_end event for summary ${data.summaryId}`);
  } catch (error) {
    console.error("[SUBSCRIPTION] Error streaming summary:", error);
    yield {
      type: "instructions_summary_error",
      data: {
        summaryId: data.summaryId,
        error: (error as Error).message,
        timestamp: Date.now(),
      },
    };
    console.log(`[SUBSCRIPTION] Sent instructions_summary_error event for summary ${data.summaryId}`);
  }
}