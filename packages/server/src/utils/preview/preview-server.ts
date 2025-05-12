import { spawn } from "child_process";
import { detectWebFramework } from "./detect-framework"; // the function above
import { myLogger } from "../logger";

export function startPreviewServer(
  projectPath: string,
  port = 3123,
): Promise<{ process: any; url: string }> {
  return new Promise((resolve, reject) => {
    const framework = detectWebFramework(projectPath);
    if (!framework) return reject("Unsupported project type");

    let cmd: string,
      args: string[] = [],
      env = { ...process.env };

    switch (framework) {
      case "next":
        cmd = "npx";
        args = ["next", "dev", "-p", port.toString()];
        myLogger.success("Start preview: Next framework detected");
        break;
      case "nuxt":
        cmd = "npx";
        args = ["nuxt", "dev", "--port", port.toString()];
        myLogger.success("Start preview: Nuxt framework detected");
        break;
      case "vite":
        cmd = "npx";
        args = ["vite", "--port", port.toString()];
        myLogger.success("Start preview: Vite framework detected");
        break;
      case "angular":
        cmd = "npx";
        args = ["ng", "serve", "--port", port.toString()];
        myLogger.success("Start preview: Angular framework detected");
        break;
      case "static":
        cmd = "npx";
        args = ["live-server", "--port=" + port.toString(), "--no-browser"];
        myLogger.success(
          "Start preview: No framework detected, serving static",
        );
        break;
      default:
        return reject("Unknown framework");
    }

    const child = spawn(cmd, args, {
      cwd: projectPath,
      stdio: "inherit",
      env,
    });

    myLogger.info(
      `Running preview server with command: ${cmd} ${args.join(" ")}`,
    );

    child.on("error", reject);
    resolve({ process: child, url: `http://localhost:${port}` });
  });
}
