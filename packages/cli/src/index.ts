import { readFileSync } from "fs";
import { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { defaultModelCommand } from "./commands/default-model";
import { devCommand } from "./commands/dev";
import { initCommand } from "./commands/init";
import { initializeConfigCommand } from "./commands/initialize-config";
import { startAgentsCommand } from "./commands/start-agents";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8")
);

yargs(hideBin(process.argv))
  .scriptName("chara")
  .usage("$0 <command> [options]")
  .version(packageJson.version)
  .help()
  .command(initCommand)
  .command(devCommand)
  .command(defaultModelCommand)
  .command(initializeConfigCommand)
  .command(startAgentsCommand)
  .demandCommand(1, "You need to specify a command")
  .strict()
  .epilogue("For more information, check the documentation")
  .parse();
