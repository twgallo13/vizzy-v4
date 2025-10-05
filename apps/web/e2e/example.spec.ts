import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Vizzy v4/);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Check if main navigation elements are present
  await expect(page.locator('h1')).toContainText('Campaign Planner');
  
  // Test navigation to AI page
  await page.click('text=AI Assistant');
  await expect(page.locator('h1')).toContainText('AI Assistant');
  
  // Test navigation to Governance page
  await page.click('text=Governance');
  await expect(page.locator('h1')).toContainText('Governance');
});

test('command palette opens with keyboard shortcut', async ({ page }) => {
  await page.goto('/');

  // Press Cmd+K (or Ctrl+K on non-Mac)
  await page.keyboard.press('Meta+KeyK');
  
  // Check if command palette is visible
  await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
});

test('responsive design works', async ({ page }) => {
  await page.goto('/');

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.sidebar')).not.toBeVisible();

  // Test desktop viewport
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('.sidebar')).toBeVisible();
});
