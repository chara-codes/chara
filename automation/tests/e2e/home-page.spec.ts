import { test, expect } from '@playwright/test';
import { UI } from '../../helpers/ui';

test.describe('Home Page', () => {
  test('should display home page with correct title', async ({ page }) => {
    await UI.goto(page, '/');
    await UI.waitForElement(page, 'img[alt="Chara Codes"]');
    
    // Check the page title
    await expect(page).toHaveTitle(/Chara Codes/);
  });

  test('should show navigation links', async ({ page }) => {
    await UI.goto(page, '/');
    
    // Get navigation links
    const links = page.locator('nav a');
    const count = await links.count();
    
    // Extract text from links
    const linkTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      linkTexts.push(await links.nth(i).innerText());
    }
    
    // Verify important links exist
    expect(linkTexts.some(link => link.includes('Features'))).toBeTruthy();
    expect(linkTexts.some(link => link.includes('Getting Started'))).toBeTruthy();
  });

  test('should navigate to editor when clicking Get Started', async ({ page }) => {
    await UI.goto(page, '/');
    
    // Click the Get Started button
    await UI.clickElement(page, 'a:text("Get Started")');
    
    // Verify navigation to editor page
    await expect(page).toHaveURL(/.*editor/);
  });

  test('should display all required sections', async ({ page }) => {
    await UI.goto(page, '/');
    
    // Check all important sections are visible
    const sections = [
      '#introduction',
      '#features',
      '#getting-started',
      '#architecture'
    ];
    
    for (const section of sections) {
      expect(await UI.elementExists(page, section)).toBeTruthy();
    }
  });
});