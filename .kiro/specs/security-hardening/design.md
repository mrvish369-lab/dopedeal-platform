# Security Hardening Bugfix Design

## Overview

This design addresses 18 security vulnerabilities identified across the DopeDeal platform (React 18 + TypeScript + Vite + Supabase). The vulnerabilities span five critical areas: unvalidated redirects & XSS injection, admin access control weaknesses, authentication & session security gaps, plaintext financial data exposure, and missing hardening/observability controls.

The fix strategy follows a defense-in-depth approach:
- **Input validation** at all trust boundaries (URL schemes, email formats, OTP codes)
- **Rate limiting** for OTP requests (client + server-side)
- **Data masking** for sensitive financial identifiers
- **Access control hardening** for admin routes (cache treated as UX hint only)
- **CSP enforcement** already in place (verified in `index.html`)
- **Error boundary** already in place (verified in `main.tsx`)
- **Environment validation** already in place (verified in `main.tsx`)

**Key Insight**: Many hardening controls are already implemented. This design focuses on the remaining gaps: OTP rate limiting (server-side), admin signup removal, password complexity enforcement, and financial data masking improvements.

## Glossary

- **Bug_Condition (C)**: The condition that triggers a security vulnerability
- **Property (P)**: The desired secure behavior when the bug condition is met
- **Preservation**: Existing functionality that must remain unchanged by the security fixes
- **safeNavigate**: URL validation utility in `src/lib/urlValidation.ts` that blocks dangerous schemes
- **OTP**: One-Time Password sent via email for passwordless authentication
- **Rate Limit**: Server-side throttle preventing abuse (3 OTP requests per email per 10-minute window)
- **Admin Cache**: Client-side performance hint stored in `sessionStorage` (5-minute TTL, never trusted for authorization)
- **Masking**: Technique to hide sensitive data (e.g., `****1234` for bank account numbers)
- **CSP**: Content Security Policy header that restricts script/connect/frame sources
- **RLS**: Row Level Security policies in Supabase that enforce data access rules

## Bug Details

### Bug Condition

The security vulnerabilities manifest across five areas:

**Area 1 — Unvalidated Redirects & XSS Injection**

The bug manifests when user-controlled URLs are navigated to without validation, or when CSS variables are injected without sanitization. The `OfferBanner.tsx` and `OfferCardSlider.tsx` components call `window.location.href` or `window.open` with unvalidated URLs, and the `ChartStyle` component injects CSS variables that could contain malicious content.

**Status**: ✅ **ALREADY FIXED** — `safeNavigate()` utility exists and is used in `OfferBanner.tsx`. `ChartStyle` component uses `SafeStyle` with ref-based injection and `sanitizeColor()` validation. CSP header is present in `index.html`.

**Formal Specification:**
```
FUNCTION isBugCondition_UnvalidatedRedirect(url)
  INPUT: url of type string
  OUTPUT: boolean
  
  RETURN NOT isUrlSafe(url)
         AND (url starts with "javascript:" OR url starts with "data:" OR url protocol != "https:")
END FUNCTION

FUNCTION isBugCondition_XSSInjection(cssValue)
  INPUT: cssValue of type string
  OUTPUT: boolean
  
  RETURN cssValue contains [;{}\\<>]
         OR NOT (cssValue matches hex OR cssValue matches rgb/rgba/hsl/hsla OR cssValue matches CSS variable)
END FUNCTION
```

**Area 2 — Admin Access Control**

The bug manifests when an unauthenticated visitor can create an admin account via the public signup form at `/admin/login`, or when weak passwords (6 characters, no complexity) are accepted, or when the admin cache in `sessionStorage` is trusted for authorization decisions.

**Formal Specification:**
```
FUNCTION isBugCondition_PublicAdminSignup(request)
  INPUT: request of type AdminSignupRequest
  OUTPUT: boolean
  
  RETURN request.invite_token is null OR request.invite_token is empty
         OR NOT server_validates_invite_token(request.invite_token)
END FUNCTION

FUNCTION isBugCondition_WeakPassword(password)
  INPUT: password of type string
  OUTPUT: boolean
  
  RETURN password.length < 12
         OR NOT password contains uppercase
         OR NOT password contains digit
         OR NOT password contains special character
END FUNCTION

FUNCTION isBugCondition_AdminCacheManipulation(cacheValue, actualDbAdminStatus)
  INPUT: cacheValue of type AdminAccessCache, actualDbAdminStatus of type boolean
  OUTPUT: boolean
  
  RETURN cacheValue.isAdmin = true AND actualDbAdminStatus = false
END FUNCTION
```

