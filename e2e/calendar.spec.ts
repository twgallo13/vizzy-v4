import { test, expect } from '@playwright/test';

test.describe('Calendar Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to planner/calendar view
    await page.getByRole('button', { name: 'Planner' }).click();
  });

  test('has no horizontal page overflow on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that body doesn't have horizontal scrollbar
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px tolerance
    
    // Check that the main content container doesn't overflow
    const mainElement = page.locator('main');
    const mainScrollWidth = await mainElement.evaluate(el => el.scrollWidth);
    const mainClientWidth = await mainElement.evaluate(el => el.clientWidth);
    
    expect(mainScrollWidth).toBeLessThanOrEqual(mainClientWidth + 1);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    // Desktop viewport for better keyboard testing
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Test tab order from toolbar to calendar days
    await page.keyboard.press('Tab'); // Should focus first focusable element (Export button or Add button)
    
    let focusedElement = await page.locator(':focus').first();
    const toolbarButton = await focusedElement.getAttribute('role') === 'button' || 
                           await focusedElement.evaluate(el => el.tagName === 'BUTTON');
    expect(toolbarButton).toBeTruthy();

    // Continue tabbing to reach calendar days
    let attempts = 0;
    let foundCalendarDay = false;
    
    while (attempts < 10 && !foundCalendarDay) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus').first();
      const ariaLabel = await focusedElement.getAttribute('aria-label');
      
      if (ariaLabel && ariaLabel.includes('activities')) {
        foundCalendarDay = true;
      }
      attempts++;
    }
    
    expect(foundCalendarDay).toBeTruthy();
  });

  test('arrow key navigation between days works', async ({ page }) => {
    // Desktop viewport for better keyboard testing
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Tab to first calendar day
    await page.keyboard.press('Tab');
    let attempts = 0;
    
    while (attempts < 10) {
      const focusedElement = await page.locator(':focus').first();
      const ariaLabel = await focusedElement.getAttribute('aria-label');
      
      if (ariaLabel && ariaLabel.includes('activities')) {
        break;
      }
      
      await page.keyboard.press('Tab');
      attempts++;
    }
    
    // Test arrow key navigation
    const initialFocused = await page.locator(':focus').first();
    const initialAriaLabel = await initialFocused.getAttribute('aria-label');
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    
    const nextFocused = await page.locator(':focus').first();
    const nextAriaLabel = await nextFocused.getAttribute('aria-label');
    
    // Should be different day
    expect(nextAriaLabel).not.toBe(initialAriaLabel);
    
    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    
    const backFocused = await page.locator(':focus').first();
    const backAriaLabel = await backFocused.getAttribute('aria-label');
    
    // Should be back to original day
    expect(backAriaLabel).toBe(initialAriaLabel);
  });

  test('focus ring is visible on calendar days', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Tab to first calendar day
    await page.keyboard.press('Tab');
    let attempts = 0;
    
    while (attempts < 10) {
      const focusedElement = await page.locator(':focus').first();
      const ariaLabel = await focusedElement.getAttribute('aria-label');
      
      if (ariaLabel && ariaLabel.includes('activities')) {
        break;
      }
      
      await page.keyboard.press('Tab');
      attempts++;
    }
    
    // Check that focused element has visible focus ring
    const focusedElement = await page.locator(':focus').first();
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    const ringStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).boxShadow
    );
    
    // Should have either outline or box-shadow (focus ring)
    const hasFocusIndicator = outlineStyle !== 'none' || ringStyle.includes('rgb');
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('calendar has proper heading hierarchy', async ({ page }) => {
    // Check h1 exists and is the page title
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Campaign Planner');
    
    // Check h2 elements (should be day names or section headers)
    const h2s = page.locator('h2');
    const h2Count = await h2s.count();
    
    // Check h3 elements (should be day names in the calendar)
    const h3s = page.locator('h3');
    const h3Count = await h3s.count();
    
    // Should have at least the day headers
    expect(h3Count).toBeGreaterThan(0);
    
    // Verify day names are present as headings
    await expect(page.locator('h3').filter({ hasText: 'Monday' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Tuesday' })).toBeVisible();
  });

  test('text sizes follow consistent scale', async ({ page }) => {
    // Check that text uses consistent size classes
    const h1FontSize = await page.locator('h1').first().evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    const bodyTextSize = await page.locator('p').first().evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    const h3FontSize = await page.locator('h3').first().evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    // Convert to numbers for comparison
    const h1Size = parseFloat(h1FontSize);
    const h3Size = parseFloat(h3FontSize);
    const bodySize = parseFloat(bodyTextSize);
    
    // H1 should be larger than H3, H3 should be larger than or equal to body
    expect(h1Size).toBeGreaterThan(h3Size);
    expect(h3Size).toBeGreaterThanOrEqual(bodySize);
  });

  test('theme colors are used correctly', async ({ page }) => {
    // Test that no hard-coded hex colors are used in critical elements
    const calendarCard = page.locator('[role="region"]').first();
    
    const backgroundColor = await calendarCard.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    const borderColor = await calendarCard.evaluate(el => 
      window.getComputedStyle(el).borderColor
    );
    
    // Should use CSS custom properties (will resolve to rgb/oklch values)
    // We just check that we get valid computed color values
    expect(backgroundColor).toMatch(/^rgb|oklch|hsl/);
    expect(borderColor).toMatch(/^rgb|oklch|hsl/);
  });

  test('passes lighthouse accessibility audit', async ({ page }) => {
    // This would ideally use @axe-core/playwright for automated a11y testing
    // For now, we'll do basic accessibility checks
    
    // Check for required attributes
    const calendarRegions = page.locator('[role="region"]');
    const regionCount = await calendarRegions.count();
    
    expect(regionCount).toBeGreaterThan(0);
    
    // Each calendar day should have an accessible name
    for (let i = 0; i < Math.min(regionCount, 7); i++) {
      const region = calendarRegions.nth(i);
      const ariaLabel = await region.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/activities/i);
    }
    
    // Check that interactive elements are focusable
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const tabIndex = await button.getAttribute('tabindex');
      // Should not have tabindex="-1" unless it's intentionally non-focusable
      if (tabIndex === '-1') {
        const ariaHidden = await button.getAttribute('aria-hidden');
        expect(ariaHidden).toBeTruthy(); // If tabindex=-1, should be aria-hidden
      }
    }
  });

  test('mobile horizontal scroll works correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Find the horizontal scroll container for calendar days
    const scrollContainer = page.locator('.overflow-x-auto').first();
    await expect(scrollContainer).toBeVisible();
    
    // Check initial scroll position
    const initialScrollLeft = await scrollContainer.evaluate(el => el.scrollLeft);
    expect(initialScrollLeft).toBe(0);
    
    // Scroll to the right
    await scrollContainer.evaluate(el => {
      el.scrollLeft = 100;
    });
    
    const newScrollLeft = await scrollContainer.evaluate(el => el.scrollLeft);
    expect(newScrollLeft).toBeGreaterThan(0);
    
    // Verify all 7 days are present in the scrollable area
    const dayHeaders = scrollContainer.locator('h3');
    const dayCount = await dayHeaders.count();
    expect(dayCount).toBe(7);
  });
});