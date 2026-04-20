# Bugfix Requirements Document

## Introduction

User sessions are not persisting across page refreshes, browser close/reopen, or back navigation despite having session persistence configured in the Supabase client. Users authenticated via Telegram OTP or Email OTP are being logged out unexpectedly, requiring them to re-authenticate frequently. This creates a poor user experience as sessions should persist for 2 weeks (like a mobile app) but are instead being cleared prematurely.

The bug affects all authenticated users regardless of authentication method (Telegram OTP or Email OTP) and occurs in multiple scenarios: page refresh, browser navigation (back button), and browser close/reopen.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user logs in via Telegram OTP or Email OTP and then refreshes the page THEN the system logs the user out and clears the session

1.2 WHEN a user logs in and then closes the browser tab/window and reopens it THEN the system logs the user out and does not restore the session

1.3 WHEN a user logs in and then navigates back using the browser back button THEN the system logs the user out and clears the session

1.4 WHEN a user logs in and the session token should auto-refresh before the 2-week expiry THEN the system fails to refresh the token and the user is logged out prematurely

### Expected Behavior (Correct)

2.1 WHEN a user logs in via Telegram OTP or Email OTP and then refreshes the page THEN the system SHALL restore the session from localStorage and keep the user logged in

2.2 WHEN a user logs in and then closes the browser tab/window and reopens it THEN the system SHALL restore the session from localStorage and keep the user logged in

2.3 WHEN a user logs in and then navigates back using the browser back button THEN the system SHALL maintain the session and keep the user logged in

2.4 WHEN a user logs in and the session token approaches the 2-week expiry THEN the system SHALL automatically refresh the token and maintain the session without requiring re-authentication

2.5 WHEN a user manually logs out THEN the system SHALL clear the session from localStorage and redirect to the login page

2.6 WHEN a user's session has been inactive for 2 weeks THEN the system SHALL expire the session and require re-authentication

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user successfully verifies their OTP THEN the system SHALL CONTINUE TO create a valid Supabase session with proper JWT tokens

3.2 WHEN a user is authenticated and navigates to protected routes THEN the system SHALL CONTINUE TO allow access to those routes

3.3 WHEN a user is authenticated and the AuthContext fetches wallet data THEN the system SHALL CONTINUE TO successfully retrieve and display wallet balances

3.4 WHEN a user is authenticated and the AuthContext fetches verification status THEN the system SHALL CONTINUE TO successfully retrieve and display verification status

3.5 WHEN a user is authenticated and the AuthContext fetches checkin status THEN the system SHALL CONTINUE TO successfully retrieve and display daily checkin status

3.6 WHEN a user manually signs out THEN the system SHALL CONTINUE TO clear all session-related localStorage keys and reset auth state

3.7 WHEN the auth state changes (login, logout, token refresh) THEN the system SHALL CONTINUE TO trigger the onAuthStateChange listener and update the UI accordingly
