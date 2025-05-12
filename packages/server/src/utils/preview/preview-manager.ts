import { isNonEmptyDirectory } from "../file-utils";
import {
  getPreviewState,
  clearPreviewState,
  setPreviewState,
} from "./preview-state";
import { startPreviewServer } from "./preview-server";

export async function handleProjectPreviewRequest(
  projectPath: string,
): Promise<string> {
  if (!isNonEmptyDirectory(projectPath)) {
    throw new Error("Selected project is empty or inaccessible.");
  }

  const current = getPreviewState();

  if (current && current.projectPath === projectPath) {
    // Already previewing the selected project
    return `http://localhost:${current.port}`;
  }

  // Kill old preview
  clearPreviewState();

  try {
    const port = 3000 + Math.floor(Math.random() * 1000); // Random port
    const { process, url } = await startPreviewServer(projectPath, port);

    setPreviewState({ process, projectPath, port });

    return url;
  } catch (err) {
    throw new Error("Failed to start preview: " + err);
  }
}
