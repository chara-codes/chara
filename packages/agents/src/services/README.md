# Services

This directory contains service modules for the Chara agents package.

## Runner Service

The Runner Service provides process management capabilities for running development servers and other long-running processes with real-time output streaming.

### Features

- **Simplified API**: Just provide a command string - everything else is auto-detected
- **Smart Process Names**: Automatically detects process type (npm-dev-server, next-dev-server, etc.)
- **URL Auto-Detection**: Extracts server URLs from process output automatically
- **Environment Auto-Detection**: Uses current working directory and environment
- **Real-time Streaming**: Stream stdout/stderr output through events
- **Server Information**: Track detailed server metadata (PID, uptime, status, etc.)
- **Interactive Input**: Send input to running processes
- **Event System**: Dedicated event types for process lifecycle
- **Graceful Shutdown**: Stop individual processes or all processes at once

### Quick Start

```typescript
import { runnerService, startNpmDev } from './runner';
import { appEvents } from './events';

// Listen to runner events
appEvents.on('runner:started', (event) => {
  console.log(`Started: ${event.serverInfo.name}`);
  if (event.serverInfo.serverUrl) {
    console.log(`URL: ${event.serverInfo.serverUrl}`);
  }
});

appEvents.on('runner:output', (event) => {
  console.log(`[${event.type}] ${event.chunk}`);
});

// Start a development server (auto-detects everything)
const processId = await runnerService.start({ command: 'npm run dev' });

// Or use convenience functions
const processId2 = await startNpmDev('/path/to/project');

// Get server information (including auto-detected URL)
const serverInfo = runnerService.getServerInfo(processId);
console.log(`Server: ${serverInfo?.name} on PID: ${serverInfo?.pid}`);
if (serverInfo?.serverUrl) {
  console.log(`Auto-detected URL: ${serverInfo.serverUrl}`);
}

// Stop the server
await runnerService.stop(processId);
```

### API Reference

#### RunnerService Class

**Methods:**
- `start(options: RunnerOptions): Promise<string>` - Start a new process with auto-detection
- `stop(processId: string): Promise<boolean>` - Stop a running process
- `restart(processId: string, newCommand?: string): Promise<boolean>` - Restart a process with same or new command
- `updateProcessInfo(processId: string, updates: Partial<Pick<ServerInfo, "name" | "serverUrl">>): boolean` - Update process info
- `getServerInfo(processId: string): ServerInfo | null` - Get process information
- `getAllProcesses(): Array<{id: string, info: ServerInfo}>` - Get all running processes
- `sendInput(processId: string, input: string): Promise<boolean>` - Send input to process
- `isRunning(processId: string): boolean` - Check if process is running
- `stopAll(): Promise<void>` - Stop all running processes

**Event-Based Control:**
- `requestStatus(processId?: string): void` - Request status via events (specific process or all)
- `requestRestart(processId: string, newCommand?: string): void` - Request restart via events

#### Interfaces

```typescript
interface RunnerOptions {
  command: string; // Full command with arguments, e.g. "npm run dev"
}

interface ServerInfo {
  serverUrl?: string;
  name: string;
  status: "starting" | "active" | "stopped" | "error";
  os: string;
  shell: string;
  cwd: string;
  command: string;
  pid?: number;
  startTime?: Date;
  uptime?: number;
}
```

#### Events

The runner service emits the following events:

- `runner:started` - Process successfully started
- `runner:stopped` - Process exited
- `runner:restarted` - Process restarted (with old and new commands)
- `runner:info-updated` - Process info updated
- `runner:output` - Real-time stdout/stderr output
- `runner:error` - Error occurred
- `runner:status` - Process status changed

**Event-Based Control Events:**
- `get-status` - Request server status (listen to this to trigger status responses)
- `restart` - Request server restart (listen to this to trigger restarts)

#### Convenience Functions

- `startNpmDev(cwd?: string): Promise<string>` - Start `npm run dev` in specified directory
- `startBunDev(cwd?: string): Promise<string>` - Start `bun run dev` in specified directory
- `startYarnDev(cwd?: string): Promise<string>` - Start `yarn dev` in specified directory
- `startPnpmDev(cwd?: string): Promise<string>` - Start `pnpm dev` in specified directory
- `startNextDev(cwd?: string): Promise<string>` - Start `next dev` in specified directory
- `startViteDev(cwd?: string, port?: number): Promise<string>` - Start `vite` in specified directory with optional port
- `startServe(directory?: string, port?: number): Promise<string>` - Start `npx serve` for static files in specified directory with optional port
- `startDevelopmentServer(command: string): Promise<string>` - Start any development server

### Examples

#### Multiple Servers with Auto-Detection

```typescript
const commands = [
  "npm run dev",     // Auto-detects as "npm-dev-server"
  "bun run dev",     // Auto-detects as "bun-dev-server"
  "next dev",        // Auto-detects as "next-dev-server"
  "vite --port 3000", // Auto-detects as "vite-dev-server"
  "npx serve dist"   // Auto-detects as "serve-static-server"
];

for (const command of commands) {
  const processId = await runnerService.start({ command });
  
  // Server info will be auto-populated
  const info = runnerService.getServerInfo(processId);
  console.log(`Started ${info?.name} with ID: ${processId}`);
  
  // URL will be auto-detected from output
  setTimeout(() => {
    const updatedInfo = runnerService.getServerInfo(processId);
    if (updatedInfo?.serverUrl) {
      console.log(`Auto-detected URL: ${updatedInfo.serverUrl}`);
    }
  }, 2000);
}
```

