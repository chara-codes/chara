import { initAgent } from "../src/agents/init-agent.js";
import { writeFile } from "fs/promises";
import { join } from "path";

/**
 * Example usage of the Init Agent
 * This demonstrates how to analyze a project and generate .chara.json
 */

async function runInitAgentExample() {
  console.log("🚀 Starting Init Agent Example...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Example 1: Analyze current project
    console.log("\n📁 Analyzing current project...");

    const result = await initAgent({
      model: "openai:::gpt-4o-mini",
      workingDir: process.cwd()
    });

    console.log("✅ Analysis started, streaming results...\n");

    let fullResponse = "";

    // Stream and collect the response
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📄 Analysis completed!");

    // Example of what the agent might have generated
    const exampleCharaConfig = {
      "dev": "turbo run dev",
      "info": {
        "name": "Chara Codes",
        "description": "AI-powered development environment designed to streamline frontend development workflows",
        "version": "1.0.0",
        "frameworks": ["next.js", "react", "trpc"],
        "tools": ["turbo", "bun", "drizzle-orm", "playwright", "tailwindcss"],
        "stack": ["typescript", "javascript", "nodejs"],
        "packageManager": "bun",
        "scripts": {
          "dev": "turbo run dev",
          "build": "turbo run build",
          "test": "turbo run test"
        },
        "dependencies": ["turbo"],
        "devDependencies": ["@types/bun"],
        "languages": ["typescript", "javascript"],
        "projectType": "web"
      }
    };

    // Save example config (commented out to avoid overwriting existing files)
    // const configPath = join(process.cwd(), ".chara.json");
    // await writeFile(configPath, JSON.stringify(exampleCharaConfig, null, 2));
    // console.log(`💾 Generated .chara.json saved to: ${configPath}`);

    console.log("\n📋 Example .chara.json structure:");
    console.log(JSON.stringify(exampleCharaConfig, null, 2));

  } catch (error) {
    console.error("\n❌ Error running init agent:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  }
}

/**
 * Example for analyzing a different project directory
 */
async function analyzeSpecificProject(projectPath: string) {
  console.log(`\n🔍 Analyzing project at: ${projectPath}`);

  try {
    const result = await initAgent({
      model: "openai:::gpt-4o-mini",
      workingDir: projectPath
    });

    console.log("📊 Analysis results:");

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

  } catch (error) {
    console.error(`❌ Failed to analyze project at ${projectPath}:`, error);
  }
}

/**
 * Example of using different AI models
 */
async function tryDifferentModels() {
  const models = [
    "openai:::gpt-4o-mini",
    "anthropic:::claude-3-haiku",
    "ollama:::llama3.2"
  ];

  for (const model of models) {
    console.log(`\n🤖 Testing with model: ${model}`);

    try {
      const result = await initAgent({
        model,
        workingDir: process.cwd()
      });

      console.log("✅ Model responded successfully");

      // Just get the first few chunks to test
      let chunkCount = 0;
      for await (const chunk of result.textStream) {
        if (chunkCount++ > 5) break;
        process.stdout.write(chunk);
      }

    } catch (error) {
      console.error(`❌ Model ${model} failed:`, error);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "analyze":
      const projectPath = args[1] || process.cwd();
      await analyzeSpecificProject(projectPath);
      break;

    case "models":
      await tryDifferentModels();
      break;

    case "help":
      console.log(`
Usage: bun run init-agent-example.ts [command] [options]

Commands:
  analyze [path]  - Analyze a specific project directory
  models          - Test different AI models
  help            - Show this help message

Default: Run analysis on current directory

Examples:
  bun run init-agent-example.ts
  bun run init-agent-example.ts analyze ./my-project
  bun run init-agent-example.ts models
      `);
      break;

    default:
      await runInitAgentExample();
  }
}

// Handle errors gracefully
main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

export { runInitAgentExample, analyzeSpecificProject, tryDifferentModels };
