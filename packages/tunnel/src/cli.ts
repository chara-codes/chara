import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readFileSync } from "fs";
import { resolve } from "path";
import { serverCommand } from "./commands/server";
import { clientCommand } from "./commands/client";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
);

yargs(hideBin(process.argv))
  .scriptName("tunnel")
  .usage("$0 <command> [options]")
  .version(packageJson.version)
  .help()
  .command(serverCommand)
  .command(clientCommand)
  .demandCommand(1, "You need to specify a command")
  .strict()
  .epilogue("For more information, check the documentation")
  .parse();
