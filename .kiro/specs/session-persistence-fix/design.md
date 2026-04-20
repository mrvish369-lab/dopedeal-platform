# Session Persistence Fix Bugfix Design

## Overview

User sessions are not persisting across page refreshes, browser close/reopen, or back navigation despite having session persistence configured in the Supabase client. The root cause appears to be a race condition in the OTP verification flow where navigation occurs before the session is fully persisted to localStorage, combined with potential timing issues in the AuthContext initialization sequence. The fix will ensure proper session persistence by waiting for session storage completion before navigation and improving the session restoration flow on mount.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user authenticates via OTP and then performs a page refresh, browser navigation, or browser close/reopen, causing the session to be lost
- **Property (P)**: The desired behavior when the bug condition occurs - the session should be restored from localStorage and the user should remain authenticated
- **Preservation**: Existing authentication flows (OTP send/verify, sign out, wallet fetching) that must remain unchanged by the fix
- **AuthContext**: The React context in `src/contexts/AuthContext.tsx` that manages authentication state and session lifecycle
- **verifyOtp**: The function in AuthContext that verifies the OTP and creates a Supabase session using `supabase.auth.verifyOtp()`
- **getSession**: The Supabase Auth method that retrieves the current session from storage (localStorage via safeBrowserStorage)
- **onAuthStateChange**: The Supabase Auth listener that fires when authentication state changes (login, logout, token refresh)
- **safeBrowserStorage**: The custom storage adapter in `src/integrations/supabase/safeStorage.ts` that wraps localStorage with fallback to in-memory storage
- **Session Token**: The JWT token stored in localStorage under the key `dopedeal-auth-token` that represents the user's authenticated session

## Bug Details

### Bug Condition

The bug manifests when a user successfully authenticates via OTP (Telegram or Email) and then performs any of the following actions: page refresh, browser back navigation, or browser close/reopen. The session is not restored from localStorage, causing the user to be logged out unexpectedly.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: string, hasSession: boolean, sessionInStorage: boolean }
  OUTPUT: boolean
  
  RETURN input.hasSession = true
         AND input.sessionInStorage = true
         AND input.action IN ['page_refresh', 'browser_back', 'browser_reopen']
         AND NOT sessionRestored()
END FUNCTION
```

### Examples

- **Page Refresh**: User logs in via Telegram OTP, receives session, refreshes the page → Expected: session restored from localStorage, user stays logged in. Actual: session not restored, user logged out.

- **Browser Close/Reopen**: User logs in via Email OTP, closes browser tab, reopens the app → Expected: session restored from localStorage, user stays logged in. Actual: session not restored, user logged out.

- **Browser Back Navigation**: User logs in, navigates to dashboard, clicks browser back button → Expected: session maintained, user stays logged in. Actual: session lost, user logged out.

- **Token Auto-Refresh**: User logs in, session token approaches 2-week expiry → Expected: Supabase auto-refreshes token, session persists. Actual: Token may not refresh properly, user logged out prematurely.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- OTP send functionality must continue to work exactly as before (rate limiting, Telegram/Email delivery)
- OTP verification must continue to create valid Supabase sessions with proper JWT tokens
- Sign out must continue to clear all session-related localStorage keys and reset auth state
- Wallet, verification status, and checkin status fetching must continue to work for authenticated users
- The `onAuthStateChange` listener must continue to trigger on login, logout, and token refresh events
- Protected route access must continue to work for authenticated users
- Manual logout must continue to clear sessions and redirect to login

**Scope:**
All inputs that do NOT involve session restoration after page refresh, browser navigation, or browser reopen should be completely unaffected by this fix. This includes:
- Initial OTP authentication flow (send OTP, verify OTP, create session)
- Manual sign out flow
- Authenticated API calls (wallet fetch, profile fetch, etc.)
- Navigation within the app while authenticated

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Race Condition in verifyOtp Flow**: After calling `supabase.auth.verifyOtp()`, the code immediately navigates to `/dashboard` without waiting for the session to be fully persisted to localStorage. The navigation might occur before the storage write completes, causing the session to be lost on the next page load.

2. **Session Restoration Timing Issue**: The `AuthContext` initialization calls `getSession()` to restore the session, but there might be a timing issue where:
   - The `getSession()` call completes before localStorage is fully read
   - The `onAuthStateChange` listener is set up after the initial session check, missing the restoration event
   - The component unmounts before the session restoration completes

3. **Storage Adapter Timing**: The `safeBrowserStorage` adapter might have a timing issue where:
   - Writes to localStorage don't complete synchronously
   - Reads from localStorage occur before writes complete
   - The in-memory fallback is used instead of localStorage in some cases

4. **Missing Session Refresh Trigger**: The `onAuthStateChange` listener might not be triggering properly on session restoration, causing the UI state to not update even if the session exists in storage.

5. **Supabase Client Configuration Issue**: While `persistSession: true` and `autoRefreshToken: true` are set, there might be an issue with how the PKCE flow interacts with session persistence, especially with the custom storage adapter.

## Correctness Properties

Property 1: Bug Condition - Session Restoration After Navigation

_For any_ authenticated user who performs a page refresh, browser back navigation, or browser close/reopen, the fixed AuthContext SHALL restore the session from localStorage, set the user and session state, and fetch user data (wallet, verification status, checkin status) without requiring re-authentication.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Authentication Flows

_For any_ authentication action that is NOT a session restoration (OTP send, OTP verify, manual sign out, authenticated API calls), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for OTP authentication, sign out, and data fetching.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/contexts/AuthContext.tsx`

