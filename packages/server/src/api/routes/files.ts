import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import chokidar from "chokidar";
import { router, publicProcedure } from "../trpc";
import { resolveProjectPath } from "../../utils/project-path";
import { myLogger } from "../../utils/logger";
import { ee } from "../../utils/event-emitter";
import { on } from "events";

interface FileSystemEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileSystemEntry[]; // Only present for directories
}

// Utility to fetch directory contents
async function getProjectContents(
  projectName?: string,
  currentPath = "",
): Promise<FileSystemEntry[]> {
  if (!projectName) return [];

  const projectLocation = path.join(
    resolveProjectPath(projectName),
    currentPath,
  );
  const entries = await fs.readdir(projectLocation, { withFileTypes: true });

  const contents: FileSystemEntry[] = await Promise.all(
    entries.map(async (entry): Promise<FileSystemEntry> => {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        // Fetch contents recursively for directories
        return {
          name: entry.name,
          path: entryPath,
          type: "directory",
          children: await getProjectContents(projectName, entryPath),
        };
      } else {
        // Handle files
        return {
          name: entry.name,
          path: entryPath,
          type: "file",
        };
      }
    }),
  );

  return contents;
}

export const filesRouter = router({
  getProjectContents: publicProcedure
    .input(
      z.object({
        projectName: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const contents = await getProjectContents(input.projectName);
      return contents;
    }),
  getFileContent: publicProcedure
    .input(
      z.object({
        relativePath: z.string().min(1),
        projectName: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { relativePath, projectName } = input;
      const fileLocation = path.join(
        resolveProjectPath(projectName),
        relativePath,
      );
      myLogger.info("Fetching file contents for fileLocation", fileLocation);
      const content = await fs.readFile(fileLocation, "utf-8");
      return content;
    }),
  watchFileChanges: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      }),
    )
    .subscription(async function* ({ input, signal }) {
      const projectPath = resolveProjectPath(input.projectName);

      // Create an AbortController to manage cancellation
      const abortController = new AbortController();
      signal?.addEventListener("abort", () => abortController.abort());

      // Helper function to create an event listener with the abort signal
      const createEventListener = (eventName: string) =>
        on(ee, eventName, { signal: abortController.signal });

      // Set up chokidar file watcher
      const watcher = chokidar.watch(projectPath, {
        ignoreInitial: true, // Ignore already existing files
      });

      // Emit events to the TypedEventEmitter
      watcher.on("add", (filePath) => {
        const relativePath = path.relative(projectPath, filePath);
        ee.emit("file:change", {
          type: "add",
          projectName: input.projectName,
          relativePath,
        });
        myLogger.info(`File added: ${relativePath}`);
      });
      watcher.on("change", (filePath) => {
        const relativePath = path.relative(projectPath, filePath);
        ee.emit("file:change", {
          type: "change",
          projectName: input.projectName,
          relativePath,
        });
        myLogger.info(`File changed: ${relativePath}`);
      });
      watcher.on("unlink", (filePath) => {
        const relativePath = path.relative(projectPath, filePath);
        ee.emit("file:change", {
          type: "unlink",
          projectName: input.projectName,
          relativePath,
        });
        myLogger.warn(`File deleted: ${relativePath}`);
      });
      watcher.on("error", (error) => {
        ee.emit("file:error", {
          projectName: input.projectName,
          error: error.message,
        });
        myLogger.error(
          `Watcher error for project ${input.projectName}: ${error.message}`,
        );
      });

      // Create event listeners for file events
      const eventListeners = {
        fileChange: createEventListener("file:change"),
        fileError: createEventListener("file:error"),
      };

      console.log("File watcher initialized for project:", input.projectName);

      try {
        // Loop until the subscription is canceled
        while (!abortController.signal.aborted) {
          // Wait for any event to occur
          const result = await Promise.race([
            eventListeners.fileChange.next().then((value) => ({
              type: "file_change",
              value,
            })),
            eventListeners.fileError.next().then((value) => ({
              type: "file_error",
              value,
            })),
          ]);

          // Process the received event
          if (!result?.value?.value) continue; // Skip if no valid data is received
          const [data] = result.value.value;

          switch (result.type) {
            case "file_change":
              console.log(`File change event received:`, data);
              yield { type: "file_change", data };
              break;

            case "file_error":
              console.error("File error event received:", data);
              yield { type: "file_error", data };
              break;

            default:
              console.warn("Unknown event type received:", result.type);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          console.log("File watcher subscription aborted");
        } else {
          console.error("Error in file watcher subscription:", error);
          throw error;
        }
      } finally {
        // Cleanup when the subscription ends
        watcher.close();
        console.log("File watcher closed for project:", input.projectName);
      }
    }),
});
