import { logger } from "@chara-codes/logger";

/**
 * Example script to test the suggest API endpoint
 * This demonstrates how to call the suggestion agent via REST API
 */

const API_BASE_URL = "http://localhost:3031";

async function testSuggestAPI() {
  try {
    logger.info("🧪 Testing Suggest API endpoint...");

    const payload = {
      model: "openai:::gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            "I need suggestions for improving my TypeScript project. What should I work on next?",
        },
      ],
      userMessageId: 1,
    };

    const response = await fetch(
      `${API_BASE_URL}/api/suggest?maxSuggestions=5`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    logger.info("✅ API call successful, processing JSON response...");

    const result = await response.json();

    logger.info("\n\n📋 Full response received:");
    logger.info("═".repeat(60));
    logger.info(JSON.stringify(result, null, 2));
    logger.info("═".repeat(60));

    if (result.error) {
      throw new Error(`API returned error: ${result.error}`);
    }

    const suggestions = result.suggestions || [];

    logger.info(`\n🎯 Received ${suggestions.length} suggestions:`);
    suggestions.forEach((suggestion) => {
      logger.info(`${suggestion}`);
    });
  } catch (error) {
    logger.error("❌ Test failed:", error);
    throw error;
  }
}

async function testSuggestAPIWithDifferentParams() {
  try {
    logger.info("\n🧪 Testing with different parameters...");

    const payload = {
      model: "openai:::gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            "Analyze my project structure and suggest specific improvements for code quality.",
        },
      ],
    };

    const response = await fetch(
      `${API_BASE_URL}/api/suggest?maxSuggestions=3`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    logger.info("✅ Second API call successful");
    logger.info(
      `📋 Received ${
        result.suggestions?.length || 0
      } suggestions from second test`
    );

    if (result.error) {
      throw new Error(`Second API call returned error: ${result.error}`);
    }
  } catch (error) {
    logger.error("❌ Second test failed:", error);
    throw error;
  }
}

async function testCORSHeaders() {
  try {
    logger.info("\n🧪 Testing CORS preflight request...");

    const response = await fetch(`${API_BASE_URL}/api/suggest`, {
      method: "OPTIONS",
    });

    if (!response.ok) {
      throw new Error(`CORS preflight failed! status: ${response.status}`);
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin"
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods"
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers"
      ),
    };

    logger.info("✅ CORS headers:", corsHeaders);
  } catch (error) {
    logger.error("❌ CORS test failed:", error);
    throw error;
  }
}

async function main() {
  logger.info("🚀 Starting Suggest API tests...");

  try {
    await testCORSHeaders();
    await testSuggestAPI();
    await testSuggestAPIWithDifferentParams();

    logger.info("\n🎉 All tests passed successfully!");
  } catch (error) {
    logger.error("\n💥 Test suite failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { testSuggestAPI, testSuggestAPIWithDifferentParams, testCORSHeaders };
