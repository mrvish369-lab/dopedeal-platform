# Implementation Plan

## Phase 1: Exploration Tests (BEFORE Fix)

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Security Vulnerabilities Exist
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected secure behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the security vulnerabilities exist
  
  - [x] 1.1 OTP Rate Limit Bypass Test
    - **Scoped PBT Approach**: Test concrete failing case - 5 OTP requests in 1 minute for same email
    - Call `send-otp` Edge Function 5 times within 60 seconds for `test@example.com`
    - Assert that requests 4 and 5 return HTTP 429 (Too Many Requests)
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (all 5 requests succeed - proves rate limiting is missing)
    - Document counterexample: "All 5 OTP requests succeeded; no rate limiting enforced"
    - _Requirements: 3.1_
  
  - [x] 1.2 Public Admin Signup Test
    - Navigate to `/admin/login` page
    - Assert that "Sign Up" tab is NOT visible
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (signup tab is visible - proves public signup is enabled)
    - Document counterexample: "Admin signup tab is publicly accessible at /admin/login"
    - _Requirements: 2.1, 2.5_
  
  - [x] 1.3 Weak Password Acceptance Test
    - Attempt to create admin account with password `"admin1"` (6 chars, no uppercase, no special char)
    - Assert that password is REJECTED with complexity error
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (weak password is accepted - proves no complexity enforcement)
    - Document counterexample: "Password 'admin1' was accepted without complexity validation"
    - _Requirements: 2.2, 2.6_
  
  - [x] 1.4 Admin Cache Manipulation Test
    - Write `{"userId":"test-user-id","isAdmin":true,"checkedAt":<current-timestamp>}` to `localStorage` key `dd_admin_access_cache_v1`
    - Attempt to access admin-only route (e.g., `/admin/dashboard`)
    - Assert that access is DENIED and RPC verification is triggered
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (admin UI is accessible - proves cache is trusted)
    - Document counterexample: "Admin UI rendered based on manipulated cache without RPC verification"
    - _Requirements: 2.3, 2.7_
  
  - [x] 1.5 Edge Function Error Leakage Test
    - Trigger error in `send-otp` Edge Function (e.g., invalid Resend API key)
    - Assert that response contains ONLY generic error message and correlation ID
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test FAILS (detailed error with stack trace returned - proves error leakage)
    - Document counterexample: "Edge Function returned stack trace: [actual error message]"
    - _Requirements: 5.1_

## Phase 2: Preservation Tests (BEFORE Fix)

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Legitimate Operations Continue Working
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for legitimate operations
  - Write property-based tests capturing observed behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  
  - [x] 2.1 Legitimate OTP Requests Preservation
    - Observe: First OTP request for `user@example.com` succeeds with HTTP 200
    - Observe: Second OTP request (after 2 minutes) succeeds with HTTP 200
    - Observe: Third OTP request (after 5 minutes) succeeds with HTTP 200
    - Write property-based test: For all OTP requests where requestCount <= 3 within 10-minute window, response status = 200 AND email is sent
    - Verify test passes on UNFIXED code
    - _Requirements: 3.1, 3.3_
  
  - [x] 2.2 Valid Admin Sign-In Preservation
    - Observe: Admin with valid credentials can sign in at `/admin/login`
    - Observe: Admin session persists across page refreshes
    - Observe: Admin can navigate between admin pages without re-authentication
    - Write property-based test: For all admins with valid credentials and is_admin=true in database, sign-in succeeds AND session persists AND admin routes are accessible
    - Verify test passes on UNFIXED code
    - _Requirements: 3.2_
  
  - [x] 2.3 Strong Password Acceptance Preservation
    - Observe: Password `"SecureP@ss123"` (12 chars, uppercase, digit, special) is accepted
    - Observe: Password `"MyAdm1n!Pass"` (12 chars, uppercase, digit, special) is accepted
    - Write property-based test: For all passwords where length >= 12 AND contains uppercase AND contains digit AND contains special char, password is accepted
    - Verify test passes on UNFIXED code
    - _Requirements: 2.2, 2.6_
  
  - [x] 2.4 Valid Redirect Navigation Preservation
    - Observe: Clicking offer with `redirect_url: "https://example.com/deal"` navigates successfully
    - Observe: Clicking offer with `redirect_url: "https://partner.com/offer"` navigates successfully
    - Write property-based test: For all URLs where scheme = "https://" AND domain in allowlist, navigation succeeds
    - Verify test passes on UNFIXED code
    - _Requirements: 3.1_
  
  - [x] 2.5 Valid Withdrawal Operations Preservation
    - Observe: Withdrawal request with valid UPI ID creates record and debits wallet
    - Observe: Withdrawal request with valid bank account (masked) creates record
    - Observe: Withdrawal history returns masked account numbers (e.g., `****1234`)
    - Write property-based test: For all withdrawal requests with valid payment details, record is created AND wallet is debited AND returned data is masked
    - Verify test passes on UNFIXED code
    - _Requirements: 3.4_
  
  - [x] 2.6 Chart Rendering Preservation
    - Observe: `ChartContainer` with valid color config renders correctly
    - Observe: CSS variables are applied without errors
    - Write property-based test: For all chart configs with valid color values, chart renders AND CSS variables are applied
    - Verify test passes on UNFIXED code
    - _Requirements: 3.5_
  
  - [x] 2.7 Session Persistence Preservation
    - Observe: User signs in and session persists across page refresh
    - Observe: Session context (shopId, batchId, qrType) persists during QR scan flow
    - Write property-based test: For all valid sign-ins, session persists across refresh AND context keys are preserved
    - Verify test passes on UNFIXED code
    - _Requirements: 3.6, 3.9_

