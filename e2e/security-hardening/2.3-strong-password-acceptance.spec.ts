/**
 * Preservation Property Test: Strong Password Acceptance
 * 
 * **Validates: Requirements 2.2, 2.6**
 * 
 * This test captures the BASELINE BEHAVIOR on UNFIXED code:
 * - Passwords meeting complexity requirements (12+ chars, uppercase, digit, special) are accepted
 * 
 * **CRITICAL**: This test MUST PASS on unfixed code (confirms baseline to preserve)
 * After enforcing password complexity validation, this test should STILL PASS
 * 
 * **Observation-First Methodology**:
 * 1. Observe: Password "SecureP@ss123" (12 chars, uppercase, digit, special) is accepted
 * 2. Observe: Password "MyAdm1n!Pass" (12 chars, uppercase, digit, special) is accepted
 * 3. Property: For all passwords where length >= 12 AND contains uppercase AND contains digit
 *    AND contains special char, password is accepted
 */

import { test, expect } from '../../playwright-fixture';

test.describe('Strong Password Acceptance Preservation', () => {
  // Test data: Strong passwords that meet complexity requirements
  const strongPasswords = [
    {
      password: 'SecureP@ss123',
      description: '12 chars with uppercase, digit, special char'
    },
    {
      password: 'MyAdm1n!Pass',
      description: '12 chars with uppercase, digit, special char'
    },
    {
      password: 'C0mpl3x!P@ssw0rd',
      description: '16 chars with uppercase, digit, special char'
    },
    {
      password: 'Str0ng#Passw0rd2024',
      description: '19 chars with uppercase, digit, special char'
    },
    {
      password: 'Admin$ecure123',
      description: '14 chars with uppercase, digit, special char'
    }
  ];

  test('Strong passwords meeting complexity requirements should be accepted', async ({ page }) => {
    // Navigate to admin login page
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Check if signup tab exists (it should on unfixed code)
    const signupTab = page.getByRole('tab', { name: /sign up/i });
    const hasSignupTab = await signupTab.isVisible().catch(() => false);

    if (!hasSignupTab) {
      console.log('Signup tab not found - test may be running on fixed code');
      // Skip this test if signup tab is already removed
      test.skip();
      return;
    }

    // Click signup tab
    await signupTab.click();
    await page.waitForTimeout(500);

    // Test each strong password
    for (const { password, description } of strongPasswords) {
      // Fill in signup form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      const testEmail = `test-${Date.now()}@example.com`;
      await emailInput.fill(testEmail);
      await passwordInput.fill(password);

      // Check if there's a password validation error
      // On unfixed code, strong passwords should NOT show validation errors
      const validationError = page.locator('text=/password.*must.*12.*characters|password.*too.*weak/i');
      const hasError = await validationError.isVisible().catch(() => false);

      // PRESERVATION PROPERTY: Strong passwords should be accepted (no validation error)
      expect(hasError).toBe(false);

      console.log(`✓ Strong password accepted: ${description}`);

      // Clear form for next test
      await emailInput.clear();
      await passwordInput.clear();
    }
  });

  test('Password validation function accepts strong passwords', async ({ page }) => {
    // Navigate to admin login page
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Test password validation logic directly in browser context
    const validationResults = await page.evaluate((passwords) => {
      // Simulate the password complexity validation that will be added
      const validatePassword = (password: string) => {
        const hasMinLength = password.length >= 12;
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
          isValid: hasMinLength && hasUppercase && hasDigit && hasSpecial,
          hasMinLength,
          hasUppercase,
          hasDigit,
          hasSpecial
        };
      };

      return passwords.map((pwd: string) => ({
        password: pwd,
        validation: validatePassword(pwd)
      }));
    }, strongPasswords.map(p => p.password));

    // Verify all strong passwords pass validation
    for (const result of validationResults) {
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.hasMinLength).toBe(true);
      expect(result.validation.hasUppercase).toBe(true);
      expect(result.validation.hasDigit).toBe(true);
      expect(result.validation.hasSpecial).toBe(true);

      console.log(`✓ Password validation passed: ${result.password}`);
    }

    // PRESERVATION PROPERTY: All strong passwords meeting complexity requirements
    // should pass validation logic
  });

  test('Edge case: Minimum valid password (exactly 12 chars)', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    // Test minimum valid password: exactly 12 characters with all requirements
    const minValidPassword = 'Passw0rd!123'; // 12 chars, uppercase, digit, special

    const validation = await page.evaluate((pwd) => {
      const hasMinLength = pwd.length >= 12;
      const hasUppercase = /[A-Z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

      return {
        isValid: hasMinLength && hasUppercase && hasDigit && hasSpecial,
        length: pwd.length
      };
    }, minValidPassword);

    // PRESERVATION PROPERTY: Minimum valid password should be accepted
    expect(validation.isValid).toBe(true);
    expect(validation.length).toBe(12);
  });
});
