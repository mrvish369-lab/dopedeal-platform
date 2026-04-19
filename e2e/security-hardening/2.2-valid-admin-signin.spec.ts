/**
 * Preservation Property Test: Valid Admin Sign-In
 * 
 * **Validates: Requirements 3.2**
 * 
 * This test captures the BASELINE BEHAVIOR on UNFIXED code:
 * - Admins with valid credentials can sign in at /admin/login
 * - Admin session persists across page refreshes
 * - Admins can navigate between admin pages without re-authentication
 * 
 * **CRITICAL**: This test MUST PASS on unfixed code (confirms baseline to preserve)
 * After removing signup tab and enforcing password complexity, this test should STILL PASS
 * 
 * **Observation-First Methodology**:
 * 1. Observe: Admin with valid credentials can sign in
 * 2. Observe: Admin session persists across page refresh
 * 3. Observe: Admin can navigate between admin pages without repeated re-auth
 * 4. Property: For all admins with valid credentials and is_admin=true in database,
 *    sign-in succeeds AND session persists AND admin routes are accessible
 */

import { test, expect } from '../../playwright-fixture';

test.describe('Valid Admin Sign-In Preservation', () => {
  // NOTE: This test requires a pre-existing admin account in the database
  // The test will be skipped if ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD env vars are not set
  const adminEmail = process.env.ADMIN_TEST_EMAIL;
  const adminPassword = process.env.ADMIN_TEST_PASSWORD;

  test.skip(!adminEmail || !adminPassword, 'Admin test credentials not configured');

  test('Admin with valid credentials can sign in and access admin panel', async ({ page }) => {
    // Navigate to admin login page
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Fill in sign-in form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const signInButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill(adminEmail!);
    await passwordInput.fill(adminPassword!);
    await signInButton.click();

    // Wait for navigation to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Verify we're on an admin page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    // PRESERVATION PROPERTY 1: Valid admin sign-in succeeds
    // Verify admin UI elements are visible (e.g., admin navigation)
    const adminNav = page.locator('nav').filter({ hasText: /dashboard|users|settings/i });
    await expect(adminNav).toBeVisible({ timeout: 5000 });
  });

  test('Admin session persists across page refresh', async ({ page, context }) => {
    // Sign in first
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const signInButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill(adminEmail!);
    await passwordInput.fill(adminPassword!);
    await signInButton.click();

    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify we're still on admin page (not redirected to login)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
    expect(currentUrl).not.toContain('/admin/login');

    // PRESERVATION PROPERTY 2: Admin session persists across refresh
    // Verify admin UI is still accessible
    const adminNav = page.locator('nav').filter({ hasText: /dashboard|users|settings/i });
    await expect(adminNav).toBeVisible({ timeout: 5000 });
  });

  test('Admin can navigate between admin pages without re-authentication', async ({ page }) => {
    // Sign in first
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const signInButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill(adminEmail!);
    await passwordInput.fill(adminPassword!);
    await signInButton.click();

    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Navigate to different admin pages
    const adminPages = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/campaigns',
      '/admin/analytics'
    ];

    for (const adminPage of adminPages) {
      await page.goto(adminPage);
      await page.waitForLoadState('networkidle');

      // Verify we're on the admin page (not redirected to login)
      const currentUrl = page.url();
      expect(currentUrl).toContain(adminPage);

      // Verify admin UI is accessible (no re-auth prompt)
      const adminNav = page.locator('nav').filter({ hasText: /dashboard|users|settings/i });
      await expect(adminNav).toBeVisible({ timeout: 5000 });
    }

    // PRESERVATION PROPERTY 3: Admin can navigate between pages without repeated re-auth
    // This confirms the admin cache and session management work correctly
  });
});