**Function**: `verifyOtp` and `useEffect` (initialization)

**Specific Changes**:

1. **Add Session Persistence Wait in verifyOtp**: After calling `supabase.auth.verifyOtp()`, wait for the session to be fully persisted to storage before allowing navigation. This can be done by:
   - Adding a small delay (100-200ms) after `verifyOtp()` to allow storage writes to complete
   - OR using `supabase.auth.getSession()` immediately after `verifyOtp()` to confirm the session is in storage
   - OR waiting for the `onAuthStateChange` event to fire with the new session before returning

2. **Improve Session Restoration Flow**: Modify the `useEffect` initialization to:
   - Ensure `getSession()` completes fully before setting `loading: false`
   - Add error handling for storage read failures
   - Add logging to track session restoration success/failure
   - Ensure the `onAuthStateChange` listener is set up before calling `getSession()` to catch any events

3. **Add Session Verification on Mount**: After calling `getSession()`, verify that the session is valid by:
   - Checking that `session.expires_at` is in the future
   - Checking that the session has a valid `access_token`
   - If the session is expired, clear it from storage and set loading to false

4. **Add Storage Sync Check**: In the `safeBrowserStorage` adapter, ensure that:
   - `setItem()` completes synchronously (localStorage writes are synchronous by spec)
   - `getItem()` reads the most recent value (no caching issues)
   - The in-memory fallback is only used when localStorage is truly unavailable

5. **Add Session Refresh Logging**: Add console logging to track when sessions are:
   - Created (after OTP verification)
   - Restored (on page load)
   - Refreshed (auto-refresh before expiry)
   - Cleared (on sign out)

### Implementation Details

**Change 1: verifyOtp with Session Persistence Wait**

```typescript
const verifyOtp = async (email: string, otp: string): Promise<{ error: string | null }> => {
  const { data, error } = await supabase.functions.invoke("verify-otp", {
    body: { email: email.trim().toLowerCase(), otp },
  });
  if (error) return { error: await extractFnError(error) };
  if (data?.error) return { error: data.error };

  // Use the hashed token from the edge function to create a real client session
  const { error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: "email",
  });
  if (sessionError) return { error: sessionError.message };

  // CRITICAL FIX: Wait for session to be persisted to storage before returning
  // This prevents race conditions where navigation occurs before storage write completes
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Verify session is in storage
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error("Session not found in storage after verifyOtp");
    return { error: "Session creation failed. Please try again." };
  }

  console.log("Session created and persisted:", session.user.email);

  // Auto-create profile row if first sign-in
  // ... (rest of the code remains the same)
};
```

**Change 2: Improved Session Restoration Flow**

```typescript
useEffect(() => {
  let mounted = true;

  const initializeAuth = async () => {
    try {
      console.log("Initializing auth, checking for existing session...");
      
      // Get existing session from storage
      const { data: { session: existingSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
      }
      
      if (mounted) {
        if (existingSession && !error) {
          // Verify session is not expired
          const expiresAt = new Date(existingSession.expires_at! * 1000);
          const now = new Date();
          
          if (expiresAt > now) {
            console.log("Session restored from storage:", existingSession.user.email);
            setSession(existingSession);
            setUser(existingSession.user);
            // Fetch user data
            fetchWallet(existingSession.user.id);
            fetchVerificationStatus(existingSession.user.id);
            fetchCheckinStatus(existingSession.user.id);
          } else {
            console.warn("Session expired, clearing from storage");
            await supabase.auth.signOut();
          }
        } else {
          console.log("No existing session found");
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Error initializing auth:", err);
      if (mounted) {
        setLoading(false);
      }
    }
  };

  // Set up listener BEFORE initializing to catch any events
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // User logged in or token refreshed
        fetchWallet(session.user.id);
        fetchVerificationStatus(session.user.id);
        fetchCheckinStatus(session.user.id);
      } else {
        // User logged out
        setWallet(null);
        setIsVerified(false);
        setCheckinStatus({
          canCheckin: false,
          streak: 0,
          nextCheckinAt: null,
          lastCheckinDate: null,
        });
      }
      
      setLoading(false);
    }
  );

  // Initialize after listener is set up
  initializeAuth();

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
```

