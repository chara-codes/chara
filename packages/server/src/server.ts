import { Elysia } from "elysia";
import { trpc } from "@elysiajs/trpc";
import { cors } from "@elysiajs/cors";
import { appRouter } from "./api/routes";
import { createContext } from "./api/context";
import { bold } from "picocolors";

const port = Number(process.env.PORT) || 1337;

const app = new Elysia();

app
  .use(cors())
  .use(
    trpc(appRouter, {
      createContext,
    }),
  )
  .listen(port, () => {
    console.log(`Server starting on ${bold(`http://localhost:${port}`)}`);
  });
