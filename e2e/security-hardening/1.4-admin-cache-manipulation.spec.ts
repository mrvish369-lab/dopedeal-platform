/**
 * Bug Condition Exploration Test: Admin Cache Manipulation
 * 
 * **Validates: Requirements 2.3, 2.7**
 * 
 * This test encodes the EXPECTED SECURE BEHAVIOR:
 * - Admin cache should NEVER grant access without RPC verification
 * - Manipulated cache values should be ignored
 * - All sensitive actions must re-verify admin status via database
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code (failure confirms bug exists)
 * When this test FAILS, it proves that admin cache is trusted for authorization.
 * 
 * DO NOT fix the code when this test fails - that's expected!
 */

import { test, expect } from '../../playwright-fixture';

test('Admin Cache Manipulation - Malicious cache should NOT grant access', async ({ page }) => {
  // Navigate to admin login page first
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Inject malicious admin cache into sessionStorage (not localStorage)
  await page.evaluate(() => {
    const maliciousCache = {
      userId: 'fake-admin-user-id',
      email: 'attacker@example.com',
      isAdmin: true,
      checkedAt: Date.now(), // Fresh timestamp to bypass TTL check
    };
    sessionStorage.setItem('dd_admin_access_cache_v1', JSON.stringify(maliciousCache));
  });

  // Try to navigate to admin dashboard
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');

  // EXPECTED SECURE BEHAVIOR:
  // 1. User should be redirected to login page (access denied)
  // OR
  // 2. An error message should appear
  // OR
  // 3. The page should show "Verifying admin access..." and then redirect

  // Wait a bit for any RPC verification to complete
  await page.waitForTimeout(2000);

  // Check current URL - should be redirected to login
  const currentUrl = page.url();
  const isOnLoginPage = currentUrl.includes('/admin/login');
  
  // Check for error messages
  const errorMessage = page.locator('text=/not authorized|access denied|permission denied|admin access required/i');
  const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

  // Check for loading state (which should eventually redirect)
  const loadingMessage = page.locator('text=/verifying.*access|checking.*permission/i');
  const isStillLoading = await loadingMessage.isVisible().catch(() => false);

  // EXPECTED SECURE BEHAVIOR: At least one of these should be true
  const accessDenied = isOnLoginPage || hasErrorMessage || isStillLoading;
  
  expect(accessDenied).toBe(true);

  // Additional check: Admin dashboard content should NOT be visible
  const dashboardContent = page.locator('text=/admin dashboard|manage users|analytics/i');
  await expect(dashboardContent).not.toBeVisible();

  // If this test FAILS, it confirms the bug:
  // "Admin UI rendered based on manipulated cache without RPC verification"
});
