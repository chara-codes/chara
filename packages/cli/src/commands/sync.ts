import type { CommandModule } from "yargs";
import { resolve, basename } from "path";
import { logger } from "@chara/logger";
import { cyan, bold } from "picocolors";
import { FileWatcher } from "../utils/file-watcher";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@chara/server";
import superjson from "superjson";

interface SyncCommandArgs {
  projectDir?: string;
  projectName?: string;
  verbose?: boolean;
}

// Create tRPC client for API communication
function createApiClient() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3030/trpc",
        transformer: superjson
      }),
    ],
  });
}

export const syncCommand: CommandModule<{}, SyncCommandArgs> = {
  command: "sync",
  describe: "Sync project files with the Chara web UI",
  builder: (yargs) =>
    yargs
      .option("projectDir", {
        describe: "Project root directory",
        type: "string",
        default: process.cwd(),
        alias: "p",
      })
      .option("projectName", {
        describe: "Project name (defaults to directory name)",
        type: "string",
        alias: "n",
      })
      .option("verbose", {
        describe: "Enable verbose logging",
        type: "boolean",
        default: false,
        alias: "v",
      }),
  handler: async (argv) => {
    // Set log level based on verbosity
    if (argv.verbose) {
      logger.setLevel("debug");
    } else {
      logger.setLevel("info");
    }

    // Resolve the project directory path
    const projectDir = resolve(argv.projectDir || process.cwd());
    const projectName = argv.projectName || basename(projectDir);
    const projectId = Math.random().toString(36).substring(2, 11);

    logger.info(bold(cyan(`\n🔄 Syncing project files for ${projectName}...\n`)));

    try {
      process.chdir(projectDir);
      logger.info(`Working directory: ${projectDir}`);
    } catch (error) {
      logger.error(`Failed to change to directory: ${projectDir}`);
      logger.error((error as Error).message);
      process.exit(1);
    }

    try {
      // Initialize the API client
      const apiClient = createApiClient();
      logger.debug("API client initialized");

      // Register project with the server
      await apiClient.files.setProject.mutate({
        id: projectId,
        name: projectName,
        path: projectDir,
      });
      logger.info(`Registered project: ${projectName} (${projectId})`);

      // Initialize the file watcher (but don't start actual watching)
      const fileWatcher = new FileWatcher({
        rootPath: projectDir,
      });

      // Get the project structure
      logger.info("Scanning project files...");
      const projectStructure = await fileWatcher.getProjectStructure();
      
      // Sync the structure with the server
      await apiClient.files.syncProjectStructure.mutate(projectStructure);
      
      logger.success(`✓ Project structure synced (${projectStructure.length} files)`);
      logger.info("The web UI preview panel has been updated with your project files.");
    } catch (error) {
      logger.error("Failed to sync project files:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};