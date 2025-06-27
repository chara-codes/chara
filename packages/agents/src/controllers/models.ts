import { fetchAllModels } from "../providers";

// Whitelist of high-quality models
const MODEL_WHITELIST = [
  // Google
  "models/gemini-2.5-pro-preview-06-05",
  "models/gemini-2.5-flash-preview-05-20",
  "models/gemini-2.5-flash",
  "models/gemini-2.5-pro",
  "models/gemini-2.5-flash-lite-preview-06-17",
  "models/gemini-2.5-flash-preview-04-17",

  //DIAL
  "deepseek-r1",
  "gpt-4.1-mini-2025-04-14",
  "gemini-2.5-flash-preview-05-20",
  "claude-sonnet-4@20250514",
  "claude-3-7-sonnet@20250219",
  "o4-mini-2025-04-16",
  "gpt-4.1-2025-04-14",
  "anthropic.claude-3-7-sonnet-20250219-v1:0",
  "anthropic.claude-3-7-sonnet-20250219-v1:0-with-thinking",
  "anthropic.claude-sonnet-4-20250514-v1:0",
  "anthropic.claude-sonnet-4-20250514-v1:0-with-thinking",
  "claude-3-5-sonnet-v2@20241022",

  // Claude models
  "claude-opus-4-20250514",
  "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "anthropic/claude-opus-4",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-3.7-sonnet",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.7-sonnet:thinking",
  "anthropic/claude-3.5-haiku",

  // GPT-4 variants from OpenRouter
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1-nano",
  "openai/gpt-4o",

  // GPT-4 variants from OpenAI provider
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",

  // Mistral models
  "mistralai/mistral-nemo:free",
  // "mistralai/devstral-small:free",
  // "mistralai/devstral-small",
  "mistralai/mistral-large",
  "mistralai/codestral-2501",

  // Gemini models
  "google/gemini-2.5-pro-preview",
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.5-flash-preview-05-20",

  // DeepSeek R1 models
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-chat-v3-0324",
  // other models
  "moonshotai/kimi-dev-72b:free",
  "minimax/minimax-m1:extended",
  "minimax/minimax-m1",
  "qwen/qwen3-32b:free",
];

export const modelsController = {
  async getModels(req: Request) {
    try {
      const allModels = await fetchAllModels();

      const models = Object.entries(allModels).flatMap(([provider, models]) =>
        models
          .filter((model) => {
            const url = new URL(req.url);
            // Check if provider filtering is requested
            const providerParam = url.searchParams.get("provider");
            if (providerParam && providerParam !== provider) {
              return false;
            }
            // Skip filtering if 'app' query param exists
            if (url.searchParams.has("all")) {
              return true;
            }
            // Include all ollama models
            if (provider === "ollama" || provider === "lmstudio") {
              return true;
            }
            // Include whitelisted models
            return MODEL_WHITELIST.includes(model.id);
          })
          .map((model) => ({
            id: model.id,
            name: model.name || model.id,
            provider: provider,
          })),
      );

      return Response.json(
        { models },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      );
    } catch (error) {
      return Response.json(
        {
          error: "Failed to fetch models",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
};
