import spinners from "cli-spinners";
import colors from "picocolors";

export interface StreamChunk {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}

export interface LoggerOptions {
  showTimestamps?: boolean;
  showToolDetails?: boolean;
  compactMode?: boolean;
  indent?: string;
  useSpinners?: boolean;
  spinnerStyle?: keyof typeof spinners;
}

// State for tracking across chunks
let currentStep: string | null = null;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const toolCallBuffer: Map<string, any> = new Map();
let textBuffer = "";
let stepStartTime: number | null = null;
const activeSpinners: Map<string, NodeJS.Timeout> = new Map();

/**
 * Pretty log a single stream chunk with colors and developer-friendly formatting
 */
export function logStreamChunk(
  chunk: StreamChunk,
  options: LoggerOptions = {}
): void {
  const opts = {
    showTimestamps: false,
    showToolDetails: true,
    compactMode: false,
    indent: "  ",
    useSpinners: true,
    spinnerStyle: "dots" as keyof typeof spinners,
    ...options,
  };

  try {
    switch (chunk.type) {
      case "step-start":
        handleStepStart(chunk, opts);
        break;
      case "step-finish":
        handleStepFinish(chunk, opts);
        break;
      case "tool-call-streaming-start":
        handleToolCallStart(chunk, opts);
        break;
      case "tool-call-delta":
        handleToolCallDelta(chunk, opts);
        break;
      case "tool-call":
        handleToolCall(chunk, opts);
        break;
      case "tool-result":
        handleToolResult(chunk, opts);
        break;
      case 'text':
        handleTextDelta(chunk, opts);
        break;
      default:
        if (!opts.compactMode) {
          console.log(
            colors.gray(`${getPrefix(opts)}Unknown chunk type: ${chunk.type}`)
          );
        }
    }
  } catch (error) {
    console.error(colors.red(`Error processing chunk: ${error}`));
  }
}

/**
 * Process multiple chunks from a stream buffer
 */
export function logStreamBuffer(
  buffer: string,
  options: LoggerOptions = {}
): void {
  const lines = buffer.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    try {
      const chunk = JSON.parse(line);
      logStreamChunk(chunk, options);
    } catch (error) {
      // Skip invalid JSON lines
      if (line.trim() && !options.compactMode) {
        console.log(`${getPrefix(options)}Raw: ${line.slice(0, 100)}...`);
      }
    }
  }
}

/**
 * Flush any remaining text buffer
 */
export function flushTextBuffer(): void {
  // Stop all spinners before flushing
  stopAllSpinners();

  if (textBuffer.trim()) {
    console.log(); // Add newline after streamed text
    textBuffer = "";
  }
}

/**
 * Reset all state (useful between different streams)
 */
export function resetLoggerState(): void {
  currentStep = null;
  toolCallBuffer.clear();
  textBuffer = "";
  stepStartTime = null;
  // Clear any active spinners
  for (const interval of activeSpinners.values()) {
    clearInterval(interval);
  }
  activeSpinners.clear();
}

/**
 * Convenience function for logging a complete stream with cleanup
 */
export function logStream(buffer: string, options: LoggerOptions = {}): void {
  resetLoggerState();
  logStreamBuffer(buffer, options);
  flushTextBuffer();
}

function handleStepStart(chunk: StreamChunk, opts: LoggerOptions): void {
  currentStep = chunk.messageId || "unknown";
  stepStartTime = Date.now();

  const stepIcon = "🚀";
  const message = colors.cyan(`${stepIcon} Starting new step`);

  if (chunk.request?.body) {
    try {
      const body = JSON.parse(chunk.request.body);
      const model = body.model || "unknown";
      console.log(colors.bold(`\n${message} ${colors.dim(`[${model}]`)}`));

      if (body.messages?.length > 0) {
        const lastMessage = body.messages[body.messages.length - 1];
        if (lastMessage.content && typeof lastMessage.content === "string") {
          const preview = lastMessage.content.slice(0, 100);
          console.log(
            colors.dim(
              `${opts.indent}💭 ${preview}${
                lastMessage.content.length > 100 ? "..." : ""
              }`
            )
          );
        }
      }
    } catch {
      console.log(colors.bold(`\n${message}`));
    }
  } else {
    console.log(colors.bold(`\n${message}`));
  }
}

function handleStepFinish(chunk: StreamChunk, opts: LoggerOptions): void {
  const duration = stepStartTime ? Date.now() - stepStartTime : 0;
  const durationText = colors.dim(`(${duration}ms)`);

  let statusIcon = "✅";
  let statusColor = colors.green;

  if (chunk.finishReason === "tool-calls") {
    statusIcon = "🔧";
    statusColor = colors.blue;
  } else if (chunk.finishReason === "error") {
    statusIcon = "❌";
    statusColor = colors.red;
  }

  const message = `${statusIcon} Step completed ${durationText}`;
  console.log(statusColor(message));

  if (chunk.usage && opts.showToolDetails) {
    const { inputTokens, outputTokens, totalTokens } = chunk.usage;
    console.log(
      colors.dim(
        `${opts.indent}📊 Tokens: ${totalTokens} (${promptTokens} + ${completionTokens})`
      )
    );
  }

  currentStep = null;
  stepStartTime = null;
}

