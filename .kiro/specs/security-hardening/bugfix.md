# Bugfix Requirements Document

## Introduction

DopeDeal is a gamified rewards and deals marketplace (React 18 + TypeScript + Vite + Supabase) where users earn coins via quizzes, social tasks, and referrals, then redeem or withdraw via UPI/bank transfer. A deep security audit identified 18 vulnerabilities and bugs spanning critical, high, medium, and low severity. This document captures the defective behaviors, the correct behaviors that must replace them, and the existing behaviors that must be preserved without regression.

The issues are grouped into five logical areas:
1. Redirect & XSS Injection (Critical)
2. Admin Access Control (Critical)
3. Authentication & Session Security (High)
4. Financial Data Protection (High)
5. Hardening, Observability & Resilience (Medium/Low)

---

## Bug Analysis

### Current Behavior (Defect)

#### Area 1 — Unvalidated Redirects & XSS Injection

1.1 WHEN a user clicks a CTA in `OfferBanner.tsx` THEN the system executes `window.location.href = content.redirect_url` with no URL validation, allowing any attacker-controlled URL (including `javascript:` schemes and external phishing domains) to be navigated to

1.2 WHEN a user clicks a card in `OfferCardSlider.tsx` and the parent calls `window.location.href = card.redirect_url` THEN the system navigates to the unvalidated URL without checking the scheme or domain allowlist

1.3 WHEN the `ChartStyle` component in `chart.tsx` renders CSS variables THEN the system injects them via `dangerouslySetInnerHTML` using values sourced from the `ChartConfig` prop, which could contain attacker-controlled strings if config is ever derived from user input or a compromised data source

1.4 WHEN no Content Security Policy header is present in `index.html` or the server response THEN the system provides no browser-enforced barrier against inline script execution, data exfiltration, or injected third-party resources

#### Area 2 — Admin Access Control

2.1 WHEN any unauthenticated visitor navigates to `/admin/login` THEN the system displays a "Sign Up" tab that calls `supabase.auth.signUp()` with only an email and a 6-character minimum password, creating a Supabase auth account with no invite verification, no domain restriction, and no admin role assignment

2.2 WHEN an admin account is created via the public signup form THEN the system does not enforce any password complexity beyond a 6-character minimum (no uppercase, no digit, no special character requirement)

2.3 WHEN the `AdminAuthContext` reads the admin cache from `localStorage` key `dd_admin_access_cache_v1` THEN the system trusts the cached `isAdmin: true` value for up to 30 minutes without re-verifying against the database, meaning an XSS payload that writes `{"userId":"<victim-id>","isAdmin":true,"checkedAt":<now>}` to that key can grant client-side admin UI access until the next forced RPC check

#### Area 3 — Authentication & Session Security

3.1 WHEN a user calls `sendOtp()` in `AuthContext.tsx` repeatedly THEN the system invokes the `send-otp` Edge Function on every call with no client-side or server-enforced rate limit, enabling email spam and OTP brute-force attacks

3.2 WHEN the Supabase client is initialised in `client.ts` THEN the system stores the auth session (JWT access token and refresh token) in `localStorage` via `safeBrowserStorage`, making the tokens accessible to any JavaScript running on the page in the event of an XSS attack

3.3 WHEN session IDs and anonymous IDs are written by `session.ts` THEN the system stores them in plaintext `localStorage` keys (`dopedeal_session_id`, `dopedeal_anonymous_id`, etc.) with no expiry enforcement beyond an in-memory TTL check, leaving them readable by any script on the page

3.4 WHEN a user signs out via `AuthContext.signOut()` THEN the system clears `user`, `session`, `wallet`, and `isVerified` state but does not clear session-related `localStorage` keys (`dopedeal_session_id`, `dopedeal_session_created_at`, `dopedeal_anonymous_id`, and all `dopedeal_session_*` context keys), leaving stale session data accessible after logout

3.5 WHEN the application starts in `main.tsx` THEN the system does not validate that required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.) are present, allowing the app to boot silently with undefined configuration and produce cryptic runtime errors