## Phase 3: Implementation

- [x] 3. Implement OTP rate limiting (server-side)

  - [x] 3.1 Add OTP rate limit database index
    - Create migration file `supabase/migrations/20260418000003_security_hardening.sql`
    - Add index: `CREATE INDEX IF NOT EXISTS idx_otp_codes_email_created_at ON public.otp_codes (email, created_at DESC) WHERE used = false;`
    - Run migration to apply index
    - _Bug_Condition: isBugCondition_OtpRateLimit(email, requestCount, windowMs) where requestCount > 3 AND windowMs <= 600000_
    - _Expected_Behavior: sendOtp'(email) returns HTTP 429 when rate limit exceeded_
    - _Preservation: Legitimate OTP requests (count <= 3 in 10 min) continue to work_
    - _Requirements: 3.1_

  - [x] 3.2 Implement rate limiting logic in send-otp Edge Function
    - Open `supabase/functions/send-otp/index.ts`
    - Add TypeScript type definitions: `/// <reference types="https://deno.land/x/types/index.d.ts" />` at top of file
    - Before generating OTP, query `otp_codes` table for recent requests:
      - Count rows where `email = normalizedEmail AND created_at > (now() - interval '10 minutes')`
      - If count >= 3, return `{ error: "Too many OTP requests. Please try again in 10 minutes.", status: 429 }`
    - Use Supabase REST API with service role key to query `otp_codes` table
    - _Bug_Condition: isBugCondition_OtpRateLimit(email, requestCount, windowMs)_
    - _Expected_Behavior: HTTP 429 returned when rate limit exceeded_
    - _Preservation: Requests within limit continue to send OTP emails_
    - _Requirements: 3.1_

  - [x] 3.3 Add generic error responses to send-otp
    - Wrap all error returns in generic messages: `"An error occurred. Please try again. (Ref: <correlation-id>)"`
    - Generate correlation ID using `crypto.randomUUID()`
    - Log full error details server-side only with correlation ID
    - _Bug_Condition: Edge Function returns detailed error messages_
    - _Expected_Behavior: Generic error message with correlation ID returned to client_
    - _Preservation: Error handling flow continues to work_
    - _Requirements: 5.1_

  - [x] 3.4 Verify OTP rate limit exploration test now passes
    - **Property 1: Expected Behavior** - OTP Rate Limiting Enforced
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - Run OTP rate limit bypass test from step 1.1
    - **EXPECTED OUTCOME**: Test PASSES (requests 4 and 5 return HTTP 429 - confirms rate limiting works)
    - _Requirements: 3.1_

