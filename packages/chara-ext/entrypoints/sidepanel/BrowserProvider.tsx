import { BrowserContext } from "@chara-codes/core";

export const BrowserProvider = ({ children }) => {
  const sentMessageToApp = async (
    message: string = "ololo",
    payload: any = null
  ) => {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return await sendMessage(message as any, payload, tab.id);
  };

  return (
    <BrowserContext.Provider value={{ browser, sentMessageToApp }}>
      {children}
    </BrowserContext.Provider>
  );
};