**Change 3: Add Storage Verification (Optional Enhancement)**

If the above changes don't fully resolve the issue, we may need to add explicit storage verification:

```typescript
// In safeBrowserStorage.ts, add verification
setItem(key: string, value: string) {
  try {
    if (hasLocalStorage) {
      globalThis.localStorage.setItem(key, value);
      // Verify write succeeded
      const verify = globalThis.localStorage.getItem(key);
      if (verify === value) {
        return;
      }
      console.warn("localStorage write verification failed, using memory fallback");
    }
  } catch (err) {
    console.error("localStorage write failed:", err);
  }
  memory.set(key, value);
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write end-to-end tests that simulate the full authentication flow (OTP send, verify, navigate) and then perform page refresh, browser navigation, and browser reopen actions. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Page Refresh Test**: Authenticate user, refresh page, verify session is NOT restored (will fail on unfixed code)
2. **Browser Reopen Test**: Authenticate user, close browser, reopen, verify session is NOT restored (will fail on unfixed code)
3. **Browser Back Test**: Authenticate user, navigate forward, click back, verify session is NOT maintained (will fail on unfixed code)
4. **Token Refresh Test**: Authenticate user, wait for token to approach expiry, verify token is NOT auto-refreshed (may fail on unfixed code)

**Expected Counterexamples**:
- Session is not restored from localStorage after page refresh
- User is logged out after browser close/reopen
- Session is lost after browser back navigation
- Possible causes: race condition in verifyOtp, timing issue in getSession, storage adapter issue, missing onAuthStateChange trigger

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := AuthContext_fixed.initializeAuth(input)
  ASSERT sessionRestored(result)
  ASSERT result.user IS NOT NULL
  ASSERT result.session IS NOT NULL
  ASSERT result.session.access_token IS VALID
END FOR
```

**Test Cases**:
1. **Page Refresh Restoration**: Authenticate user, refresh page, verify session IS restored and user stays logged in
2. **Browser Reopen Restoration**: Authenticate user, close browser, reopen, verify session IS restored and user stays logged in
3. **Browser Back Maintenance**: Authenticate user, navigate forward, click back, verify session IS maintained and user stays logged in
4. **Token Auto-Refresh**: Authenticate user, simulate token approaching expiry, verify token IS auto-refreshed and session persists

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT AuthContext_original(input) = AuthContext_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-session-restoration flows

**Test Plan**: Observe behavior on UNFIXED code first for OTP send, OTP verify, sign out, and data fetching, then write property-based tests capturing that behavior.

**Test Cases**:
1. **OTP Send Preservation**: Verify OTP send continues to work with rate limiting and delivery (Telegram/Email)
2. **OTP Verify Preservation**: Verify OTP verification continues to create valid sessions with JWT tokens
3. **Sign Out Preservation**: Verify sign out continues to clear all localStorage keys and reset auth state
4. **Data Fetching Preservation**: Verify wallet, verification status, and checkin status fetching continues to work
5. **Auth State Change Preservation**: Verify onAuthStateChange listener continues to fire on login, logout, token refresh
6. **Protected Route Preservation**: Verify protected routes continue to allow access for authenticated users

### Unit Tests

- Test `verifyOtp` with session persistence wait (verify session is in storage before returning)
- Test `initializeAuth` with existing session in storage (verify session is restored)
- Test `initializeAuth` with expired session in storage (verify session is cleared)
- Test `initializeAuth` with no session in storage (verify loading completes without error)
- Test `onAuthStateChange` listener fires on session creation, restoration, and destruction
- Test `safeBrowserStorage` setItem/getItem with localStorage available and unavailable

### Property-Based Tests

- Generate random authentication flows (OTP send, verify, navigate, refresh) and verify sessions persist across all navigation types
- Generate random session expiry times and verify auto-refresh works correctly
- Generate random storage states (localStorage available/unavailable) and verify fallback works correctly
- Test that all non-session-restoration flows produce identical results before and after the fix

### Integration Tests

- Test full authentication flow: send OTP → verify OTP → navigate to dashboard → refresh page → verify user stays logged in
- Test browser reopen flow: authenticate → close browser → reopen → verify session restored
- Test browser back flow: authenticate → navigate forward → click back → verify session maintained
- Test token refresh flow: authenticate → wait for token to approach expiry → verify auto-refresh occurs
- Test sign out flow: authenticate → sign out → verify session cleared and user redirected to login
