/**
 * Bug Condition Exploration Test: OTP Rate Limit Bypass
 * 
 * **Validates: Requirements 3.1**
 * 
 * This test encodes the EXPECTED SECURE BEHAVIOR:
 * - After 3 OTP requests in 10 minutes, the 4th and 5th requests should return HTTP 429
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code (failure confirms bug exists)
 * When this test FAILS, it proves that OTP rate limiting is missing.
 * 
 * DO NOT fix the code when this test fails - that's expected!
 */

import { test, expect } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const TEST_EMAIL = `otp-test-${Date.now()}@example.com`;

test('OTP Rate Limit Bypass - Should reject 4th and 5th requests within 60 seconds', async () => {
  // Skip if no Supabase URL is configured
  if (!process.env.VITE_SUPABASE_URL) {
    console.log('Skipping test: VITE_SUPABASE_URL not configured');
    return;
  }

  const results: Array<{ requestNum: number; status: number; body: any }> = [];

  // Send 5 OTP requests in rapid succession (within 60 seconds)
  for (let i = 1; i <= 5; i++) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });

    const body = await response.json();
    results.push({
      requestNum: i,
      status: response.status,
      body,
    });

    // Small delay to ensure requests are sequential but within the same minute
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Log results for debugging
  console.log('OTP Rate Limit Test Results:', JSON.stringify(results, null, 2));

  // EXPECTED SECURE BEHAVIOR:
  // Requests 1-3 should succeed (HTTP 200)
  expect(results[0].status).toBe(200);
  expect(results[1].status).toBe(200);
  expect(results[2].status).toBe(200);

  // Requests 4-5 should be rate-limited (HTTP 429)
  expect(results[3].status).toBe(429);
  expect(results[3].body.error).toContain('Too many');
  
  expect(results[4].status).toBe(429);
  expect(results[4].body.error).toContain('Too many');

  // If this test FAILS, it confirms the bug:
  // "All 5 OTP requests succeeded; no rate limiting enforced"
}, 30000); // 30 second timeout for network requests
