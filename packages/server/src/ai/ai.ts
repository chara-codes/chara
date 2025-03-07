import "dotenv/config";
import { selectAIProvider } from "../utils/select-ai-provider";

export const aiProvider = selectAIProvider({
  apiKey: String(process.env.AI_KEY),
  apiUrl: String(process.env.AI_URL),
})
