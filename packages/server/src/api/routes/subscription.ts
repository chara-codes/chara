import { tracked } from "@trpc/server";
import { on } from "events";
import { ee } from "../../utils/event-emitter";
import { publicProcedure } from "../trpc";
import { myLogger } from "../../utils/logger";

export const subscription = publicProcedure.subscription(
  async function* (opts) {
    // listen for new events
    for await (const [data] of on(ee, "add", {
      // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
      signal: opts.signal,
    })) {
      myLogger.event(`New subscription data: ${JSON.stringify(data, null, 2)}`);
      yield tracked(data.test, data);
    }
  },
);
