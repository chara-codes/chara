import "dotenv/config";
import { selectAIProvider } from "../utils/select-ai-provider";
import { engineerAgent } from "./agents/engineer";

export const aiProvider = selectAIProvider({
  apiKey: String(process.env.AI_KEY),
  apiUrl: String(process.env.AI_URL),
});

export const useChat = () => {
  const stream = async (input: string) => {
    return engineerAgent(input);
  };

  return { stream };
};
