import { fetchAllModels } from "../providers";

// Whitelist of high-quality models
const MODEL_WHITELIST = [
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

  // GPT-4 variants from OpenRouter
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1-nano",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4o:extended",

  // GPT-4 variants from OpenAI provider
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",

  // O1, O3, O4 models from OpenRouter
  "openai/o1",
  "openai/o1-pro",
  "openai/o1-preview",
  "openai/o1-mini",
  "openai/o3",
  "openai/o3-mini",
  "openai/o3-mini-high",
  "openai/o4-mini",
  "openai/o4-mini-high",

  // O1, O3, O4 models from OpenAI provider
  "o1",
  "o1-pro",
  "o1-preview",
  "o1-mini",
  "o3",
  "o3-mini",
  "o4-mini",

  // Mistral models
  "mistralai/mistral-large",
  "mistralai/mistral-medium",
  "mistralai/mistral-small",
  "mistralai/mistral-nemo",
  "mistralai/mistral-nemo:free",
  "mistralai/mistral-tiny",
  "mistralai/codestral-2501",

  // Gemini models
  "google/gemini-2.5-pro-preview",
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.5-flash-preview:thinking",
  "google/gemini-pro-1.5",
  "google/gemini-flash-1.5",
  "google/gemini-flash-1.5-8b",

  // DeepSeek R1 models
  "deepseek/deepseek-r1",
  "deepseek/deepseek-chat",
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
