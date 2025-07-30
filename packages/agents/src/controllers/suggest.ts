import { logger } from "@chara-codes/logger";
import type { CoreMessage } from "ai";
import {
  parseSuggestionsFromResponse,
  suggestionAgent,
} from "../agents/suggestion-agent";
import { mapMessages } from "../utils";

let mcpTools: Record<string, unknown> = {};

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Helper function to generate cache key
const generateCacheKey = (maxSuggestions: number): string => {
  return JSON.stringify({ maxSuggestions });
};

// Helper function to check if cache entry is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const suggestController = {
  setTools: (newTools: Record<string, unknown>) => {
    mcpTools = newTools;
  },
  OPTIONS: () => new Response("", { headers: CORS_HEADERS }),
  POST: async (req: Request) => {
    const data = await req.json();
    const { model, messages } = data as {
      model: string;
      messages: CoreMessage[];
    };
    const url = new URL(req.url);
    const maxSuggestions = parseInt(
      url.searchParams.get("maxSuggestions") || "10"
    );
    const refreshCache = url.searchParams.get("refresh") === "true";

    // Generate cache key
    const cacheKey = generateCacheKey(maxSuggestions);

    // Check cache if not refreshing
    if (!refreshCache) {
      const cachedEntry = cache.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        return new Response(JSON.stringify(cachedEntry.data), {
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            "X-Cache": "HIT",
          },
        });
      }
    }

    try {
      const result = await suggestionAgent({
        model,
        messages: mapMessages(messages),
        workingDir: process.cwd(),
        maxSuggestions,
        tools: mcpTools,
      });

      // Parse suggestions from the response text
      const suggestions = parseSuggestionsFromResponse(result.text);

      // Store in cache
      const responseData = { suggestions };
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      });

      return new Response(JSON.stringify(responseData), {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "X-Cache": "MISS",
        },
      });
    } catch (error) {
      logger.dump(error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
