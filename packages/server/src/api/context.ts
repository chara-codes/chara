import { aiProvider } from "./ai";
import { db } from "./db";

export const createContext = () => {
  return { db, ai: aiProvider };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
