import {
  createTRPCClient,
  createWSClient,
  wsLink,
  loggerLink,
} from "@trpc/client";
import type { AppRouter } from "../src";
// create persistent WebSocket connection
const wsClient = createWSClient({
  url: "ws://localhost:3030/events",
});
// configure TRPCClient to use WebSockets transport
const client = createTRPCClient<AppRouter>({
  links: [
    loggerLink(),
    wsLink({
      client: wsClient,
    }),
  ],
});

const res = client.events.subscribe(undefined, {
  onData(data) {
    console.log("Received data:", data);
  },
  onError(err) {
    console.error("Subscription error:", err);
  },
});