3.6 WHEN no React Error Boundary wraps the auth or routing tree THEN the system allows an unhandled exception in `AuthContext` or `AdminAuthContext` to propagate and crash the entire application, showing a blank screen with no recovery path

#### Area 4 — Financial Data Protection

4.1 WHEN `submitWithdrawalRequest()` in `wallet.ts` inserts a withdrawal record THEN the system stores `bank_account_no` and `bank_ifsc` as plaintext strings directly in the `dd_withdrawal_requests` table with no encryption or masking

4.2 WHEN `getWithdrawalHistory()` returns records to the client THEN the system returns the full plaintext `bank_account_no` and `bank_ifsc` values in the API response, exposing sensitive financial identifiers to the browser

#### Area 5 — Hardening, Observability & Resilience

5.1 WHEN Supabase Edge Functions encounter errors THEN the system returns detailed internal error messages (stack traces, query details, or internal identifiers) in the HTTP response body, leaking implementation details to clients

5.2 WHEN admin actions are recorded in the audit log THEN the system writes log entries to a standard database table with no tamper-evident mechanism (no hash chaining, no append-only enforcement), allowing log entries to be silently modified or deleted

5.3 WHEN sessions and events accumulate in the `sessions` and `events` tables THEN the system has no automated data retention or purge policy, causing unbounded table growth and creating GDPR/data-minimisation compliance risk

5.4 WHEN HTTPS enforcement is required THEN the system does not configure HSTS headers, allowing browsers to connect over plain HTTP on first visit or after a cache miss

5.5 WHEN a `.env.example` file is absent from the repository THEN the system provides no template for developers to discover required environment variables, increasing the risk of misconfigured deployments

5.6 WHEN CSRF protection is assumed to be handled by Supabase THEN the system has no explicit verification or documentation confirming that all state-mutating requests include the required anti-CSRF tokens or rely on SameSite cookie attributes

---

### Expected Behavior (Correct)

#### Area 1 — Unvalidated Redirects & XSS Injection

2.1 WHEN a user clicks a CTA in `OfferBanner.tsx` THEN the system SHALL validate `content.redirect_url` against an allowlist of permitted schemes (`https:`) and optionally a domain allowlist before navigating, and SHALL refuse to navigate if the URL fails validation

2.2 WHEN a user clicks a card in `OfferCardSlider.tsx` THEN the system SHALL pass the redirect URL through the same validation utility before calling `window.location.href` or `window.open`, and SHALL log a warning and abort navigation for invalid URLs

2.3 WHEN the `ChartStyle` component renders CSS variables THEN the system SHALL sanitize or escape color values before injecting them into the `<style>` tag, or SHALL replace `dangerouslySetInnerHTML` with a CSS-in-JS approach that does not accept raw HTML strings

2.4 WHEN the application is served THEN the system SHALL include a Content Security Policy header (via `index.html` meta tag or server header) that restricts `script-src`, `connect-src`, `img-src`, and `frame-ancestors` to known safe origins

#### Area 2 — Admin Access Control

2.5 WHEN a visitor attempts to access the admin signup form THEN the system SHALL require a valid invite token (verified server-side) before allowing account creation, or SHALL remove the signup tab entirely and provision admin accounts only through a secure out-of-band process

2.6 WHEN an admin sets a password THEN the system SHALL enforce a minimum of 12 characters including at least one uppercase letter, one digit, and one special character, and SHALL reject passwords that do not meet this policy before calling `supabase.auth.signUp()`

2.7 WHEN `AdminAuthContext` reads the admin cache THEN the system SHALL treat the cache only as a UX performance hint and SHALL always re-verify admin status via the `is_admin` RPC on any sensitive action, never granting access based solely on a cached `isAdmin: true` value

#### Area 3 — Authentication & Session Security

3.1 WHEN `sendOtp()` is called THEN the system SHALL enforce a client-side cooldown (minimum 60 seconds between requests per email) and the `send-otp` Edge Function SHALL enforce a server-side rate limit (e.g., 3 OTP requests per email per 10-minute window), returning HTTP 429 when exceeded