**Area 3 — Authentication & Session Security**

The bug manifests when `sendOtp()` is called repeatedly without server-side rate limiting, allowing email spam and OTP brute-force attacks. The client-side 60-second cooldown exists but can be bypassed.

**Status**: Client-side cooldown ✅ **ALREADY IMPLEMENTED** in `AuthContext.tsx`. Server-side rate limit ❌ **MISSING** in `send-otp/index.ts`.

**Formal Specification:**
```
FUNCTION isBugCondition_OtpRateLimit(email, requestCount, windowMs)
  INPUT: email string, requestCount integer, windowMs integer
  OUTPUT: boolean
  
  RETURN requestCount > 3 AND windowMs <= 600000  // 3 requests per 10 minutes
END FUNCTION
```

**Area 4 — Financial Data Protection**

The bug manifests when `submitWithdrawalRequest()` stores bank account numbers and IFSC codes in plaintext, or when `getWithdrawalHistory()` returns unmasked values to the client.

**Status**: ✅ **ALREADY FIXED** — `maskAccountNumber()` and `maskIfsc()` functions exist in `wallet.ts` and are applied at write time and defensively at read time.

**Formal Specification:**
```
FUNCTION isBugCondition_PlaintextFinancialData(withdrawalPayload)
  INPUT: withdrawalPayload of type WithdrawalRequest
  OUTPUT: boolean
  
  RETURN withdrawalPayload.bank_account_no is NOT null
         AND withdrawalPayload.bank_account_no is NOT masked
         AND withdrawalPayload.bank_account_no is NOT encrypted
END FUNCTION
```

**Area 5 — Hardening, Observability & Resilience**

The bug manifests when Edge Functions return detailed error messages to clients, when audit logs can be tampered with, when session/event data accumulates without retention policies, when HSTS headers are missing, when `.env.example` is absent, or when CSRF protection is undocumented.

**Status**: 
- ✅ **ALREADY FIXED**: Error boundary in `main.tsx`, environment validation in `main.tsx`, CSP in `index.html`
- ❌ **MISSING**: HSTS header, `.env.example` file, audit log hash chaining, data retention policies, generic error responses in Edge Functions

### Examples

**Example 1: Unvalidated Redirect (ALREADY FIXED)**
- **Input**: `OfferBanner` with `redirect_url: "javascript:alert('XSS')"`
- **Current Behavior**: `safeNavigate()` blocks the navigation and logs a warning
- **Expected Behavior**: Navigation is blocked ✅

**Example 2: Public Admin Signup (NEEDS FIX)**
- **Input**: Visitor navigates to `/admin/login` and clicks "Sign Up" tab
- **Current Behavior**: Signup form is visible and functional
- **Expected Behavior**: Signup tab should be removed; admin accounts provisioned out-of-band only

**Example 3: Weak Admin Password (NEEDS FIX)**
- **Input**: Admin sets password `"admin1"` (6 characters, no uppercase, no special char)
- **Current Behavior**: Password is accepted
- **Expected Behavior**: Password should be rejected with error message

**Example 4: OTP Rate Limit Bypass (NEEDS FIX)**
- **Input**: Attacker calls `send-otp` Edge Function 10 times in 1 minute for same email
- **Current Behavior**: All 10 OTP emails are sent (client cooldown can be bypassed via direct API calls)
- **Expected Behavior**: After 3 requests in 10 minutes, server returns HTTP 429

**Example 5: Plaintext Bank Account (ALREADY FIXED)**
- **Input**: User submits withdrawal with `bank_account_no: "123456789012"`
- **Current Behavior**: Stored as `"****9012"` in database
- **Expected Behavior**: Masked storage ✅

**Example 6: Admin Cache Manipulation (NEEDS FIX)**
- **Input**: Attacker writes `{"userId":"victim-id","isAdmin":true,"checkedAt":<now>}` to `sessionStorage`
- **Current Behavior**: Cache is used as UX hint but background RPC re-verification occurs
- **Expected Behavior**: Cache should NEVER grant access; all sensitive actions must re-verify via RPC

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Valid `https://` redirect URLs from permitted domains must continue to navigate users without interruption
- Admins with valid sessions and confirmed `is_admin = true` database role must continue to access admin pages without repeated re-authentication on every route change
- Legitimate users submitting email for OTP login must continue to receive OTP emails within the rate-limit window
- Users completing withdrawal requests with valid UPI or bank details must continue to create withdrawal records
- `ChartContainer` rendering analytics charts must continue to apply correct CSS color variables
- Users signing in successfully must continue to persist sessions across page refreshes
- Admins signing out must continue to clear admin cache and redirect to `/admin/login`
- Application booting with all required environment variables must continue to initialize normally
- Session context (shopId, batchId, qrType) set during QR scan flows must continue to persist correctly
- `send-otp` Edge Function called within rate-limit window must continue to deliver OTP emails

