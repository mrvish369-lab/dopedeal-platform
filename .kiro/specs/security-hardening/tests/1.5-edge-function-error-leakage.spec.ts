/**
 * Bug Condition Exploration Test: Edge Function Error Leakage
 * 
 * **Validates: Requirements 5.1**
 * 
 * This test encodes the EXPECTED SECURE BEHAVIOR:
 * - Edge Functions should return ONLY generic error messages to clients
 * - Detailed error information (stack traces, query details) should NOT be exposed
 * - A correlation ID should be provided for debugging
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code (failure confirms bug exists)
 * When this test FAILS, it proves that detailed errors are leaked to clients.
 * 
 * DO NOT fix the code when this test fails - that's expected!
 */

import { test, expect } from 'vitest';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';

test('Edge Function Error Leakage - Should return ONLY generic error message', async () => {
  // Skip if no Supabase URL is configured
  if (!process.env.VITE_SUPABASE_URL) {
    console.log('Skipping test: VITE_SUPABASE_URL not configured');
    return;
  }

  // Trigger an error by sending invalid data to send-otp
  // (e.g., missing email field)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ /* intentionally empty to trigger error */ }),
  });

  const body = await response.json();

  console.log('Error Response:', JSON.stringify(body, null, 2));

  // EXPECTED SECURE BEHAVIOR:
  // 1. Error message should be generic (not revealing implementation details)
  const errorMessage = body.error || body.message || '';
  
  // Should NOT contain sensitive implementation details
  const hasSensitiveInfo = 
    errorMessage.includes('stack') ||
    errorMessage.includes('at ') || // Stack trace indicator
    errorMessage.includes('Error:') ||
    errorMessage.includes('Deno.') ||
    errorMessage.includes('supabase') ||
    errorMessage.includes('database') ||
    errorMessage.includes('query') ||
    errorMessage.includes('SQL') ||
    errorMessage.includes('function') ||
    errorMessage.includes('index.ts') ||
    errorMessage.includes('line ') ||
    errorMessage.toLowerCase().includes('unexpected error:'); // Current implementation leaks this

  expect(hasSensitiveInfo).toBe(false);

  // 2. Should contain a correlation ID or reference for debugging
  // (This is a nice-to-have, not strictly required for this test)
  const hasCorrelationId = 
    errorMessage.includes('Ref:') ||
    errorMessage.includes('ID:') ||
    errorMessage.includes('correlation') ||
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(errorMessage); // UUID pattern

  // For now, we'll just check that sensitive info is NOT leaked
  // The correlation ID requirement will be enforced after the fix

  // If this test FAILS, it confirms the bug:
  // "Edge Function returned detailed error: [actual error message]"
}, 10000);

test('Edge Function Error Leakage - Resend API error should be masked', async () => {
  // Skip if no Supabase URL is configured
  if (!process.env.VITE_SUPABASE_URL) {
    console.log('Skipping test: VITE_SUPABASE_URL not configured');
    return;
  }

  // This test simulates a Resend API failure
  // We can't easily trigger this without breaking the actual Resend integration,
  // so we'll test with an invalid email format that might trigger validation errors

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: 'not-an-email' }),
  });

  const body = await response.json();

  console.log('Resend Error Response:', JSON.stringify(body, null, 2));

  // EXPECTED SECURE BEHAVIOR:
  // Even if Resend returns an error, it should be masked
  const errorMessage = body.error || body.message || '';
  
  // Should NOT contain Resend-specific error details
  const hasResendDetails = 
    errorMessage.includes('Resend') ||
    errorMessage.includes('api.resend.com') ||
    errorMessage.includes('API key') ||
    errorMessage.includes('Email send failed:'); // Current implementation leaks this

  expect(hasResendDetails).toBe(false);

  // If this test FAILS, it confirms the bug:
  // "Edge Function leaked Resend API error details"
}, 10000);
