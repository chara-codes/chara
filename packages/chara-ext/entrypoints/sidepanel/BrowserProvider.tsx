import { MessagingProtocolMap } from "@/utils/messages";
import { BrowserContext } from "@chara-codes/core";

export const BrowserProvider = ({ children }: any) => {
  const sentMessageToApp = async (
    message: keyof MessagingProtocolMap,
    payload: any = null
  ) => {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return await sendMessage(message, payload, tab.id);
  };

  return (
    <BrowserContext.Provider value={{ browser, sentMessageToApp }}>
      {children}
    </BrowserContext.Provider>
  );
};
