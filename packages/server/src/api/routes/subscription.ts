import { tracked } from "@trpc/server";
import { on } from "events";
import { ee } from "../../utils/event-emitter";
import { publicProcedure } from "../trpc";
import { myLogger as logger } from "../../utils/logger";

setInterval(() => {
  ee.emit("server:ping", { test: Math.random(), timestamp: Date.now() });
}, 3000);

export const subscription = publicProcedure.subscription(
  async function* (opts) {
    // listen for new events
    for await (const [data] of on(ee, "server:ping", {
      // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
      signal: opts.signal,
    })) {
      yield tracked(Math.random(), data);
    }
  },
);
