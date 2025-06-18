/**
 * Generate a descriptive process name based on command and arguments
 */
export function generateProcessName(command: string, args: string[]): string {
  const fullCommand = [command, ...args].join(" ");

  // Common development server patterns
  if (
    fullCommand.includes("npm run dev") ||
    fullCommand.includes("npm start")
  ) {
    return "npm-dev-server";
  }
  if (fullCommand.includes("bun run dev") || fullCommand.includes("bun dev")) {
    return "bun-dev-server";
  }
  if (fullCommand.includes("yarn dev") || fullCommand.includes("yarn start")) {
    return "yarn-dev-server";
  }
  if (fullCommand.includes("pnpm dev") || fullCommand.includes("pnpm start")) {
    return "pnpm-dev-server";
  }
  if (fullCommand.includes("next dev")) {
    return "next-dev-server";
  }
  if (fullCommand.includes("vite")) {
    return "vite-dev-server";
  }
  if (fullCommand.includes("webpack-dev-server")) {
    return "webpack-dev-server";
  }
  if (fullCommand.includes("nodemon")) {
    return "nodemon-server";
  }
  if (fullCommand.includes("ts-node")) {
    return "ts-node-server";
  }
  if (fullCommand.includes("npx serve")) {
    return "serve-static-server";
  }

  // Docker containers
  if (command === "docker" && args.includes("run")) {
    const imageIndex = args.findIndex((arg) => !arg.startsWith("-"));
    const imageName = args[imageIndex] || "unknown";
    return `docker-${imageName.split(":")[0]}`;
  }

  // Default naming - handle common patterns
  if (command === "unknown-command") {
    return "unknown-process";
  }

  return `${command}-process`;
}
