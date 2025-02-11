import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .command(
    "dev <note>",
    "Start development with Chara Codes",
    (yargs) =>
      yargs.positional("note", {
        description: "The content of the note",
        type: "string",
      }),
    (argv) => console.log(argv.note),
  )
  .parse();