function handleToolCallStart(chunk: StreamChunk, opts: LoggerOptions): void {
  const toolName = chunk.toolName || "unknown";
  const toolIcon = getToolIcon(toolName);

  if (opts.useSpinners) {
    startSpinner(chunk.toolCallId, toolName, opts);
  } else {
    console.log(
      colors.yellow(
        `${opts.indent}${toolIcon} ${colors.bold(toolName)} ${colors.dim(
          "(streaming...)"
        )}`
      )
    );
  }

  // Initialize buffer for this tool call
  toolCallBuffer.set(chunk.toolCallId, {
    name: toolName,
    args: "",
    startTime: Date.now(),
  });
}

function handleToolCallDelta(chunk: StreamChunk, opts: LoggerOptions): void {
  const buffer = toolCallBuffer.get(chunk.toolCallId);
  if (buffer && chunk.argsTextDelta) {
    buffer.args += chunk.argsTextDelta;
  }
}

function handleToolCall(chunk: StreamChunk, opts: LoggerOptions): void {
  const toolName = chunk.toolName || "unknown";
  const toolIcon = getToolIcon(toolName);

  if (!toolCallBuffer.has(chunk.toolCallId)) {
    // Complete tool call without streaming
    console.log(
      colors.yellow(`${opts.indent}${toolIcon} ${colors.bold(toolName)}`)
    );

    if (opts.showToolDetails && chunk.args) {
      logToolArgs(toolName, chunk.args, opts);
    }
  }
}

function handleToolResult(chunk: StreamChunk, opts: LoggerOptions): void {
  const buffer = toolCallBuffer.get(chunk.toolCallId);
  const toolName = buffer?.name || "unknown";
  const toolIcon = getToolIcon(toolName);
  const duration = buffer ? Date.now() - buffer.startTime : 0;

  // Stop spinner if it was active
  if (opts.useSpinners) {
    stopSpinner(chunk.toolCallId);
  }

  // Show completed tool call with result
  console.log(
    colors.green(
      `${opts.indent}${toolIcon} ${colors.bold(toolName)} ${colors.dim(
        `✓ (${duration}ms)`
      )}`
    )
  );

  if (opts.showToolDetails) {
    // Show final args if available
    if (buffer?.args || chunk.args) {
      logToolArgs(toolName, buffer?.args || chunk.args, opts);
    }

    // Show result summary
    if (chunk.result) {
      logToolResult(toolName, chunk.result, opts);
    }
  }

  // Clean up buffer
  toolCallBuffer.delete(chunk.toolCallId);
}

function handleTextDelta(chunk: StreamChunk, opts: LoggerOptions): void {
  if (chunk.textDelta) {
    textBuffer += chunk.textDelta;

    // Stream text in real-time with a subtle prefix
    process.stdout.write(colors.dim(" ") + chunk.textDelta);

    // If we hit a natural break (newline or sentence end), add formatting
    if (chunk.textDelta.includes("\n")) {
      // Add prefix to new lines
      const lines = textBuffer.split("\n");
      if (lines.length > 1) {
        textBuffer = String(lines[lines.length - 1]); // Keep only the last incomplete line
      }
    }
  }
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function logToolArgs(toolName: string, args: any, opts: LoggerOptions): void {
  try {
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

    // Show key arguments based on tool type
    if (toolName === "read-file" && parsedArgs.path) {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}📄 Reading: ${colors.white(
            parsedArgs.path
          )}`
        )
      );
    } else if (toolName === "write-file" && parsedArgs.path) {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}✏️  Writing: ${colors.white(
            parsedArgs.path
          )}`
        )
      );
    } else if (toolName === "list-directory" && parsedArgs.path) {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}📁 Listing: ${colors.white(
            parsedArgs.path
          )}`
        )
      );
    } else if (toolName === "grep" && parsedArgs.pattern) {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}🔍 Searching: ${colors.white(
            parsedArgs.pattern
          )}`
        )
      );
    } else if (!opts.compactMode) {
      // Show truncated args for other tools
      const argsStr = JSON.stringify(parsedArgs, null, 0);
      const truncated =
        argsStr.length > 100 ? `${argsStr.slice(0, 100)}...` : argsStr;
      console.log(
        colors.dim(`${opts.indent}${opts.indent}⚙️  Args: ${truncated}`)
      );
    }
  } catch {
    // Skip if args can't be parsed
  }
}

