#!/usr/bin/env bun
import { startUI } from "./index.js";

/**
 * Integration example showing how to use the CLI UI with the main Chara application
 * This demonstrates real-world usage patterns and state management
 */

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ServerStatus {
  status: "running" | "stopped" | "error";
  port?: number;
  url?: string;
  uptime?: string;
  version?: string;
}

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: Date;
  source?: string;
}

class CharaCLIManager {
  private ui: any;
  private currentSession: ChatSession | null = null;
  private sessions: ChatSession[] = [];
  private serverStatus: ServerStatus = { status: "stopped" };
  private logs: LogEntry[] = [];
  private isProcessing = false;

  constructor(
    private currentFolder: string = process.cwd(),
    private currentModel: string = "gpt-4-turbo"
  ) {}

  /**
   * Start the CLI UI
   */
  public start(): void {
    console.log("🚀 Starting Chara CLI...");

    this.initializeServer();
    this.startUI();
    this.setupEventHandlers();

    console.log("✅ Chara CLI started successfully!");
    console.log(`📁 Working directory: ${this.currentFolder}`);
    console.log(`🤖 AI Model: ${this.currentModel}`);
  }

  /**
   * Stop the CLI UI and cleanup
   */
  public stop(): void {
    console.log("🛑 Shutting down Chara CLI...");

    if (this.ui) {
      this.ui.unmount();
    }

    this.stopServer();
    console.log("✅ Chara CLI stopped successfully!");
  }

  /**
   * Initialize the UI components
   */
  private startUI(): void {
    this.ui = startUI({
      onMessageSubmit: this.handleUserMessage.bind(this),
      onChatSelect: this.handleChatSelect.bind(this),
      isLoading: this.isProcessing,
      currentFolder: this.currentFolder,
      currentModel: this.currentModel,
    });
  }

  /**
   * Handle user message submission
   */
  private async handleUserMessage(message: string): Promise<void> {
    if (!message.trim()) return;

    this.addLog("info", `User message received: "${message}"`, "ui");

    // Create new session if none exists
    if (!this.currentSession) {
      this.currentSession = this.createNewSession(message);
      this.sessions.push(this.currentSession);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    this.currentSession.messages.push(userMessage);
    this.updateUI({ isLoading: true });

    try {
      // Simulate AI processing
      const response = await this.processWithAI(message);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        content: response,
        sender: "assistant",
        timestamp: new Date(),
      };

      this.currentSession.messages.push(assistantMessage);
      this.currentSession.updatedAt = new Date();

      this.addLog("info", "AI response generated successfully", "ai");

    } catch (error) {
      this.addLog("error", `AI processing failed: ${error}`, "ai");

      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };

      this.currentSession.messages.push(errorMessage);
    } finally {
      this.updateUI({ isLoading: false });
    }
  }

  /**
   * Handle chat session selection
   */
  private handleChatSelect(chatId: string): void {
    const session = this.sessions.find(s => s.id === chatId);

    if (session) {
      this.currentSession = session;
      this.addLog("info", `Switched to chat: ${session.title}`, "ui");
      this.updateUI();
    } else {
      this.addLog("warn", `Chat not found: ${chatId}`, "ui");
    }
  }

  /**
   * Create a new chat session
   */
  private createNewSession(firstMessage: string): ChatSession {
    const title = firstMessage.length > 30
      ? firstMessage.substring(0, 30) + "..."
      : firstMessage;

    return {
      id: `chat_${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Process message with AI (simulated)
   */
  private async processWithAI(message: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate different types of responses
    const responses = [
      "I understand your request. Let me help you with that.",
      "That's a great question! Here's what I think...",
      "I can definitely assist you with this. Let me break it down:",
      "Based on your message, I recommend the following approach:",
      "Let me analyze this and provide you with a detailed response.",
    ];

    // Simulate potential errors
    if (Math.random() < 0.1) {
      throw new Error("Simulated AI processing error");
    }

    return responses[Math.floor(Math.random() * responses.length)] +
           " This is a simulated response for demonstration purposes.";
  }

  /**
   * Initialize mock server
   */
  private initializeServer(): void {
    this.serverStatus = {
      status: "running",
      port: 3000,
      url: "http://localhost:3000",
      uptime: "0m",
      version: "1.0.0",
    };

    this.addLog("info", "Development server started", "server");

    // Simulate server uptime updates
    setInterval(() => {
      if (this.serverStatus.status === "running") {
        const uptimeMinutes = Math.floor(Date.now() / 60000) % 60;
        this.serverStatus.uptime = `${uptimeMinutes}m`;
      }
    }, 60000);
  }

  /**
   * Stop the server
   */
  private stopServer(): void {
    this.serverStatus.status = "stopped";
    this.addLog("info", "Development server stopped", "server");
  }

  /**
   * Add a log entry
   */
  private addLog(
    level: LogEntry["level"],
    message: string,
    source?: string
  ): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}`,
      level,
      message,
      timestamp: new Date(),
      source,
    };

    this.logs.push(logEntry);

    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  /**
   * Update UI with current state
   */
  private updateUI(overrides: Partial<any> = {}): void {
    if (this.ui) {
      this.ui.rerender({
        onMessageSubmit: this.handleUserMessage.bind(this),
        onChatSelect: this.handleChatSelect.bind(this),
        isLoading: this.isProcessing,
        currentFolder: this.currentFolder,
        currentModel: this.currentModel,
        ...overrides,
      });
    }
  }

  /**
   * Setup event handlers for graceful shutdown
   */
  private setupEventHandlers(): void {
    const shutdown = () => {
      this.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("SIGUSR2", shutdown); // For nodemon

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      this.addLog("error", `Uncaught exception: ${error.message}`, "system");
      console.error("Uncaught Exception:", error);
      this.stop();
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      this.addLog("error", `Unhandled rejection: ${reason}`, "system");
      console.error("Unhandled Rejection:", reason);
    });
  }

  /**
   * Get current session data
   */
  public getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): ChatSession[] {
    return this.sessions;
  }

  /**
   * Get server status
   */
  public getServerStatus(): ServerStatus {
    return this.serverStatus;
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(limit: number = 50): LogEntry[] {
    return this.logs.slice(-limit);
  }
}

/**
 * Factory function to create and start the CLI
 */
export function createCharaCLI(options: {
  folder?: string;
  model?: string;
} = {}): CharaCLIManager {
  const cli = new CharaCLIManager(
    options.folder || process.cwd(),
    options.model || "gpt-4-turbo"
  );

  return cli;
}

/**
 * Main entry point for the CLI
 */
export async function startCharaCLI(options: {
  folder?: string;
  model?: string;
} = {}): Promise<void> {
  const cli = createCharaCLI(options);

  try {
    cli.start();

    // Keep the process running
    await new Promise(() => {}); // Never resolves

  } catch (error) {
    console.error("❌ Failed to start Chara CLI:", error);
    cli.stop();
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  const args = process.argv.slice(2);
  const folder = args.find(arg => arg.startsWith("--folder="))?.split("=")[1];
  const model = args.find(arg => arg.startsWith("--model="))?.split("=")[1];

  startCharaCLI({ folder, model }).catch(console.error);
}

export default CharaCLIManager;
