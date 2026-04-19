/**
 * Bug Condition Exploration Test: Public Admin Signup
 * 
 * **Validates: Requirements 2.1, 2.5**
 * 
 * This test encodes the EXPECTED SECURE BEHAVIOR:
 * - The admin login page should NOT display a "Sign Up" tab
 * - Admin accounts should only be provisioned out-of-band
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code (failure confirms bug exists)
 * When this test FAILS, it proves that public admin signup is enabled.
 * 
 * DO NOT fix the code when this test fails - that's expected!
 */

import { test, expect } from '../../playwright-fixture';

test('Public Admin Signup - Signup tab should NOT be visible', async ({ page }) => {
  // Navigate to admin login page
  await page.goto('/admin/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // EXPECTED SECURE BEHAVIOR:
  // The "Sign Up" tab should NOT exist
  const signupTab = page.getByRole('tab', { name: /sign up/i });
  
  // Assert that signup tab is NOT visible
  await expect(signupTab).not.toBeVisible();

  // Also check that there's no signup form
  const signupForm = page.locator('form').filter({ hasText: /create.*account|sign up/i });
  await expect(signupForm).not.toBeVisible();

  // If this test FAILS, it confirms the bug:
  // "Admin signup tab is publicly accessible at /admin/login"
});