- [x] 4. Remove admin signup tab and enforce password complexity

  - [x] 4.1 Locate or create AdminLogin component
    - Search for `AdminLogin` component (likely in `src/pages/admin/AdminLogin.tsx` or similar)
    - If not found, search for admin login UI in `src/components/admin/` or `src/pages/`
    - Document the file path for next steps
    - _Requirements: 2.1, 2.5_

  - [x] 4.2 Remove admin signup tab
    - Remove `<TabsTrigger value="signup">Sign Up</TabsTrigger>` element
    - Remove entire `<TabsContent value="signup">` section
    - Keep only the sign-in tab and form
    - _Bug_Condition: isBugCondition_PublicAdminSignup(request) where invite_token is null_
    - _Expected_Behavior: Signup tab is not visible; only sign-in form is accessible_
    - _Preservation: Valid admin sign-in continues to work_
    - _Requirements: 2.1, 2.5_

  - [x] 4.3 Add password complexity validation
    - Add client-side validation function before calling `supabase.auth.signIn()`:
      - Check password length >= 12
      - Check password contains at least one uppercase letter: `/[A-Z]/`
      - Check password contains at least one digit: `/[0-9]/`
      - Check password contains at least one special character: `/[!@#$%^&*(),.?":{}|<>]/`
    - Display error toast if validation fails: "Password must be at least 12 characters and include uppercase, digit, and special character"
    - _Bug_Condition: isBugCondition_WeakPassword(password) where length < 12 OR missing complexity_
    - _Expected_Behavior: Weak passwords are rejected with descriptive error_
    - _Preservation: Strong passwords continue to be accepted_
    - _Requirements: 2.2, 2.6_

  - [x] 4.4 Verify admin signup and password tests now pass
    - **Property 1: Expected Behavior** - Admin Signup Removed and Password Complexity Enforced
    - **IMPORTANT**: Re-run the SAME tests from tasks 1.2 and 1.3 - do NOT write new tests
    - Run public admin signup test from step 1.2
    - Run weak password acceptance test from step 1.3
    - **EXPECTED OUTCOME**: Both tests PASS (signup tab is hidden, weak passwords are rejected)
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [x] 5. Harden admin cache verification

  - [x] 5.1 Add verifySensitiveAction function to AdminAuthContext
    - Open `src/contexts/AdminAuthContext.tsx`
    - Add new function `verifySensitiveAction()`:
      - Always calls `checkIsAdminRpc()` regardless of cache freshness
      - Returns boolean indicating admin status
      - Used before any state-mutating admin operation
    - Export function from context
    - _Bug_Condition: isBugCondition_AdminCacheManipulation(cache, dbStatus) where cache.isAdmin=true AND dbStatus=false_
    - _Expected_Behavior: All sensitive actions re-verify admin status via RPC_
    - _Preservation: Valid admin operations continue to work without repeated re-auth on every route change_
    - _Requirements: 2.3, 2.7_

  - [x] 5.2 Reduce admin cache TTL
    - Open `src/lib/adminAuthCache.ts`
    - Change `ADMIN_CACHE_TTL_MS` from 5 minutes (300000) to 2 minutes (120000)
    - Add comment: "Reduced TTL for faster revocation of admin access"
    - _Bug_Condition: Cache is trusted for too long (5 minutes)_
    - _Expected_Behavior: Cache expires after 2 minutes, forcing re-verification_
    - _Preservation: Admin UX remains smooth with 2-minute cache_
    - _Requirements: 2.3, 2.7_

  - [x] 5.3 Integrate verifySensitiveAction in admin operations
    - Search for admin state-mutating operations (approve social profile, update task, etc.)
    - Add `verifySensitiveAction()` call before each operation
    - If verification fails, show error toast and abort operation
    - Example locations: `useAdmin.ts`, admin page components
    - _Bug_Condition: Sensitive actions trust cache without re-verification_
    - _Expected_Behavior: All sensitive actions verify admin status via RPC_
    - _Preservation: Valid admin operations continue to work_
    - _Requirements: 2.3, 2.7_

  - [x] 5.4 Verify admin cache manipulation test now passes
    - **Property 1: Expected Behavior** - Admin Cache Never Grants Access
    - **IMPORTANT**: Re-run the SAME test from task 1.4 - do NOT write a new test
    - Run admin cache manipulation test from step 1.4
    - **EXPECTED OUTCOME**: Test PASSES (access is denied, RPC verification is triggered)
    - _Requirements: 2.3, 2.7_

