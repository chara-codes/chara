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

console.log("Subscribing to events...");

const res = client.events.subscribe(undefined, {
  onData(data) {
    console.log("Received event data:", data);

    // Handle different event types
    if (data.type === "server_ping") {
      console.log("Server ping received:", data.data);
    } else if (data.type === "instructions_execute") {
      console.log("Instructions execute event received:", data.data);
      // Here you can process the instructions
    }
  },
  onError(err) {
    console.error("Subscription error:", err);
  },
});

// Keep the process running
process.on("SIGINT", () => {
  console.log("Closing WebSocket connection...");
  wsClient.close();
  process.exit(0);
});

console.log("Subscription client running. Press Ctrl+C to exit.");
