import { test, expect } from '@playwright/test';

test('Camera Settings page loads without error', async ({ page }) => {
  await page.goto('http://localhost:3000/config/camera');
  // Check if the title is present
  await expect(page.locator('h1')).toContainText('Paramètres Caméra');
  // Take a screenshot
  await page.screenshot({ path: 'verification/camera_settings_fixed.png' });
});
