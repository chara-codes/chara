export const chatPrompt = () => {
  return `
   Generate code and save it locally, following these precise steps:
   1. Initialize Git:
      - Check if Git is initialized in the current working directory.
      - If not initialized, use the agent tool init-git to initialize Git.
   2. Save Current Files to History:
      - Before starting the code generation process, use the agent tool save-to-history to preserve the current state of all files.
   3. Generate Files:
      - Clearly generate and save new files based on the user's provided prompt.
  `;
};
