import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - set a token in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com',
        subscriptionTier: 'premium'
      }));
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should display dashboard with main components', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Check for sidebar navigation
    await expect(page.locator('[data-testid="sidebar"]').or(page.locator('nav'))).toBeVisible();
    
    // Check for portfolio summary or market overview
    await expect(
      page.locator('text=Portfolio').or(
      page.locator('text=Market Overview')).or(
      page.locator('text=Analytics'))
    ).toBeVisible();
  });

  test('should have responsive sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if sidebar is collapsible or hidden on mobile
    const sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('nav'));
    
    // Either sidebar should be hidden or there should be a menu toggle
    const isSidebarVisible = await sidebar.isVisible();
    const hasMenuToggle = await page.locator('[data-testid="menu-toggle"]').or(
      page.locator('button:has-text("Menu")')).or(
      page.locator('button:has-text("☰")')).isVisible();
    
    expect(isSidebarVisible || hasMenuToggle).toBeTruthy();
  });

  test('should display portfolio table when portfolio data exists', async ({ page }) => {
    // Mock portfolio data
    await page.route('**/api/portfolio', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '1',
            ticker: 'AAPL',
            shares: 10,
            entryPrice: 150,
            currentPrice: 155,
            portfolioType: 'solid',
            action: 'HOLD'
          }
        ])
      });
    });

    // Reload page to fetch mocked data
    await page.reload();

    // Check for portfolio table elements
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=HOLD')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/portfolio', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.reload();

    // Check for loading indicators
    await expect(page.locator('.animate-spin').or(page.locator('[data-testid="loading"]'))).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/portfolio', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });

    await page.reload();

    // Check for error handling (could be error message, fallback content, etc.)
    await expect(page.locator('text=Error').or(page.locator('text=Something went wrong'))).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Check for proper form labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.locator('+ label').or(
        input.locator('~ label')).or(
        input.locator('xpath=preceding::label')).count() > 0;
      const hasAriaLabel = await input.getAttribute('aria-label');
      const hasPlaceholder = await input.getAttribute('placeholder');
      
      expect(hasLabel || hasAriaLabel || hasPlaceholder).toBeTruthy();
    }
  });
});
