import { createContext } from "react";

interface IBrowserContext {
  browser?: any;
  sentMessageToApp?: any;
}

export const BrowserContext = createContext<IBrowserContext>({});
