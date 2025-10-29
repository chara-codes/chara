import { createContext } from "react";

interface IBrowserContext {
  browser?: unknown;
  sentMessageToApp?: unknown;
}

export const BrowserContext = createContext<IBrowserContext>({});
