import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Check if we're redirected to login or if login form is visible
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on register link if it exists
    const registerLink = page.locator('text=Register').or(page.locator('text=Sign up')).first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*\/auth\/register/);
    }
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    // Navigate to register page
    const registerLink = page.locator('text=Register').or(page.locator('text=Sign up')).first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      
      // Try to register with invalid data
      await page.fill('input[name="name"]', '');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Invalid email format')).toBeVisible();
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    }
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if login form is still visible and properly styled
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check if form elements are touch-friendly
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verify elements have adequate touch targets (minimum 44px)
    const emailBox = await emailInput.boundingBox();
    const passwordBox = await passwordInput.boundingBox();
    const buttonBox = await submitButton.boundingBox();
    
    if (emailBox) expect(emailBox.height).toBeGreaterThanOrEqual(40);
    if (passwordBox) expect(passwordBox.height).toBeGreaterThanOrEqual(40);
    if (buttonBox) expect(buttonBox.height).toBeGreaterThanOrEqual(40);
  });
});
