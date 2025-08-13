import { NodeFS } from "@chara-codes/shared";
import { Project } from "@netlify/build-info";
import { tool } from "ai";
import z from "zod";

export const projectInfo = tool({
  description: `Get comprehensive project information including package manager, workspaces, build systems, frameworks, and build settings.

This tool analyzes a project directory to detect:
- Package Manager (npm, yarn, pnpm, bun)
- Workspaces configuration
- Build Systems (Vite, Webpack, etc.)
- Frameworks (Next.js, React, Vue, etc.)
- Language Runtimes
- Build Settings and configuration

Can be used on the current project or a specific directory path.`,

  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe(
        "The path to analyze. If not provided, analyzes the current working directory. " +
          "This path should never be absolute, and the first component of the path should always be a root directory in a project."
      ),
    includeSettings: z
      .boolean()
      .default(true)
      .describe(
        "Include build settings analysis (may take longer but provides more detailed information)"
      ),
    includeFrameworks: z
      .boolean()
      .default(true)
      .describe("Include framework detection"),
    includeRuntimes: z
      .boolean()
      .default(true)
      .describe("Include language runtime detection"),
  }),

  execute: async ({
    path,
    includeSettings = true,
    includeFrameworks = true,
    includeRuntimes = true,
  }) => {
    try {
      const fsImpl = new NodeFS();
      const targetPath = path ? path : process.cwd();

      // Create project instance
      const project = new Project(fsImpl, targetPath)
        .setEnvironment(process.env)
        .setNodeVersion(process.version);

      const result: {
        path: string;
        timestamp: string;
        packageManager?: any;
        workspace?: any;
        buildSystems?: any[];
        frameworks?: any[];
        runtimes?: any[];
        buildSettings?: any[];
        packageJson?: any;
        errors?: string[];
      } = {
        path: targetPath,
        timestamp: new Date().toISOString(),
      };

      // Detect package manager
      try {
        const packageManager = await project.detectPackageManager();
        result.packageManager = packageManager
          ? {
              name: packageManager.name,
              lockFile: packageManager.lockFiles?.[0] || null,
              runCommand: packageManager.runCommand,
              installCommand: packageManager.installCommand,
            }
          : null;
      } catch (error: unknown) {
        result.packageManager = null;
        result.errors = result.errors || [];
        result.errors.push(
          `Package manager detection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Detect workspaces
      try {
        const workspace = await project.detectWorkspaces();
        result.workspace = workspace
          ? {
              isRoot: workspace.isRoot,
              rootDir: workspace.rootDir,
              packages: workspace.packages.map((pkg) => ({
                path: pkg.path,
                name: pkg.name,
                forcedFramework: pkg.forcedFramework,
              })),
            }
          : null;
      } catch (error: unknown) {
        result.workspace = null;
        result.errors = result.errors || [];
        result.errors.push(
          `Workspace detection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Detect build systems
      try {
        const buildSystems = await project.detectBuildSystem();
        result.buildSystems = buildSystems.map((bs) => ({
          id: bs.id,
          name: bs.name,
          category: (bs as any).category || "unknown",
          configFiles: (bs as any).configFiles || [],
          npmDependencies: (bs as any).npmDependencies || [],
        }));
      } catch (error: unknown) {
        result.buildSystems = [];
        result.errors = result.errors || [];
        result.errors.push(
          `Build system detection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Detect frameworks if requested
      if (includeFrameworks) {
        try {
          const frameworks = await project.detectFrameworks();
          result.frameworks =
            frameworks?.map((fw) => ({
              id: fw.id,
              name: fw.name,
              category: fw.category,
              dev: fw.dev,
              build: fw.build,
              staticAssetsDirectory: fw.staticAssetsDirectory,
              env: fw.env,
              configFiles: fw.configFiles,
              npmDependencies: fw.npmDependencies,
            })) || [];
        } catch (error: unknown) {
          result.frameworks = [];
          result.errors = result.errors || [];
          result.errors.push(
            `Framework detection failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Detect runtimes if requested
      if (includeRuntimes) {
        try {
          const runtimes = await project.detectRuntime();
          result.runtimes = runtimes.map((runtime) => ({
            id: runtime.id,
            name: runtime.name,
            version: (runtime as any).version || null,
          }));
        } catch (error: unknown) {
          result.runtimes = [];
          result.errors = result.errors || [];
          result.errors.push(
            `Runtime detection failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Get build settings if requested
      if (includeSettings) {
        try {
          const settings = await project.getBuildSettings();
          result.buildSettings = settings.map((setting) => ({
            packagePath: setting.packagePath,
            buildCommand: setting.buildCommand,
            devCommand: setting.devCommand,
            installCommand: (setting as any).installCommand || null,
            publishDirectory: (setting as any).publishDirectory || null,
            functionsDirectory:
              (setting as any).functionsDirectory ||
              setting.functionsDir ||
              null,
            env: setting.env,
            framework: setting.framework
              ? {
                  id: setting.framework.id,
                  name: setting.framework.name,
                  category: (setting.framework as any).category || "unknown",
                }
              : null,
          }));
        } catch (error: unknown) {
          result.buildSettings = [];
          result.errors = result.errors || [];
          result.errors.push(
            `Build settings detection failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Get package.json info
      try {
        const packageJson = await project.getPackageJSON();
        if (packageJson.pkgPath) {
          result.packageJson = {
            path: packageJson.pkgPath,
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            scripts: packageJson.scripts,
            dependencies: packageJson.dependencies
              ? Object.keys(packageJson.dependencies)
              : [],
            devDependencies: packageJson.devDependencies
              ? Object.keys(packageJson.devDependencies)
              : [],
          };
        }
      } catch (error: unknown) {
        result.errors = result.errors || [];
        result.errors.push(
          `Package.json reading failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Format the response
      let response = `## Project Information for: \`${targetPath}\`\n\n`;

      if (result.packageJson) {
        response += `### Package Information\n`;
        response += `- **Name**: ${result.packageJson.name || "N/A"}\n`;
        response += `- **Version**: ${result.packageJson.version || "N/A"}\n`;
        response += `- **Description**: ${
          result.packageJson.description || "N/A"
        }\n`;
        response += `- **Package.json Path**: ${result.packageJson.path}\n\n`;
      }

      if (result.packageManager) {
        response += `### Package Manager\n`;
        response += `- **Name**: ${result.packageManager.name}\n`;
        response += `- **Lock File**: ${result.packageManager.lockFile}\n`;
        response += `- **Run Command**: ${result.packageManager.runCommand}\n`;
        response += `- **Install Command**: ${result.packageManager.installCommand}\n\n`;
      } else {
        response += `### Package Manager\n`;
        response += `- No package manager detected (not a JavaScript/Node.js project)\n\n`;
      }

      if (result.workspace) {
        response += `### Workspace Configuration\n`;
        response += `- **Is Root**: ${result.workspace.isRoot}\n`;
        response += `- **Root Directory**: ${result.workspace.rootDir}\n`;
        response += `- **Packages**: ${result.workspace.packages.length}\n`;
        for (const pkg of result.workspace.packages) {
          response += `  - ${pkg.path}${pkg.name ? ` (${pkg.name})` : ""}${
            pkg.forcedFramework ? ` [${pkg.forcedFramework}]` : ""
          }\n`;
        }
        response += `\n`;
      }

      if (result.buildSystems && result.buildSystems.length > 0) {
        response += `### Build Systems\n`;
        for (const bs of result.buildSystems) {
          response += `- **${bs.name}** (${bs.id})\n`;
          response += `  - Category: ${bs.category}\n`;
          if (bs.configFiles && bs.configFiles.length > 0) {
            response += `  - Config Files: ${bs.configFiles.join(", ")}\n`;
          }
          if (bs.npmDependencies && bs.npmDependencies.length > 0) {
            response += `  - Dependencies: ${bs.npmDependencies.join(", ")}\n`;
          }
        }
        response += `\n`;
      }

      if (
        includeFrameworks &&
        result.frameworks &&
        result.frameworks.length > 0
      ) {
        response += `### Frameworks\n`;
        for (const fw of result.frameworks) {
          response += `- **${fw.name}** (${fw.id})\n`;
          response += `  - Category: ${fw.category}\n`;
          if (fw.dev) response += `  - Dev Command: ${fw.dev}\n`;
          if (fw.build) response += `  - Build Command: ${fw.build}\n`;
          if (fw.staticAssetsDirectory)
            response += `  - Static Assets: ${fw.staticAssetsDirectory}\n`;
          if (fw.configFiles && fw.configFiles.length > 0) {
            response += `  - Config Files: ${fw.configFiles.join(", ")}\n`;
          }
        }
        response += `\n`;
      }

      if (includeRuntimes && result.runtimes && result.runtimes.length > 0) {
        response += `### Language Runtimes\n`;
        for (const runtime of result.runtimes) {
          response += `- **${runtime.name}** (${runtime.id})\n`;
          if (runtime.version) response += `  - Version: ${runtime.version}\n`;
        }
        response += `\n`;
      }

      if (
        includeSettings &&
        result.buildSettings &&
        result.buildSettings.length > 0
      ) {
        response += `### Build Settings\n`;
        for (const setting of result.buildSettings) {
          response += `- **Package**: ${setting.packagePath || "root"}\n`;
          if (setting.buildCommand)
            response += `  - Build Command: ${setting.buildCommand}\n`;
          if (setting.devCommand)
            response += `  - Dev Command: ${setting.devCommand}\n`;
          if (setting.installCommand)
            response += `  - Install Command: ${setting.installCommand}\n`;
          if (setting.publishDirectory)
            response += `  - Publish Directory: ${setting.publishDirectory}\n`;
          if (setting.functionsDirectory)
            response += `  - Functions Directory: ${setting.functionsDirectory}\n`;
          if (setting.framework)
            response += `  - Framework: ${setting.framework.name} (${setting.framework.id})\n`;
          if (setting.env && Object.keys(setting.env).length > 0) {
            response += `  - Environment Variables: ${Object.keys(
              setting.env
            ).join(", ")}\n`;
          }
          response += `\n`;
        }
      }

      if (
        result.packageJson?.scripts &&
        Object.keys(result.packageJson.scripts).length > 0
      ) {
        response += `### Available Scripts\n`;
        for (const [script, command] of Object.entries(
          result.packageJson.scripts
        )) {
          response += `- **${script}**: \`${command}\`\n`;
        }
        response += `\n`;
      }

      if (
        result.packageJson?.dependencies &&
        result.packageJson.dependencies.length > 0
      ) {
        response += `### Dependencies (${result.packageJson.dependencies.length})\n`;
        response += `${result.packageJson.dependencies.join(", ")}\n\n`;
      }

      if (
        result.packageJson?.devDependencies &&
        result.packageJson.devDependencies.length > 0
      ) {
        response += `### Dev Dependencies (${result.packageJson.devDependencies.length})\n`;
        response += `${result.packageJson.devDependencies.join(", ")}\n\n`;
      }

      if (result.errors && result.errors.length > 0) {
        response += `### Errors/Warnings\n`;
        for (const error of result.errors) {
          response += `- ${error}\n`;
        }
        response += `\n`;
      }

      response += `---\n*Analysis completed at ${result.timestamp}*`;

      return response;
    } catch (error: unknown) {
      return `Error analyzing project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  },
});
