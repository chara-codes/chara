import { test, expect } from "@playwright/test";
import { UI } from "../../helpers/ui.js";

test.describe("AI-assisted Editor Tests", () => {
  test("run AI-generated test for code editor", async ({ page }) => {
    // Skip if no API key provided
    test.skip(!process.env.OPENAI_API_KEY, "No OpenAI API key provided");

    await UI.goto(page, "/editor");
    await UI.waitForElement(page, ".editor-container");
  });
});
