import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { devCommand } from "./commands/dev";
import { readFileSync } from "fs";
import { resolve } from "path";

import { getAndStoreSystemInfo } from "./utils/get-system-info";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
);

/*try {
  await getAndStoreSystemInfo();
} catch (error) {
  console.error(error);
}*/

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
