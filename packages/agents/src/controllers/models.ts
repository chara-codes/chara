import { fetchAllModels } from "../providers";

// Whitelist of high-quality models
const MODEL_WHITELIST = [
  // Claude models
  "anthropic/claude-opus-4",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-3.7-sonnet",
  "anthropic/claude-3.7-sonnet:beta",
  "anthropic/claude-3.7-sonnet:thinking",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-sonnet:beta",
  "anthropic/claude-3.5-sonnet-20240620",
  "anthropic/claude-3.5-sonnet-20240620:beta",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-haiku:beta",
  "anthropic/claude-3.5-haiku-20241022",
  "anthropic/claude-3.5-haiku-20241022:beta",
  "anthropic/claude-3-opus",
  "anthropic/claude-3-opus:beta",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-sonnet:beta",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-haiku:beta",
  
  // GPT-4 variants from OpenRouter
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1-nano",
  "openai/gpt-4o",
  "openai/gpt-4o-2024-11-20",
  "openai/gpt-4o-2024-08-06",
  "openai/gpt-4o-2024-05-13",
  "openai/gpt-4",
  "openai/gpt-4-turbo",
  "openai/gpt-4-turbo-preview",
  "openai/gpt-4-1106-preview",
  "openai/gpt-4-0314",
  "openai/gpt-4-32k",
  "openai/gpt-4-32k-0314",
  "openai/gpt-4o-mini",
  "openai/gpt-4o-mini-2024-07-18",
  "openai/gpt-4o:extended",
  "openai/gpt-4.5-preview",
  "openai/chatgpt-4o-latest",
  "openai/gpt-4o-mini-search-preview",
  "openai/gpt-4o-search-preview",
  
  // GPT-4 variants from OpenAI provider
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano-2025-04-14",
  "gpt-4o",
  "gpt-4o-2024-11-20",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-05-13",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-turbo-preview",
  "gpt-4-1106-preview",
  "gpt-4-0125-preview",
  "gpt-4-0613",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4.5-preview",
  "gpt-4.5-preview-2025-02-27",
  "chatgpt-4o-latest",
  "gpt-4o-mini-search-preview",
  "gpt-4o-mini-search-preview-2025-03-11",
  "gpt-4o-search-preview",
  "gpt-4o-search-preview-2025-03-11",
  "gpt-4o-audio-preview",
  "gpt-4o-audio-preview-2024-10-01",
  "gpt-4o-audio-preview-2024-12-17",
  "gpt-4o-realtime-preview",
  "gpt-4o-realtime-preview-2024-10-01",
  "gpt-4o-realtime-preview-2024-12-17",
  "gpt-4o-mini-realtime-preview",
  "gpt-4o-mini-realtime-preview-2024-12-17",
  "gpt-4o-mini-audio-preview",
  "gpt-4o-mini-audio-preview-2024-12-17",
  
  // O1, O3, O4 models from OpenRouter
  "openai/o1",
  "openai/o1-pro",
  "openai/o1-preview",
  "openai/o1-preview-2024-09-12",
  "openai/o1-mini",
  "openai/o1-mini-2024-09-12",
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
  "o1-2024-12-17",
  "o1-preview-2024-09-12",
  "o1-mini-2024-09-12",
  "o1-pro-2025-03-19",
  "o3",
  "o3-mini",
  "o3-mini-2025-01-31",
  "o4-mini",
  "o4-mini-2025-04-16",
  
  // Mistral models
  "mistralai/mistral-large-2411",
  "mistralai/mistral-large-2407",
  "mistralai/mistral-large",
  "mistralai/mistral-medium-3",
  "mistralai/mistral-medium",
  "mistralai/mistral-small",
  "mistralai/mistral-small-3.1-24b-instruct",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "mistralai/mistral-small-24b-instruct-2501",
  "mistralai/mistral-small-24b-instruct-2501:free",
  "mistralai/mistral-saba",
  "mistralai/mistral-7b-instruct",
  "mistralai/mistral-7b-instruct:free",
  "mistralai/mistral-7b-instruct-v0.1",
  "mistralai/mistral-7b-instruct-v0.2",
  "mistralai/mistral-7b-instruct-v0.3",
  "mistralai/mistral-nemo",
  "mistralai/mistral-nemo:free",
  "mistralai/mistral-tiny",
  "mistralai/mixtral-8x7b-instruct",
  "mistralai/mixtral-8x22b-instruct",
  "mistralai/codestral-2501",
  "mistralai/devstral-small",
  "mistralai/devstral-small:free",
  "mistralai/pixtral-12b",
  "mistralai/pixtral-large-2411",
  "mistralai/ministral-8b",
  "mistralai/ministral-3b",
  
  // Gemini models
  "google/gemini-2.5-pro-preview",
  "google/gemini-2.5-pro-exp-03-25",
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.5-flash-preview:thinking",
  "google/gemini-2.5-flash-preview-05-20",
  "google/gemini-2.5-flash-preview-05-20:thinking",
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-pro-1.5",
  "google/gemini-flash-1.5",
  "google/gemini-flash-1.5-8b",
  "google/gemma-2-27b-it",
  "google/gemma-2-9b-it",
  "google/gemma-2-9b-it:free",
  "google/gemma-2b-it",
  "google/gemma-3-1b-it:free",
  "google/gemma-3-4b-it",
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-27b-it",
  "google/gemma-3-27b-it:free",
  "google/gemma-3n-e4b-it:free",
  
  // DeepSeek R1 models
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-r1-zero:free",
  "deepseek/deepseek-r1-0528",
  "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-r1-0528-qwen3-8b",
  "deepseek/deepseek-r1-0528-qwen3-8b:free",
  "deepseek/deepseek-r1-distill-llama-8b",
  "deepseek/deepseek-r1-distill-llama-70b",
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "deepseek/deepseek-r1-distill-qwen-1.5b",
  "deepseek/deepseek-r1-distill-qwen-14b",
  "deepseek/deepseek-r1-distill-qwen-14b:free",
  "deepseek/deepseek-r1-distill-qwen-32b",
  "deepseek/deepseek-r1-distill-qwen-32b:free",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-chat:free",
  "deepseek/deepseek-chat-v3-0324",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-v3-base:free",
  "deepseek/deepseek-prover-v2",
  "deepseek/deepseek-prover-v2:free",
];

export const modelsController = {
  async getModels() {
    try {
      const allModels = await fetchAllModels();
      
      const models = Object.entries(allModels).flatMap(([provider, models]) =>
        models
          .filter((model) => {
            // Include all ollama models
            if (provider === "ollama") {
              return true;
            }
            // Include whitelisted models
            return MODEL_WHITELIST.includes(model.id);
          })
          .map((model) => ({
            id: model.id,
            name: model.name || model.id,
            provider: provider,
          }))
      );

      return Response.json({ models });
    } catch (error) {
      return Response.json(
        { 
          error: "Failed to fetch models",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  },
};