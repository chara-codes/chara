import { trpc } from "../src/services/trpc";

const res = await trpc.chat.getHistory.query({});
