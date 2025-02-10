import { db } from "./db";

export const createContext = () => {
  return { db };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