#### Interactive Process

```typescript
const processId = await runnerService.start({
  command: "node -i", // Auto-detects as "node-process"
});

// Send commands to the REPL
await runnerService.sendInput(processId, "console.log('Hello!');\n");
await runnerService.sendInput(processId, "process.version\n");
```

#### Static File Serving

```typescript
// Serve current directory on default port
const serveId = await startServe();

// Serve specific directory
const distId = await startServe("dist");

// Serve with custom port
const customId = await startServe("build", 8080);

// Using the full command
const manualId = await runnerService.start({
  command: "npx serve docs --port 3001" // Auto-detects as "serve-static-server"
});
```

#### Restart and Update Process Info

```typescript
// Restart with same command
const restarted = await runnerService.restart(processId);

// Restart with new command
const restartedWithNew = await runnerService.restart(processId, "bun run dev");

// Update process name
runnerService.updateProcessInfo(processId, { name: "my-custom-server" });

// Update server URL
runnerService.updateProcessInfo(processId, { serverUrl: "http://localhost:3000" });

// Update both name and URL
runnerService.updateProcessInfo(processId, { 
  name: "my-awesome-app", 
  serverUrl: "https://localhost:3000" 
});
```

#### Event Monitoring

```typescript
appEvents.on('runner:started', ({ processId, serverInfo }) => {
  console.log(`🚀 ${serverInfo.name} started (PID: ${serverInfo.pid})`);
});

appEvents.on('runner:stopped', ({ processId, exitCode, serverInfo }) => {
  console.log(`🛑 ${serverInfo.name} stopped (exit: ${exitCode})`);
});

appEvents.on('runner:restarted', ({ processId, oldCommand, newCommand, serverInfo }) => {
  console.log(`🔄 ${serverInfo.name} restarted`);
  console.log(`   Old: ${oldCommand}`);
  console.log(`   New: ${newCommand}`);
});

appEvents.on('runner:info-updated', ({ processId, updates, serverInfo }) => {
  console.log(`📝 ${serverInfo.name} info updated:`, updates);
});

appEvents.on('runner:output', ({ processId, type, chunk }) => {
  const prefix = type === 'stderr' ? '❌' : '📝';
  console.log(`${prefix} ${chunk.trim()}`);
});
```

#### Event-Based Control

```typescript
import { requestStatus, requestRestart } from './runner';

// Request status of specific process
requestStatus(processId);

// Request status of all processes  
requestStatus();

// Request restart with same command
requestRestart(processId);

// Request restart with new command
requestRestart(processId, "npm run dev --port 3001");

// Listen for status responses
appEvents.on('runner:status', ({ processId, status, serverInfo }) => {
  console.log(`📊 ${serverInfo.name}: ${status}`);
  if (serverInfo.serverUrl) {
    console.log(`🌐 URL: ${serverInfo.serverUrl}`);
  }
});

// Listen for restart responses
appEvents.on('runner:restarted', ({ processId, oldCommand, newCommand }) => {
  console.log(`🔄 Process restarted:`);
  console.log(`   Old: ${oldCommand}`);
  console.log(`   New: ${newCommand}`);
});
```

#### Remote Control System

```typescript
// Create a remote control system
const controlPanel = {
  servers: new Map(),

  async addServer(name: string, command: string) {
    const processId = await runnerService.start({ command });
    this.servers.set(processId, { name, command });
    return processId;
  },

  checkStatus(processId?: string) {
    requestStatus(processId);
  },

  restartServer(processId: string, newCommand?: string) {
    requestRestart(processId, newCommand);
  }
};

// Add servers
const frontend = await controlPanel.addServer("Frontend", "npm run dev");
const backend = await controlPanel.addServer("Backend", "bun run dev");

// Check all server status
controlPanel.checkStatus();

// Restart with new command
controlPanel.restartServer(backend, "bun run dev --port 4000");
```

### Testing

The runner service includes comprehensive tests covering:
- Basic functionality and API
- Real process integration
- Event system validation
- Error handling
- Interface compliance

Run tests with:
```bash
bun test src/services/__tests__/runner.test.ts
```

## Events Service

The Events Service provides a typed event emitter for inter-service communication.

### Features

- **Type Safety**: Strongly typed event interfaces
- **Event Overloading**: Override all EventEmitter methods with proper typing
- **Extensible**: Easy to add new event types

### Usage

```typescript
import { appEvents } from './events';

// Listen to events
appEvents.on('runner:started', (data) => {
  // data is properly typed
  console.log(data.serverInfo.name);
});

// Emit events
appEvents.emit('runner:output', {
  processId: 'abc123',
  type: 'stdout',
  chunk: 'Hello World\n',
  command: 'echo hello',
  cwd: '/tmp',
});
```
