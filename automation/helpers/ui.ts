import { Page, Locator, expect } from "@playwright/test";

/**
 * Helper functions for UI interactions
 */
export const UI = {
  /**
   * Navigate to a specific URL
   */
  async goto(page: Page, path: string): Promise<void> {
    await page.goto(path);
  },

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(
    page: Page,
    selector: string,
    timeout?: number,
  ): Promise<Locator> {
    const element = page.locator(selector);
    await element.waitFor({ state: "visible", timeout });
    return element;
  },

  /**
   * Click on an element
   */
  async clickElement(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    await element.click();
  },

  /**
   * Fill an input field
   */
  async fillInput(page: Page, selector: string, text: string): Promise<void> {
    const input = page.locator(selector);
    await input.fill(text);
  },

  /**
   * Get text from an element
   */
  async getText(page: Page, selector: string): Promise<string> {
    const element = page.locator(selector);
    return element.innerText();
  },

  /**
   * Take a screenshot
   */
  async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `./screenshots/${name}.png` });
  },

  /**
   * Check if element exists
   */
  async elementExists(page: Page, selector: string): Promise<boolean> {
    const count = await page.locator(selector).count();
    return count > 0;
  },

  /**
   * Assert element text
   */
  async assertElementText(
    page: Page,
    selector: string,
    expectedText: string,
  ): Promise<void> {
    const element = page.locator(selector);
    await expect(element).toContainText(expectedText);
  },
};
