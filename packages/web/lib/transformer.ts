import superjson from "superjson";
import JSONL from "jsonl-parse-stringify";

export const transformer = {
  input: {
    ...superjson,
    serialize: (object: object) => {
      console.log("input object serialize", object);
      return JSONL.stringify([object] as object[]);
    },
  },
  output: {
    serialize: (object: object) => {
      console.log("output object serialize", object);
      return JSONL.stringify([object] as object[]);
    },
    // This `eval` only ever happens on the **client**
    deserialize: (object: string) => {
      console.log("output object deserialize", object);
      return JSONL.parse(String(object));
    },
  },
};
