# Security Hardening Bug Condition Exploration Tests

## Overview

This directory contains **bug condition exploration tests** that are designed to **FAIL on unfixed code**. These tests encode the expected secure behavior and serve to:

1. **Confirm the bugs exist** - When tests fail, they prove the vulnerabilities are present
2. **Document the expected secure behavior** - Tests describe what should happen after fixes
3. **Validate the fixes** - After implementation, these same tests should pass

## Test Status

### ✅ Vitest Tests (API/Edge Functions)

Located in: `.kiro/specs/security-hardening/tests/`

| Test | Status | Bug Confirmed |
|------|--------|---------------|
| 1.1 OTP Rate Limit Bypass | ❌ FAILING | ✅ YES - All 5 requests succeeded (no rate limiting) |
| 1.5 Edge Function Error Leakage | ❌ FAILING | ✅ YES - Detailed Resend errors leaked to client |

**Counterexamples Found:**
- **OTP Rate Limit**: All 5 OTP requests returned HTTP 200 within 60 seconds, proving no server-side rate limiting exists
- **Error Leakage**: Edge Function returned `"Email send failed: {...}"` with full Resend API error details

### 🔄 Playwright Tests (E2E/UI)

Located in: `e2e/security-hardening/`

| Test | Status | Notes |
|------|--------|-------|
| 1.2 Public Admin Signup | ⏳ READY | Needs Playwright execution |
| 1.3 Weak Password Acceptance | ⏳ READY | Needs Playwright execution |
| 1.4 Admin Cache Manipulation | ⏳ READY | Needs Playwright execution |

## Running the Tests

### Vitest Tests (API)

```bash
# Run all vitest tests
npm test -- .kiro/specs/security-hardening/tests/

# Run specific test
npm test -- .kiro/specs/security-hardening/tests/1.1-otp-rate-limit-bypass.spec.ts
```

### Playwright Tests (E2E)

```bash
# Run all Playwright tests
npx playwright test e2e/security-hardening/

# Run specific test
npx playwright test e2e/security-hardening/1.2-public-admin-signup.spec.ts

# Run with UI
npx playwright test --ui
```

## Expected Behavior

### BEFORE Fix (Current State)
- ❌ Tests FAIL - This is EXPECTED and CORRECT
- ❌ Failures confirm the security vulnerabilities exist
- ❌ Counterexamples document the exact bug conditions

### AFTER Fix (Target State)
- ✅ Tests PASS - This confirms the fixes work correctly
- ✅ All security vulnerabilities are addressed
- ✅ Expected secure behavior is enforced

## Test Details

### 1.1 OTP Rate Limit Bypass Test
**Bug Condition**: Server accepts unlimited OTP requests without rate limiting
**Expected Secure Behavior**: After 3 requests in 10 minutes, return HTTP 429
**Current Result**: ❌ All 5 requests succeeded with HTTP 200

### 1.2 Public Admin Signup Test
**Bug Condition**: Admin signup form is publicly accessible
**Expected Secure Behavior**: No signup tab visible; admin accounts provisioned out-of-band only
**Current Result**: ⏳ Pending Playwright execution

### 1.3 Weak Password Acceptance Test
**Bug Condition**: Weak passwords (e.g., "admin1") are accepted
**Expected Secure Behavior**: Passwords must be 12+ chars with uppercase, digit, special char
**Current Result**: ⏳ Pending Playwright execution

### 1.4 Admin Cache Manipulation Test
**Bug Condition**: Manipulated localStorage cache grants admin UI access
**Expected Secure Behavior**: Cache never grants access; all actions verify via RPC
**Current Result**: ⏳ Pending Playwright execution

### 1.5 Edge Function Error Leakage Test
**Bug Condition**: Detailed error messages (stack traces, API errors) leaked to client
**Expected Secure Behavior**: Only generic error messages with correlation IDs returned
**Current Result**: ❌ Detailed Resend API errors exposed

## Next Steps

1. ✅ **Phase 1 Complete**: Bug condition exploration tests created and executed
2. ⏳ **Phase 1 Remaining**: Run Playwright tests to confirm remaining bugs
3. ⏳ **Phase 2**: Write preservation tests (ensure legitimate operations still work)
4. ⏳ **Phase 3**: Implement fixes
5. ⏳ **Phase 4**: Re-run all tests to confirm fixes work and no regressions

## Important Notes

- **DO NOT fix the code when tests fail** - Failures are expected and confirm bugs exist
- **DO NOT modify tests to make them pass** - Tests encode the correct secure behavior
- **Document all counterexamples** - They prove the bugs and guide the fixes
- These tests will be re-run after fixes to validate the implementation
