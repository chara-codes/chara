import { Elysia } from "elysia";
import { trpc } from "@elysiajs/trpc";
import { cors } from "@elysiajs/cors";
import { appRouter } from "./api/routes";
import { createContext } from "./api/context";
import { bold } from "picocolors";
import { logger } from "@grotto/logysia";

const port = Number(process.env.PORT) || 1337;

const app = new Elysia();

app
  .use(cors())
  .use(
    logger({
      logIP: false,
      writer: {
        write(msg: string) {
          console.log(msg);
        },
      },
    }),
  )
  // These are the default options. You do not need to copy this down
  .use(
    trpc(appRouter, {
      createContext,
    }),
  )
  .listen(port, () => {
    console.log(`Server starting on ${bold(`http://localhost:${port}`)}`);
  });