**Scope:**
All inputs that do NOT involve the specific bug conditions (malicious URLs, weak passwords, rate-limit abuse, plaintext financial data) should be completely unaffected by this fix. This includes:
- Normal user authentication flows
- Valid admin operations
- Legitimate withdrawal requests
- Standard navigation and routing
- Chart rendering with safe CSS values

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing Server-Side OTP Rate Limiting**: The `send-otp` Edge Function has no rate-limiting logic. It generates and sends OTP emails on every request without checking request frequency per email address.

2. **Public Admin Signup Form**: The `/admin/login` page includes a "Sign Up" tab that calls `supabase.auth.signUp()` without any invite token verification or domain restriction.

3. **Weak Password Policy**: The admin signup form enforces only a 6-character minimum with no complexity requirements (uppercase, digit, special character).

4. **Admin Cache Trust**: While `AdminAuthContext` performs background re-verification, the cache is still read and trusted for initial UI rendering, creating a window where manipulated cache values could grant temporary access.

5. **Missing HSTS Header**: The application serves over HTTPS but does not include a `Strict-Transport-Security` header, allowing browsers to connect over HTTP on first visit.

6. **Missing `.env.example` File**: No template file exists to guide developers on required environment variables.

7. **Verbose Edge Function Errors**: Edge Functions may return detailed error messages (stack traces, query details) to clients instead of generic error messages with correlation IDs.

8. **No Audit Log Tamper Protection**: Admin action logs are stored in a standard table with no hash chaining or append-only enforcement.

9. **No Data Retention Policies**: Sessions and events accumulate indefinitely with no automated purge mechanism.

## Correctness Properties

Property 1: Bug Condition - OTP Rate Limiting

_For any_ OTP request where the same email address has already received 3 or more OTP codes within the past 10 minutes, the fixed `send-otp` Edge Function SHALL return HTTP 429 (Too Many Requests) and SHALL NOT send an additional OTP email, preventing email spam and brute-force attacks.

**Validates: Requirements 3.1**

Property 2: Bug Condition - Admin Signup Removal

_For any_ visitor attempting to access the admin signup form at `/admin/login`, the fixed application SHALL NOT display a "Sign Up" tab or signup form, and SHALL only allow sign-in with pre-provisioned admin credentials, preventing unauthorized admin account creation.

**Validates: Requirements 2.1, 2.5**

Property 3: Bug Condition - Password Complexity Enforcement

_For any_ admin password submission where the password does not meet complexity requirements (minimum 12 characters, at least one uppercase letter, one digit, one special character), the fixed application SHALL reject the password with a descriptive error message before calling `supabase.auth.signUp()`.

**Validates: Requirements 2.2, 2.6**

Property 4: Bug Condition - Admin Cache Verification

_For any_ admin action requiring authorization, the fixed `AdminAuthContext` SHALL re-verify admin status via the `is_admin` RPC call and SHALL NOT grant access based solely on a cached `isAdmin: true` value, preventing cache manipulation attacks.

**Validates: Requirements 2.3, 2.7**

Property 5: Preservation - Valid Redirects

