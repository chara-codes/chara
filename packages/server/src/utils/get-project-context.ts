import fs from "fs/promises";
import path from "path";

/**
 * Recursively reads all files in a folder and generates a text context
 * with their relative paths and content.
 *
 * @param folderPath Absolute path to the folder to check.
 * @param basePath Base path to calculate relative paths (default: folderPath).
 * @returns A promise resolving to a string containing the merged context.
 */
export async function generateProjectContext(
  folderPath: string,
  basePath: string = folderPath,
): Promise<string> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  let context = "";

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    const relativePath = path.relative(basePath, entryPath);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subContext = await generateProjectContext(entryPath, basePath);
      context += subContext;
    } else if (entry.isFile()) {
      // Read the file content
      try {
        const content = await fs.readFile(entryPath, "utf-8");
        context += `${relativePath}:\n${content}\n\n`;
      } catch (error) {
        console.error(`Error reading file ${entryPath}:`, error);
      }
    }
  }

  return context;
}

/**
 * Checks whether a folder has any content and generates an LLM-friendly context string.
 *
 * @param folderPath Absolute path to the folder to check.
 * @returns A promise resolving to a string with the project's file structure and content, or a message if the folder is empty.
 */
export async function getProjectContext(folderPath: string): Promise<string> {
  try {
    const entries = await fs.readdir(folderPath);

    if (entries.length === 0) {
      return "The project folder is empty.";
    }

    // Generate the context string for all files in the folder
    const context = await generateProjectContext(folderPath);
    return `Already existing code in the project:\n\n${context}`;
  } catch (error) {
    console.error(`Error accessing folder ${folderPath}:`, error);
    return "An error occurred while reading the project folder.";
  }
}
