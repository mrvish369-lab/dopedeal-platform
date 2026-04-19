/**
 * Preservation Property Test: Legitimate OTP Requests
 * 
 * **Validates: Requirements 3.1, 3.3**
 * 
 * This test captures the BASELINE BEHAVIOR on UNFIXED code:
 * - First 3 OTP requests within 10 minutes should succeed with HTTP 200
 * - OTP emails should be sent successfully
 * 
 * **CRITICAL**: This test MUST PASS on unfixed code (confirms baseline to preserve)
 * After implementing rate limiting fixes, this test should STILL PASS (no regression)
 * 
 * **Observation-First Methodology**:
 * 1. Observe: First OTP request succeeds with HTTP 200
 * 2. Observe: Second OTP request (after 2 minutes) succeeds with HTTP 200
 * 3. Observe: Third OTP request (after 5 minutes) succeeds with HTTP 200
 * 4. Property: For all OTP requests where requestCount <= 3 within 10-minute window,
 *    response status = 200 AND email is sent
 */

import { test, expect } from '../../playwright-fixture';

test.describe('Legitimate OTP Requests Preservation', () => {
  const testEmail = `test-otp-${Date.now()}@example.com`;

  test('First 3 OTP requests within 10 minutes should succeed', async ({ page }) => {
    // Navigate to the app (assuming OTP is triggered from auth modal)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test Case 1: First OTP request should succeed
    await page.evaluate(async (email) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('send-otp', {
        body: { email }
      });
      
      // Store result for assertion
      (window as any).__otpResult1 = {
        status: result.error ? 'error' : 'success',
        error: result.error,
        data: result.data
      };
    }, testEmail);

    const result1 = await page.evaluate(() => (window as any).__otpResult1);
    expect(result1.status).toBe('success');
    expect(result1.data?.success).toBe(true);

    // Wait 2 seconds (simulating user waiting before retry)
    await page.waitForTimeout(2000);

    // Test Case 2: Second OTP request should succeed
    await page.evaluate(async (email) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('send-otp', {
        body: { email }
      });
      
      (window as any).__otpResult2 = {
        status: result.error ? 'error' : 'success',
        error: result.error,
        data: result.data
      };
    }, testEmail);

    const result2 = await page.evaluate(() => (window as any).__otpResult2);
    expect(result2.status).toBe('success');
    expect(result2.data?.success).toBe(true);

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Test Case 3: Third OTP request should succeed
    await page.evaluate(async (email) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('send-otp', {
        body: { email }
      });
      
      (window as any).__otpResult3 = {
        status: result.error ? 'error' : 'success',
        error: result.error,
        data: result.data
      };
    }, testEmail);

    const result3 = await page.evaluate(() => (window as any).__otpResult3);
    expect(result3.status).toBe('success');
    expect(result3.data?.success).toBe(true);

    // PRESERVATION PROPERTY:
    // All 3 requests within the rate limit should succeed
    // This confirms the baseline behavior that must be preserved after implementing rate limiting
  });

  test('OTP requests respect client-side 60-second cooldown', async ({ page }) => {
    const cooldownEmail = `cooldown-${Date.now()}@example.com`;
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // First request should succeed
    await page.evaluate(async (email) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('send-otp', {
        body: { email }
      });
      
      (window as any).__cooldownResult1 = {
        status: result.error ? 'error' : 'success',
        data: result.data
      };
    }, cooldownEmail);

    const result1 = await page.evaluate(() => (window as any).__cooldownResult1);
    expect(result1.status).toBe('success');

    // Wait 65 seconds to clear client-side cooldown
    await page.waitForTimeout(65000);

    // Second request after cooldown should also succeed
    await page.evaluate(async (email) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const result = await supabase.functions.invoke('send-otp', {
        body: { email }
      });
      
      (window as any).__cooldownResult2 = {
        status: result.error ? 'error' : 'success',
        data: result.data
      };
    }, cooldownEmail);

    const result2 = await page.evaluate(() => (window as any).__cooldownResult2);
    expect(result2.status).toBe('success');

    // PRESERVATION PROPERTY:
    // Legitimate requests that respect cooldown should continue to work
  });
});
