import "dotenv/config";
import { selectAIProvider } from "../utils/select-ai-provider";
import { myAgent } from "./agents/my-agent";

export const aiProvider = selectAIProvider({
  apiKey: String(process.env.AI_KEY),
  apiUrl: String(process.env.AI_URL),
});

export const useChat = () => {
  const stream = async (
    input: string,
    project: { id: string; name: string },
  ) => {
    return myAgent(input, project);
  };

  return { stream };
};
