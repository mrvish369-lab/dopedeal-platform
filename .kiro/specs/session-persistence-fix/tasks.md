# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Session Not Restored After Navigation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that authenticated users who perform page refresh, browser back navigation, or browser close/reopen have their sessions restored from localStorage
  - Test implementation details from Bug Condition in design: `isBugCondition(input)` where `input.hasSession = true AND input.sessionInStorage = true AND input.action IN ['page_refresh', 'browser_back', 'browser_reopen'] AND NOT sessionRestored()`
  - The test assertions should match the Expected Behavior Properties from design: session restored, user and session state set, user data fetched
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Session not restored after page refresh", "User logged out after browser reopen")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Authentication Flows Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (OTP send, OTP verify, sign out, data fetching)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases to observe and capture:
    - OTP send functionality (rate limiting, Telegram/Email delivery)
    - OTP verification creates valid Supabase sessions with JWT tokens
    - Sign out clears all session-related localStorage keys and resets auth state
    - Wallet, verification status, and checkin status fetching works for authenticated users
    - onAuthStateChange listener triggers on login, logout, and token refresh events
    - Protected route access works for authenticated users
    - Manual logout clears sessions and redirects to login
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [-] 3. Fix for session persistence across navigation

  - [x] 3.1 Add session persistence wait in verifyOtp function
    - After calling `supabase.auth.verifyOtp()`, add a 150ms delay to allow storage writes to complete
    - Call `supabase.auth.getSession()` to verify session is in storage before returning
    - If session is not found in storage, return error: "Session creation failed. Please try again."
    - Add console logging to track session creation and persistence
    - _Bug_Condition: isBugCondition(input) where input.hasSession = true AND input.sessionInStorage = true AND input.action IN ['page_refresh', 'browser_back', 'browser_reopen'] AND NOT sessionRestored()_
    - _Expected_Behavior: Session restored from localStorage, user and session state set, user data fetched without re-authentication_
    - _Preservation: OTP send, OTP verify, sign out, data fetching, onAuthStateChange listener, protected routes, manual logout must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 Improve session restoration flow in AuthContext initialization
    - Set up `onAuthStateChange` listener BEFORE calling `getSession()` to catch restoration events
    - Add error handling for storage read failures in `getSession()`
    - Verify session is not expired by checking `session.expires_at > now`
    - If session is expired, clear it from storage using `supabase.auth.signOut()`
    - Add console logging to track session restoration success/failure
    - Ensure `setLoading(false)` only occurs after session restoration completes
    - _Bug_Condition: isBugCondition(input) where input.hasSession = true AND input.sessionInStorage = true AND input.action IN ['page_refresh', 'browser_back', 'browser_reopen'] AND NOT sessionRestored()_
    - _Expected_Behavior: Session restored from localStorage, user and session state set, user data fetched without re-authentication_
    - _Preservation: OTP send, OTP verify, sign out, data fetching, onAuthStateChange listener, protected routes, manual logout must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.3 Add session verification on mount
    - After calling `getSession()`, verify session has valid `access_token`
    - Check that `session.expires_at` is in the future
    - If session is invalid or expired, clear it from storage
    - Add console logging for session validation results
    - _Bug_Condition: isBugCondition(input) where input.hasSession = true AND input.sessionInStorage = true AND input.action IN ['page_refresh', 'browser_back', 'browser_reopen'] AND NOT sessionRestored()_
    - _Expected_Behavior: Session restored from localStorage, user and session state set, user data fetched without re-authentication_
    - _Preservation: OTP send, OTP verify, sign out, data fetching, onAuthStateChange listener, protected routes, manual logout must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Session Restored After Navigation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Authentication Flows Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
