import { appEvents } from "../events.js";
import type { ProcessData } from "./types.js";

/**
 * Stream output from a readable stream to events
 */
export async function streamOutput(
  processId: string,
  stream: ReadableStream<Uint8Array>,
  type: "stdout" | "stderr",
  processesMap: Map<string, ProcessData>
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const processData = processesMap.get(processId);

      if (processData && chunk) {
        appEvents.emit("runner:output", {
          processId,
          type,
          chunk,
          command: processData.info.command,
          cwd: processData.info.cwd,
        });
      }
    }
  } catch (error) {
    const processData = processesMap.get(processId);
    if (processData) {
      appEvents.emit("runner:error", {
        processId,
        error: String(error),
        serverInfo: {
          name: processData.info.name,
          command: processData.info.command,
          cwd: processData.info.cwd,
        },
      });
    }
  } finally {
    reader.releaseLock();
  }
}