3.2 WHEN the Supabase client stores auth tokens THEN the system SHALL use `sessionStorage` instead of `localStorage` for the auth session, or SHALL document and accept the localStorage risk with compensating controls (short token TTL, CSP)

3.3 WHEN a user signs out THEN the system SHALL clear all session-related `localStorage` keys (`dopedeal_session_id`, `dopedeal_session_created_at`, `dopedeal_anonymous_id`, and all `dopedeal_session_*` context keys) in addition to the Supabase auth session

3.4 WHEN the application starts THEN the system SHALL validate that all required environment variables are defined and non-empty, and SHALL throw a descriptive error (or display a configuration error screen) before mounting the React tree if any required variable is missing

3.5 WHEN an unhandled exception occurs in the auth or routing tree THEN the system SHALL catch it via a React Error Boundary and SHALL display a user-friendly error screen with a retry or reload option instead of crashing the entire application

#### Area 4 — Financial Data Protection

4.1 WHEN `submitWithdrawalRequest()` stores bank details THEN the system SHALL mask or encrypt `bank_account_no` before persistence (e.g., store only the last 4 digits for display, encrypt the full number at rest using a server-side key), and SHALL never store the full account number in plaintext in the client-accessible table

4.2 WHEN `getWithdrawalHistory()` returns records THEN the system SHALL return only masked values (e.g., `****1234`) for `bank_account_no` and SHALL omit or mask `bank_ifsc` in client-facing responses

#### Area 5 — Hardening, Observability & Resilience

5.1 WHEN Edge Functions encounter errors THEN the system SHALL return only a generic error message and a correlation ID to the client, logging full details server-side only

5.2 WHEN admin actions are recorded THEN the system SHALL append a hash of the previous log entry to each new entry (hash chaining) or use an append-only table policy, making tampering detectable

5.3 WHEN sessions and events are stored THEN the system SHALL implement an automated retention policy that purges records older than a configurable threshold (default: 90 days for sessions, 180 days for events) via a scheduled database job

5.4 WHEN the application is served over HTTPS THEN the system SHALL include a `Strict-Transport-Security` header with a minimum `max-age` of 31536000 seconds

5.5 WHEN a developer clones the repository THEN the system SHALL provide a `.env.example` file listing all required and optional environment variables with placeholder values and comments

