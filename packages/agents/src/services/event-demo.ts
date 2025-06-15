import { runnerService, requestStatus, requestRestart } from "./runner";
import { appEvents } from "./events";

// Simple demo showing event-based control
async function eventDemo() {
  console.log("🎛️ Event-Based Control Demo\n");

  // Set up event listeners to see responses
  appEvents.on("runner:status", (event) => {
    console.log(`📊 Status: ${event.serverInfo.name} is ${event.status}`);
    if (event.serverInfo.pid) {
      console.log(`   PID: ${event.serverInfo.pid}`);
    }
    if (event.serverInfo.serverUrl) {
      console.log(`   URL: ${event.serverInfo.serverUrl}`);
    }
  });

  appEvents.on("runner:restarted", (event) => {
    console.log(`🔄 Restarted: ${event.serverInfo.name}`);
    console.log(`   Old: ${event.oldCommand}`);
    console.log(`   New: ${event.newCommand}`);
  });

  appEvents.on("runner:error", (event) => {
    console.log(`❌ Error: ${event.error}`);
  });

  // Start a test server
  console.log("1. Starting a test server...");
  const serverId = await runnerService.start({
    command: "echo 'Test server running'"
  });

  // Wait for it to start
  await new Promise(resolve => setTimeout(resolve, 500));

  // Request status via event
  console.log("\n2. Requesting status via event...");
  requestStatus(serverId);

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 200));

  // Request restart with new command via event
  console.log("\n3. Requesting restart with new command via event...");
  requestRestart(serverId, "echo 'Updated test server'");

  // Wait for restart
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Request status of all servers
  console.log("\n4. Requesting status of all servers...");
  requestStatus(); // No processId = all servers

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 200));

  // Test error case
  console.log("\n5. Testing error case (non-existent server)...");
  requestRestart("invalid-id", "echo 'This will fail'");

  // Wait for error
  await new Promise(resolve => setTimeout(resolve, 200));

  // Cleanup
  console.log("\n6. Cleaning up...");
  await runnerService.stopAll();
  console.log("✅ Demo completed!");
}

// Run the demo
if (require.main === module) {
  eventDemo().catch(console.error);
}

export { eventDemo };
