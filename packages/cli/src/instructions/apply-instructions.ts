import { writeFile, unlink, rename, mkdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { join, dirname } from "path";
import {
  ActionType,
  ActionStatus,
  type Instructions,
  type InstructionsResult,
  type ActionResult,
} from "./types";
import { logger } from "@apk/logger";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@apk/server";
import superjson from "superjson";

const execAsync = promisify(exec);

// Create a tRPC client to communicate with the server
const createApiClient = () => {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3030/trpc",
        transformer: superjson,
      }),
    ],
  });
};

async function ensureDirectoryExists(filePath: string): Promise<void> {
  const directory = dirname(filePath);
  try {
    await mkdir(directory, { recursive: true });
  } catch (error) {
    // Directory already exists or cannot be created
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

async function reportResults(results: InstructionsResult): Promise<void> {
  try {
    const client = createApiClient();
    logger.info("Reporting instruction results back to server");
    logger.debug("Results payload", results);

    await client.instructions.reportResults.mutate(results);
    logger.success("Successfully reported results to server");
  } catch (error) {
    logger.error(
      `Failed to report results to server: ${(error as Error).message}`,
    );
  }
}

export async function applyInstructions(
  instructions: Instructions,
): Promise<InstructionsResult> {
  const { actions, projectRoot } = instructions;

  logger.info("Applying Instructions", { count: actions.length });

  const results: ActionResult[] = [];
  let overallSuccess = true;

  for (const action of actions) {
    try {
      switch (action.type) {
        case ActionType.CREATE:
          logger.event("Create action started");
          if (!action.content || !action.target) {
            throw new Error(`Missing content or target for "create" action`);
          }
          const createPath = join(projectRoot, action.target);
          await ensureDirectoryExists(createPath);
          await writeFile(createPath, action.content, "utf-8");
          logger.success(`Created file: ${createPath}`);
          results.push({
            type: action.type,
            target: action.target,
            status: ActionStatus.SUCCESS,
            message: `Created file: ${action.target}`,
          });
          break;

        case ActionType.UPDATE:
          logger.event("Update action started");
          if (!action.content || !action.target) {
            throw new Error(`Missing content or target for "update" action`);
          }
          const updatePath = join(projectRoot, action.target);
          await writeFile(updatePath, action.content, "utf-8");
          logger.success(`Updated file: ${updatePath}`);
          results.push({
            type: action.type,
            target: action.target,
            status: ActionStatus.SUCCESS,
            message: `Updated file: ${action.target}`,
          });
          break;

        case ActionType.DELETE:
          logger.event("Delete action started");
          if (!action.target) {
            throw new Error(`Missing target for "delete" action`);
          }
          const deletePath = join(projectRoot, action.target);
          await unlink(deletePath);
          logger.success(`Deleted file: ${deletePath}`);
          results.push({
            type: action.type,
            target: action.target,
            status: ActionStatus.SUCCESS,
            message: `Deleted file: ${action.target}`,
          });
          break;

        case ActionType.RENAME:
          logger.event("Rename action started");
          if (!action.target || !action.newName) {
            throw new Error(`Missing target or newName for "rename" action`);
          }
          const renamePath = join(projectRoot, action.target);
          const newRenamePath = join(projectRoot, action.newName);
          await ensureDirectoryExists(newRenamePath);
          await rename(renamePath, newRenamePath);
          logger.success(`Renamed file: ${renamePath} to ${newRenamePath}`);
          results.push({
            type: action.type,
            target: action.target,
            status: ActionStatus.SUCCESS,
            message: `Renamed file: ${action.target} to ${action.newName}`,
          });
          break;

        case ActionType.SHELL:
          logger.event("Shell action started");
          if (!action.command) {
            throw new Error(`Missing command for "shell" action`);
          }
          const { stdout, stderr } = await execAsync(action.command, {
            cwd: projectRoot,
          });
          if (stdout) logger.debug(`Command output: ${stdout}`);
          if (stderr) logger.warning(`Command stderr: ${stderr}`);
          logger.success(`Executed shell command: ${action.command}`);
          results.push({
            type: action.type,
            command: action.command,
            status: ActionStatus.SUCCESS,
            message: `Executed command: ${action.command}`,
          });
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`Error processing action: ${errorMessage}`, action);

      results.push({
        type: action.type,
        target: action.target,
        command: action.command,
        status: ActionStatus.FAILURE,
        message: `Failed to execute action`,
        error: errorMessage,
      });

      overallSuccess = false;
    }
  }

  const instructionsResult: InstructionsResult = {
    actions: results,
    projectRoot,
    success: overallSuccess,
    timestamp: Date.now(),
  };

  await reportResults(instructionsResult);

  return instructionsResult;
}