5.6 WHEN state-mutating requests are made THEN the system SHALL confirm that CSRF protection is active (via Supabase's SameSite cookie configuration or explicit token verification) and SHALL document this in the security notes

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid `https://` redirect URL from a permitted domain is clicked THEN the system SHALL CONTINUE TO navigate the user to the offer destination without interruption

3.2 WHEN an admin with a valid session and confirmed `is_admin = true` database role navigates the admin panel THEN the system SHALL CONTINUE TO load admin pages without requiring repeated re-authentication on every route change

3.3 WHEN a legitimate user submits their email for OTP login THEN the system SHALL CONTINUE TO send the OTP email and allow login within the rate-limit window

3.4 WHEN a user completes a withdrawal request with valid UPI or bank details THEN the system SHALL CONTINUE TO create the withdrawal record and debit the wallet transaction as before

3.5 WHEN the `ChartContainer` renders analytics charts in the admin panel THEN the system SHALL CONTINUE TO apply the correct CSS color variables for chart themes

3.6 WHEN a user signs in successfully THEN the system SHALL CONTINUE TO persist the session across page refreshes for the duration of the token TTL

3.7 WHEN an admin signs out THEN the system SHALL CONTINUE TO clear the admin cache and redirect to `/admin/login`

3.8 WHEN the application boots with all required environment variables present THEN the system SHALL CONTINUE TO initialise the Supabase client and mount the React tree normally

3.9 WHEN session context (shopId, batchId, qrType) is set during a QR scan flow THEN the system SHALL CONTINUE TO persist and retrieve that context correctly for the duration of the session

3.10 WHEN the `send-otp` Edge Function is called within the allowed rate-limit window THEN the system SHALL CONTINUE TO deliver the OTP email and return a success response

---

## Bug Condition Pseudocode

### C1 — Unvalidated Redirect Condition

```pascal
FUNCTION isBugCondition_UnvalidatedRedirect(url)
  INPUT: url of type string
  OUTPUT: boolean

  IF url is null OR url is empty THEN RETURN false
  IF NOT url starts with "https://" THEN RETURN true   // javascript:, http:, data:, etc.
  IF url domain NOT IN permitted_domains_allowlist THEN RETURN true
  RETURN false
END FUNCTION

// Property: Fix Checking
FOR ALL url WHERE isBugCondition_UnvalidatedRedirect(url) DO
  result ← validateAndNavigate'(url)
  ASSERT navigation_aborted(result) AND no_external_redirect(result)
END FOR

// Property: Preservation Checking
FOR ALL url WHERE NOT isBugCondition_UnvalidatedRedirect(url) DO
  ASSERT validateAndNavigate(url) = validateAndNavigate'(url)
END FOR
```

### C2 — Public Admin Signup Condition

```pascal
FUNCTION isBugCondition_PublicAdminSignup(request)
  INPUT: request of type AdminSignupRequest
  OUTPUT: boolean

  IF request.invite_token is null OR request.invite_token is empty THEN RETURN true
  IF NOT server_validates_invite_token(request.invite_token) THEN RETURN true
  RETURN false
END FUNCTION

// Property: Fix Checking
FOR ALL request WHERE isBugCondition_PublicAdminSignup(request) DO
  result ← handleAdminSignup'(request)
  ASSERT result.status = 403 AND no_account_created(result)
END FOR
```

### C3 — Admin Cache Manipulation Condition

```pascal
FUNCTION isBugCondition_AdminCacheManipulation(cacheValue, actualDbAdminStatus)
  INPUT: cacheValue of type AdminAccessCache, actualDbAdminStatus of type boolean
  OUTPUT: boolean

  IF cacheValue.isAdmin = true AND actualDbAdminStatus = false THEN RETURN true
  RETURN false
END FUNCTION

// Property: Fix Checking
FOR ALL (cache, dbStatus) WHERE isBugCondition_AdminCacheManipulation(cache, dbStatus) DO
  result ← checkAdminAccess'(cache, dbStatus)
  ASSERT result.isAdmin = false AND access_denied(result)
END FOR
```

### C4 — OTP Rate Limit Condition

```pascal
FUNCTION isBugCondition_OtpRateLimit(email, requestCount, windowMs)
  INPUT: email string, requestCount integer, windowMs integer
  OUTPUT: boolean

  IF requestCount > 3 AND windowMs <= 600000 THEN RETURN true
  RETURN false
END FUNCTION

// Property: Fix Checking
FOR ALL (email, count, window) WHERE isBugCondition_OtpRateLimit(email, count, window) DO
  result ← sendOtp'(email)
  ASSERT result.status = 429 AND no_email_sent(result)
END FOR
```

### C5 — Plaintext Financial Data Condition

```pascal
FUNCTION isBugCondition_PlaintextFinancialData(withdrawalPayload)
  INPUT: withdrawalPayload of type WithdrawalRequest
  OUTPUT: boolean

  IF withdrawalPayload.bank_account_no is NOT null AND
     withdrawalPayload.bank_account_no is NOT masked AND
     withdrawalPayload.bank_account_no is NOT encrypted THEN RETURN true
  RETURN false
END FUNCTION

// Property: Fix Checking
FOR ALL payload WHERE isBugCondition_PlaintextFinancialData(payload) DO
  stored ← submitWithdrawalRequest'(payload)
  ASSERT stored.bank_account_no matches pattern "\\*{4,}\\d{4}"
         OR stored.bank_account_no is encrypted_blob
END FOR

// Property: Preservation Checking
FOR ALL payload WHERE NOT isBugCondition_PlaintextFinancialData(payload) DO
  ASSERT submitWithdrawalRequest(payload).status = submitWithdrawalRequest'(payload).status
END FOR
```