function logToolResult(
  toolName: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  result: any,
  opts: LoggerOptions
): void {
  if (typeof result === "string") {
    const lines = result.split("\n").length;
    const chars = result.length;

    if (toolName === "read-file") {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}📋 Content: ${lines} lines, ${chars} chars`
        )
      );
    } else if (toolName === "write-file") {
      console.log(
        colors.dim(`${opts.indent}${opts.indent}💾 Saved successfully`)
      );
    } else if (result.length > 200) {
      console.log(
        colors.dim(`${opts.indent}${opts.indent}📤 Result: ${chars} chars`)
      );
    } else if (!opts.compactMode) {
      console.log(
        colors.dim(
          `${opts.indent}${opts.indent}📤 ${result.slice(0, 100)}${
            result.length > 100 ? "..." : ""
          }`
        )
      );
    }
  } else if (result && typeof result === "object") {
    if (result.status === "success") {
      console.log(colors.dim(`${opts.indent}${opts.indent}✅ Success`));
    } else if (!opts.compactMode) {
      console.log(colors.dim(`${opts.indent}${opts.indent}📦 Object result`));
    }
  }
}

function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    "read-file": "📖",
    "write-file": "✍️",
    "list-directory": "📂",
    "directory-tree": "🌳",
    grep: "🔍",
    "current-dir": "📍",
    "get-file-info": "ℹ️",
    thinking: "🤔",
    "read-multiple-files": "📚",
  };

  return icons[toolName] || "🔧";
}

function getPrefix(opts: LoggerOptions): string {
  const timestamp = opts.showTimestamps
    ? colors.dim(`[${new Date().toISOString()}] `)
    : "";

  return timestamp;
}

/**
 * Start a spinner for a tool call
 */
function startSpinner(
  toolCallId: string,
  toolName: string,
  opts: LoggerOptions
): void {
  const toolIcon = getToolIcon(toolName);
  const spinnerFrames = spinners[opts.spinnerStyle || "dots"].frames;
  let frameIndex = 0;

  // Clear any existing spinner for this tool call
  stopSpinner(toolCallId);

  const interval = setInterval(() => {
    const frame = spinnerFrames[frameIndex % spinnerFrames.length];
    const line = `${opts.indent}${colors.cyan(frame)} ${colors.bold(
      toolName
    )} ${colors.dim("(working...)")}`;

    // Clear the line and write the spinner
    process.stdout.write("\r\x1b[K"); // Clear current line
    process.stdout.write(line);

    frameIndex++;
  }, spinners[opts.spinnerStyle || "dots"].interval);

  activeSpinners.set(toolCallId, interval);
}

/**
 * Stop a spinner for a tool call
 */
function stopSpinner(toolCallId: string): void {
  const interval = activeSpinners.get(toolCallId);
  if (interval) {
    clearInterval(interval);
    activeSpinners.delete(toolCallId);

    // Clear the spinner line
    process.stdout.write("\r\x1b[K");
  }
}

/**
 * Stop all active spinners
 */
function stopAllSpinners(): void {
  activeSpinners.forEach((interval, toolCallId) => {
    clearInterval(interval);
  });
  activeSpinners.clear();
  // Clear any remaining spinner line
  process.stdout.write("\r\x1b[K");
}

/**
 * Demo function to test the logger with sample data
 */
export function demoLogger(options: LoggerOptions = {}): void {
  console.log(colors.bold(colors.blue("\n🎨 Pretty Stream Logger Demo\n")));

  // Simulate some stream chunks
  const sampleChunks: StreamChunk[] = [
    {
      type: "step-start",
      messageId: "msg-demo",
      request: {
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content: "Analyze this project and create a configuration file",
            },
          ],
        }),
      },
    },
    {
      type: "tool-call-streaming-start",
      toolCallId: "call-1",
      toolName: "read-file",
    },
    {
      type: "tool-call",
      toolCallId: "call-1",
      toolName: "read-file",
      args: { path: "package.json" },
    },
    {
      type: "tool-result",
      toolCallId: "call-1",
      result: '{\n  "name": "demo-project",\n  "version": "1.0.0"\n}',
    },
    {
      type: 'text',
      textDelta:
        "Based on the analysis, this appears to be a Node.js project...",
    },
    {
      type: "step-finish",
      finishReason: "tool-calls",
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    },
  ];

  resetLoggerState();

  for (const chunk of sampleChunks) {
    logStreamChunk(chunk, options);
    if (chunk.type !== 'text') {
      console.log(); // Add spacing between non-text chunks
    }
  }

  flushTextBuffer();
  console.log(colors.green("\n✨ Demo completed!\n"));
}

/**
 * Preset configurations for common use cases
 */
export const presets = {
  detailed: {
    showToolDetails: true,
    compactMode: false,
    showTimestamps: false,
    useSpinners: true,
    spinnerStyle: "dots" as keyof typeof spinners,
  } as LoggerOptions,

  compact: {
    showToolDetails: false,
    compactMode: true,
    showTimestamps: false,
    useSpinners: true,
    spinnerStyle: "line" as keyof typeof spinners,
  } as LoggerOptions,

  minimal: {
    showToolDetails: false,
    compactMode: true,
    showTimestamps: false,
    useSpinners: false,
  } as LoggerOptions,
};

/**
 * Quick logging with preset configurations
 */
export function logWithPreset(
  bufferOrChunk: string | StreamChunk,
  preset: keyof typeof presets = "detailed"
): void {
  const options = presets[preset];

  if (typeof bufferOrChunk === "string") {
    logStream(bufferOrChunk, options);
  } else {
    logStreamChunk(bufferOrChunk, options);
  }
}