_For any_ redirect URL that passes `isUrlSafe()` validation (https:// scheme, no blocked schemes, valid domain), the fixed application SHALL navigate to the URL exactly as before, preserving existing offer click-through functionality.

**Validates: Requirements 3.1**

Property 6: Preservation - Admin Session Persistence

_For any_ admin with a valid session and confirmed `is_admin = true` database role, the fixed application SHALL continue to allow navigation between admin pages without requiring repeated re-authentication on every route change, preserving the existing UX.

**Validates: Requirements 3.2**

Property 7: Preservation - Legitimate OTP Requests

_For any_ OTP request where the email address has received fewer than 3 OTP codes in the past 10 minutes, the fixed `send-otp` Edge Function SHALL send the OTP email and return a success response exactly as before, preserving existing authentication flows.

**Validates: Requirements 3.3**

Property 8: Preservation - Withdrawal Functionality

_For any_ withdrawal request with valid UPI or bank details, the fixed application SHALL create the withdrawal record and debit the wallet transaction exactly as before, preserving existing financial operations.

**Validates: Requirements 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/functions/send-otp/index.ts`

**Function**: `Deno.serve()` handler

**Specific Changes**:
1. **Add OTP Rate Limiting Table Query**: Before generating OTP, query `otp_codes` table for recent requests
   - Count rows where `email = normalizedEmail AND created_at > (now() - interval '10 minutes')`
   - If count >= 3, return `{ error: "Too many OTP requests. Please try again in 10 minutes.", status: 429 }`
   - Implementation: Use Supabase REST API with service role key to query `otp_codes` table

2. **Add TypeScript Type Definitions**: Add `/// <reference types="https://deno.land/x/types/index.d.ts" />` at top of file to fix Deno type errors

3. **Generic Error Responses**: Wrap all error returns in generic messages
   - Replace detailed error messages with `"An error occurred. Please try again. (Ref: <correlation-id>)"`
   - Log full error details server-side only

**File**: `supabase/functions/verify-otp/index.ts`

**Function**: `Deno.serve()` handler

**Specific Changes**:
1. **Add TypeScript Type Definitions**: Add `/// <reference types="https://deno.land/x/types/index.d.ts" />` at top of file

2. **Remove Unused Variable**: Remove `linkRes` variable (currently unused)

3. **Generic Error Responses**: Wrap all error returns in generic messages with correlation IDs

**File**: `src/pages/admin/AdminLogin.tsx` (needs to be located/created)

**Component**: `AdminLogin`

**Specific Changes**:
1. **Remove Signup Tab**: Remove the `<TabsTrigger value="signup">Sign Up</TabsTrigger>` element
   - Remove the entire `<TabsContent value="signup">` section
   - Keep only the sign-in tab and form

2. **Add Password Complexity Validation**: Add client-side validation before calling `supabase.auth.signIn()`
   - Check password length >= 12
   - Check password contains at least one uppercase letter: `/[A-Z]/`
   - Check password contains at least one digit: `/[0-9]/`
   - Check password contains at least one special character: `/[!@#$%^&*(),.?":{}|<>]/`
   - Display error toast if validation fails

**File**: `src/contexts/AdminAuthContext.tsx`

**Function**: `checkAuth()`

**Specific Changes**:
1. **Force RPC Verification on Sensitive Actions**: Add a new `verifySensitiveAction()` function
   - Always calls `checkIsAdminRpc()` regardless of cache freshness
   - Returns boolean indicating admin status
   - Used before any state-mutating admin operation (approve social profile, update task, etc.)

2. **Reduce Cache TTL**: Change `ADMIN_CACHE_TTL_MS` from 5 minutes to 2 minutes in `adminAuthCache.ts`
   - Faster revocation of admin access if role is removed

**File**: `index.html`

**Element**: `<head>`

**Specific Changes**:
1. **Add HSTS Header**: Add meta tag for HSTS (note: meta tags don't support HSTS, so this must be done server-side)
   - **Alternative**: Document that HSTS must be configured at the hosting level (Vercel, Netlify, etc.)
   - Add comment in `index.html`: `<!-- HSTS header must be configured at hosting provider level -->`

**File**: `.env.example` (NEW FILE)

**Specific Changes**:
1. **Create Environment Variable Template**: Create new file with all required and optional variables
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

**File**: `supabase/migrations/20260418000003_security_hardening.sql` (NEW FILE)

**Specific Changes**:
1. **Add OTP Rate Limit Index**: Create index for efficient rate limit queries
   ```sql
   CREATE INDEX IF NOT EXISTS idx_otp_codes_email_created_at 
     ON public.otp_codes (email, created_at DESC) 
     WHERE used = false;
   ```

2. **Add Audit Log Hash Chaining** (OPTIONAL - complex, may defer):
   ```sql
   ALTER TABLE public.admin_audit_log ADD COLUMN prev_hash text;
   CREATE OR REPLACE FUNCTION compute_audit_hash(entry_data jsonb, prev_hash text) 
     RETURNS text AS $$ ... $$ LANGUAGE plpgsql;
   ```

3. **Add Data Retention Policy** (OPTIONAL - complex, may defer):
   ```sql
   -- Scheduled job to purge old sessions (90 days)
   -- Scheduled job to purge old events (180 days)
   ```

**File**: `SECURITY_SETUP.md` (UPDATE)

**Specific Changes**:
1. **Document CSRF Protection**: Add section confirming Supabase handles CSRF via SameSite cookies
2. **Document HSTS Configuration**: Add instructions for enabling HSTS at hosting provider level
3. **Document Admin Provisioning**: Add instructions for creating admin accounts via Supabase SQL Editor

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach: first, write exploratory tests that demonstrate the bugs on unfixed code; second, implement the fixes; third, verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fixes. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate attack scenarios and assert that the unfixed code allows the attacks. Run these tests on the UNFIXED code to observe failures and understand the root causes.

**Test Cases**:
1. **OTP Rate Limit Bypass Test**: Call `send-otp` Edge Function 5 times in 1 minute for same email (will succeed on unfixed code, should fail after 3rd request on fixed code)
2. **Public Admin Signup Test**: Navigate to `/admin/login` and verify "Sign Up" tab is visible (will pass on unfixed code, should fail on fixed code)
3. **Weak Password Test**: Submit admin password `"admin1"` and verify it's accepted (will pass on unfixed code, should fail on fixed code)
4. **Admin Cache Manipulation Test**: Write `{"userId":"test","isAdmin":true,"checkedAt":<now>}` to `sessionStorage` and verify admin UI is accessible (will pass on unfixed code, should fail on fixed code)

**Expected Counterexamples**:
- OTP emails are sent without rate limiting
- Admin signup form is publicly accessible
- Weak passwords are accepted
- Admin cache grants temporary UI access

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected secure behavior.

**Pseudocode:**
```
FOR ALL (email, requestCount, window) WHERE isBugCondition_OtpRateLimit(email, requestCount, window) DO
  result := sendOtp_fixed(email)
  ASSERT result.status = 429 AND no_email_sent(result)
END FOR

FOR ALL request WHERE isBugCondition_PublicAdminSignup(request) DO
  result := renderAdminLogin_fixed()
  ASSERT NOT result.hasSignupTab
END FOR

FOR ALL password WHERE isBugCondition_WeakPassword(password) DO
  result := validatePassword_fixed(password)
  ASSERT result.isValid = false AND result.error contains "complexity"
END FOR

FOR ALL (cache, dbStatus) WHERE isBugCondition_AdminCacheManipulation(cache, dbStatus) DO
  result := checkAdminAccess_fixed(cache, dbStatus)
  ASSERT result.isAdmin = false AND access_denied(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL (email, requestCount, window) WHERE NOT isBugCondition_OtpRateLimit(email, requestCount, window) DO
  ASSERT sendOtp_original(email).status = sendOtp_fixed(email).status
END FOR

FOR ALL url WHERE isUrlSafe(url) DO
  ASSERT safeNavigate_original(url) = safeNavigate_fixed(url)
END FOR

FOR ALL admin WHERE admin.isAdmin = true AND admin.sessionValid = true DO
  ASSERT adminAccess_original(admin) = adminAccess_fixed(admin)
END FOR

FOR ALL withdrawal WHERE withdrawal.isValid = true DO
  ASSERT submitWithdrawal_original(withdrawal).status = submitWithdrawal_fixed(withdrawal).status
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for legitimate operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Legitimate OTP Requests**: Verify that OTP requests within rate limit continue to work (1st, 2nd, 3rd request in 10-minute window)
2. **Valid Admin Sign-In**: Verify that existing admin accounts can still sign in after signup tab is removed
3. **Strong Password Acceptance**: Verify that passwords meeting complexity requirements are still accepted
4. **Valid Admin Operations**: Verify that admins with valid sessions can still perform all admin actions
5. **Valid Redirects**: Verify that `https://` URLs from permitted domains still navigate correctly
6. **Valid Withdrawals**: Verify that withdrawal requests with valid UPI/bank details still create records

### Unit Tests

- Test `send-otp` Edge Function with various request frequencies (0, 1, 2, 3, 4, 5 requests in 10 minutes)
- Test password validation function with various password strengths
- Test admin cache verification logic with manipulated cache values
- Test URL validation with various schemes (https, http, javascript, data)
- Test bank account masking with various account number formats

### Property-Based Tests

- Generate random email addresses and request timestamps to verify OTP rate limiting across many scenarios
- Generate random passwords and verify complexity validation catches all weak passwords
- Generate random admin cache values and verify authorization always checks database
- Generate random URLs and verify safe navigation preserves valid redirects while blocking dangerous ones
- Generate random bank account numbers and verify masking always hides sensitive digits

### Integration Tests

- Test full OTP authentication flow with rate limiting (request OTP, verify OTP, sign in)
- Test full admin authentication flow with signup tab removed (sign in, navigate admin pages, sign out)
- Test full withdrawal flow with masked bank details (submit request, view history, verify masking)
- Test full offer click-through flow with URL validation (click offer, verify navigation or blocking)
- Test admin cache manipulation attack (write malicious cache, attempt admin action, verify denial)

