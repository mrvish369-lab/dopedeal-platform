/**
 * Bug Condition Exploration Test: Weak Password Acceptance
 * 
 * **Validates: Requirements 2.2, 2.6**
 * 
 * This test encodes the EXPECTED SECURE BEHAVIOR:
 * - Passwords must be at least 12 characters
 * - Passwords must contain uppercase, digit, and special character
 * - Weak passwords like "admin1" should be REJECTED
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code (failure confirms bug exists)
 * When this test FAILS, it proves that weak passwords are accepted.
 * 
 * DO NOT fix the code when this test fails - that's expected!
 */

import { test, expect } from '../../playwright-fixture';

test('Weak Password Acceptance - "admin1" should be REJECTED', async ({ page }) => {
  // Navigate to admin login page
  await page.goto('/admin/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if there's a signup tab (if it exists, use it; otherwise test on sign-in form)
  const signupTab = page.getByRole('tab', { name: /sign up/i });
  const hasSignupTab = await signupTab.isVisible().catch(() => false);

  if (hasSignupTab) {
    await signupTab.click();
  }

  // Fill in email
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill('test-weak-password@example.com');

  // Fill in weak password: "admin1" (6 chars, no uppercase, no special char)
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('admin1');

  // Try to submit the form
  const submitButton = page.getByRole('button', { name: /sign (up|in)/i }).first();
  await submitButton.click();

  // EXPECTED SECURE BEHAVIOR:
  // An error message should appear indicating password complexity requirements
  // Use first() to handle multiple matching elements (toast title + description)
  const errorMessage = page.locator('text=/password.*must.*12.*character|password.*complexity|password.*weak|password.*uppercase|password.*digit|password.*special/i').first();
  
  // Wait for error message to appear
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // If this test FAILS, it confirms the bug:
  // "Password 'admin1' was accepted without complexity validation"
});
