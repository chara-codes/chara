/**
 * Gemini CLI AI SDK - Streaming Example with Tools
 *
 * This demonstrates streaming text generation using Google's Gemini models
 * via the ai-sdk-provider-gemini-cli with OAuth authentication and tool usage.
 *
 * Prerequisites:
 * 1. Install dependencies: pnpm add ai-sdk-provider-gemini-cli ai zod
 * 2. Install Gemini CLI globally: npm install -g @google/gemini-cli
 * 3. Authenticate: Run `gemini` and follow the interactive setup
 *
 * @see https://ai-sdk.dev/providers/community-providers/gemini-cli
 */

import { streamText } from "ai";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";
import { z } from "zod";

// Create provider with OAuth authentication
// Uses credentials from ~/.gemini/oauth_creds.json
const gemini = createGeminiProvider({
  authType: "oauth-personal",
});

async function streamingExample() {
  console.log("🚀 Streaming response from Gemini with tool support...\n");
  const result = await streamText({
    model: gemini("gemini-2.5-flash"),
    prompt: "Make dummy.txt file with `ololo` content",
  });

  // console.log(result.toUIMessageStreamResponse({}));

  // Stream the text response as it's generated
  console.log("Response:\n");
  for await (const chunk of result.fullStream) {
    // process.stdout.write(chunk);
    console.log(chunk);
  }

  console.log("\n\n✅ Streaming complete!");
}

// Run the example
streamingExample().catch((error) => {
  console.error("\n❌ Error occurred:");
  console.error("Message:", error.message);
  if (error.cause) {
    console.error("Cause:", JSON.stringify(error.cause, null, 2));
  }
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  process.exit(1);
});
