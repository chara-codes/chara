import { tool } from "ai";
import z from "zod";
import { readFile as fsReadFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  platform,
  arch,
  release,
  hostname,
  cpus,
  totalmem,
  freemem,
  uptime,
} from "node:os";

interface CharaConfig {
  dev?: string;
  info: {
    name?: string;
    description?: string;
    version?: string;
    frameworks?: string[];
    tools?: string[];
    stack?: string[];
    packageManager?: string;
    scripts?: Record<string, string>;
    dependencies?: string[];
    devDependencies?: string[];
    languages?: string[];
    projectType?: string;
  };
}

export const envInfo = tool({
  description:
    "Get comprehensive environment information including project configuration from .chara.json and system details",
  parameters: z.object({
    workingDir: z
      .string()
      .optional()
      .describe("Working directory to analyze (defaults to current directory)"),
    includeSystem: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include system information"),
    includeProject: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include project information from .chara.json"),
  }),
  execute: async ({
    workingDir,
    includeSystem = true,
    includeProject = true,
  }) => {
    const cwd = workingDir || process.cwd();
    const result: any = {
      workingDirectory: cwd,
      timestamp: new Date().toISOString(),
    };

    // Project information from .chara.json
    if (includeProject) {
      const charaConfigPath = join(cwd, ".chara.json");

      try {
        if (existsSync(charaConfigPath)) {
          const configContent = await fsReadFile(charaConfigPath, "utf-8");
          const charaConfig: CharaConfig = JSON.parse(configContent);

          result.project = {
            hasCharaConfig: true,
            dev: charaConfig.dev,
            info: charaConfig.info,
          };
        } else {
          result.project = {
            hasCharaConfig: false,
            message:
              ".chara.json file not found. Run initialization to create project configuration.",
          };
        }
      } catch (error) {
        result.project = {
          hasCharaConfig: false,
          error: `Failed to read .chara.json: ${error instanceof Error ? error.message : String(error)}`,
        };
      }

      // Additional project files check
      const projectFiles = {
        packageJson: existsSync(join(cwd, "package.json")),
        readme:
          existsSync(join(cwd, "README.md")) ||
          existsSync(join(cwd, "readme.md")),
        gitignore: existsSync(join(cwd, ".gitignore")),
        tsconfig: existsSync(join(cwd, "tsconfig.json")),
        eslintrc:
          existsSync(join(cwd, ".eslintrc.js")) ||
          existsSync(join(cwd, ".eslintrc.json")),
        prettierrc:
          existsSync(join(cwd, ".prettierrc")) ||
          existsSync(join(cwd, "prettier.config.js")),
        dockerfile: existsSync(join(cwd, "Dockerfile")),
        dockerCompose:
          existsSync(join(cwd, "docker-compose.yml")) ||
          existsSync(join(cwd, "docker-compose.yaml")),
      };

      result.project.files = projectFiles;
    }

    // System information
    if (includeSystem) {
      const memory = {
        total: Math.round((totalmem() / 1024 / 1024 / 1024) * 100) / 100, // GB
        free: Math.round((freemem() / 1024 / 1024 / 1024) * 100) / 100, // GB
        used:
          Math.round(((totalmem() - freemem()) / 1024 / 1024 / 1024) * 100) /
          100, // GB
      };

      result.system = {
        platform: platform(),
        architecture: arch(),
        release: release(),
        hostname: hostname(),
        uptime: Math.round((uptime() / 3600) * 100) / 100, // hours
        cpu: {
          model: cpus()[0]?.model || "Unknown",
          cores: cpus().length,
        },
        memory,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      };

      // Runtime information
      result.runtime = {
        isBun: typeof Bun !== "undefined",
        isNode: typeof process !== "undefined" && !!process.versions?.node,
        nodeVersion: process.versions?.node || null,
        processId: process.pid,
        processTitle: process.title,
        execPath: process.execPath,
      };

      // Environment variables (filtered for security)
      const safeEnvVars = [
        "NODE_ENV",
        "PATH",
        "HOME",
        "USER",
        "SHELL",
        "TERM",
        "PWD",
        "LANG",
        "LC_ALL",
        "TZ",
        "CI",
        "GITHUB_ACTIONS",
        "VERCEL",
        "NETLIFY",
      ];

      result.environment = {};
      safeEnvVars.forEach((key) => {
        if (process.env[key]) {
          result.environment[key] = process.env[key];
        }
      });
    }

    return result;
  },
});
