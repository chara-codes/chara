import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as packageJson from "../package.json";
import { devCommand } from "./commands/dev";

yargs(hideBin(process.argv))
  .scriptName("chara")
  .usage("$0 <command> [options]")
  .version(packageJson.version)
  .help()
  .command(devCommand)
  .demandCommand(1, "You need to specify a command")
  .strict()
  .epilogue("For more information, check the documentation")
  .parse();