- [x] 6. Add TypeScript types and generic errors to verify-otp Edge Function

  - [x] 6.1 Update verify-otp Edge Function
    - Open `supabase/functions/verify-otp/index.ts`
    - Add TypeScript type definitions: `/// <reference types="https://deno.land/x/types/index.d.ts" />` at top of file
    - Remove unused `linkRes` variable
    - Wrap all error returns in generic messages with correlation IDs
    - Log full error details server-side only
    - _Bug_Condition: Edge Function returns detailed error messages_
    - _Expected_Behavior: Generic error messages with correlation IDs_
    - _Preservation: OTP verification flow continues to work_
    - _Requirements: 5.1_

  - [x] 6.2 Verify edge function error leakage test now passes
    - **Property 1: Expected Behavior** - Generic Error Messages Only
    - **IMPORTANT**: Re-run the SAME test from task 1.5 - do NOT write a new test
    - Run edge function error leakage test from step 1.5
    - **EXPECTED OUTCOME**: Test PASSES (only generic error message and correlation ID returned)
    - _Requirements: 5.1_

- [x] 7. Create .env.example file

  - [x] 7.1 Create environment variable template
    - Create new file `.env.example` in project root
    - Add all required and optional environment variables:
      ```
      # Supabase Configuration (REQUIRED)
      VITE_SUPABASE_URL=https://your-project.supabase.co
      VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
      
      # Resend API (REQUIRED for OTP emails)
      RESEND_API_KEY=re_your_api_key_here
      FROM_EMAIL=noreply@yourdomain.com
      
      # Google Analytics (OPTIONAL)
      VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
      ```
    - Add comments explaining each variable's purpose
    - _Bug_Condition: No template for required environment variables_
    - _Expected_Behavior: .env.example file guides developers on required config_
    - _Preservation: Existing .env files continue to work_
    - _Requirements: 5.5_

- [x] 8. Update SECURITY_SETUP.md documentation

  - [x] 8.1 Document HSTS configuration
    - Open `SECURITY_SETUP.md`
    - Add section: "HSTS Configuration"
    - Document that HSTS header must be configured at hosting provider level (Vercel, Netlify, etc.)
    - Provide example configurations for common hosting providers
    - Add note in `index.html`: `<!-- HSTS header must be configured at hosting provider level -->`
    - _Bug_Condition: HSTS header is missing_
    - _Expected_Behavior: HSTS configuration is documented_
    - _Preservation: Existing HTTPS setup continues to work_
    - _Requirements: 5.4_

  - [x] 8.2 Document CSRF protection
    - Add section: "CSRF Protection"
    - Confirm that Supabase handles CSRF via SameSite cookies
    - Document that all state-mutating requests include anti-CSRF tokens
    - Reference Supabase documentation on CSRF protection
    - _Bug_Condition: CSRF protection is undocumented_
    - _Expected_Behavior: CSRF protection is documented and verified_
    - _Preservation: Existing CSRF protection continues to work_
    - _Requirements: 5.6_

  - [x] 8.3 Document admin provisioning process
    - Add section: "Admin Account Provisioning"
    - Document that admin accounts must be created via Supabase SQL Editor (out-of-band)
    - Provide SQL template: `UPDATE auth.users SET is_admin = true WHERE email = 'admin@example.com';`
    - Document that public admin signup is disabled for security
    - _Bug_Condition: Admin provisioning process is undocumented_
    - _Expected_Behavior: Admin provisioning is documented_
    - _Preservation: Existing admin accounts continue to work_
    - _Requirements: 2.1, 2.5_

## Phase 4: Final Verification

- [x] 9. Verify all preservation tests still pass
  - **Property 2: Preservation** - No Regressions Introduced
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run all preservation property tests from step 2
  - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
  - Verify:
    - Legitimate OTP requests (count <= 3 in 10 min) continue to work
    - Valid admin sign-in and navigation continue to work
    - Strong passwords continue to be accepted
    - Valid redirect URLs continue to navigate correctly
    - Valid withdrawal operations continue to work
    - Chart rendering continues to work
    - Session persistence continues to work
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9_

- [x] 10. Checkpoint - Ensure all tests pass
  - Run full test suite (exploration tests + preservation tests)
  - Verify all exploration tests now PASS (bugs are fixed)
  - Verify all preservation tests still PASS (no regressions)
  - If any test fails, investigate and fix before proceeding
  - Ask the user if questions arise or if additional security concerns are identified
