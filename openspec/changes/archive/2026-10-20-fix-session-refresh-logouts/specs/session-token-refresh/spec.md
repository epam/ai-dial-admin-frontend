## Purpose

Keeps an authenticated admin session usable for as long as its refresh token is valid, so users are
not sent to sign-in merely because a short-lived access token expired.

## ADDED Requirements

### Requirement: Server-side requests use a valid access token
When a server-rendered page, layout, route handler or server action reads the session token and the
access token has expired or is within a short safety margin of expiry, the system SHALL refresh it
with the session's refresh token before using it. The system SHALL send the refreshed access token to
the backend for that request. The system SHALL NOT log access-token or refresh-token values.

#### Scenario: Server action after access-token expiry
- **WHEN** a user triggers a server action while the access token stored in the session cookie has expired and the refresh token is valid
- **THEN** the backend request carries a newly refreshed, unexpired access token and the action does not fail with 401

#### Scenario: Page load after access-token expiry
- **WHEN** a user loads or reloads any admin page while the access token stored in the session cookie has expired and the refresh token is valid
- **THEN** the page renders with data fetched using a refreshed access token and the user is not shown a 403 or sign-in page

#### Scenario: Access token about to expire
- **WHEN** a server-side request reads a session whose access token expires within the safety margin
- **THEN** the system refreshes the token before sending the backend request

#### Scenario: Access token still valid
- **WHEN** a server-side request reads a session whose access token is valid beyond the safety margin
- **THEN** the system uses the stored access token without contacting the identity provider

### Requirement: Session validity is decided by the refresh outcome
The system SHALL treat an authenticated session as invalid only when it is missing or when refreshing
it failed. An access token that has expired but can be refreshed SHALL NOT make the session invalid
and SHALL NOT redirect the user to sign-in.

#### Scenario: Reload with an expired but refreshable token
- **WHEN** a user reloads a page, opens an admin page in a new tab, or a page refresh is triggered after saving an entity, and the cookie's access token has expired while the refresh token is valid
- **THEN** the user stays on the requested page and is not redirected to the sign-in page

#### Scenario: Refresh fails
- **WHEN** the access token has expired and the identity provider rejects the refresh token
- **THEN** the session is treated as invalid and the user is redirected to sign-in

#### Scenario: No session
- **WHEN** a request arrives without a session cookie while authentication is enabled
- **THEN** the user is redirected to sign-in

### Requirement: Browser keeps the session cookie renewed
While an admin page is open, the browser SHALL re-validate the session at a fixed interval shorter than
the access-token lifespan, and also when a tab regains focus, so the stored session is renewed before
its access token expires. Because the session cookie is shared, one open tab SHALL be enough to keep
the session renewed for all tabs of the same browser.

#### Scenario: Idle open tab
- **WHEN** a user keeps an admin page open without interacting for longer than the access-token lifespan and then reloads it
- **THEN** the session is still valid and the page loads without a sign-in redirect

#### Scenario: Several tabs
- **WHEN** a user has several admin tabs open and works in one of them past the access-token lifespan
- **THEN** switching to, reloading, or navigating in any other tab keeps the user signed in

### Requirement: Concurrent refreshes are coordinated within a process
Within a single server process, the system SHALL perform at most one identity-provider refresh for a
given signed-in session at a time. Concurrent requests for the same session SHALL wait for and share
that refresh result. A request whose session was already refreshed on that process SHALL reuse the
newest result while its access token is valid, instead of contacting the identity provider again, and
a later refresh SHALL use the newest refresh token known for that session. Coordination SHALL apply
to every refresh, not only the first one of a session, and SHALL NOT mix the tokens of two separate
sign-ins of the same user.

#### Scenario: Parallel requests at expiry
- **WHEN** several requests (for example from several tabs or parallel server actions) with the same expired session reach the same process at once
- **THEN** the identity provider receives one refresh request and every request continues with the same refreshed access token

#### Scenario: Later refreshes stay coordinated
- **WHEN** a session is refreshed for the second or any later time and parallel requests arrive for it
- **THEN** the identity provider still receives only one refresh request

#### Scenario: Stale cookie after a server-side refresh
- **WHEN** a request presents a session cookie that is older than a refresh the same process already performed for that session, and that refresh's access token is still valid
- **THEN** the request uses that access token without contacting the identity provider

#### Scenario: Separate sign-ins stay separate
- **WHEN** the same user is signed in from two browsers and one session is refreshed
- **THEN** the other session's requests do not receive the first session's tokens

### Requirement: Refresh failures do not persist
A failed refresh SHALL NOT prevent later refresh attempts. After a failure, the next request for the
same session SHALL attempt a new refresh without waiting on the failed one. A successful refresh
SHALL clear any refresh error previously recorded on the session.

#### Scenario: Transient identity-provider failure
- **WHEN** one refresh attempt fails because the identity provider is temporarily unavailable and a later attempt succeeds
- **THEN** the session is valid after the successful attempt and carries no refresh error

#### Scenario: New sign-in after a failure
- **WHEN** a user's refresh failed, the user signed in again, and the new access token later expires
- **THEN** the new session is refreshed normally and the user is not signed out

### Requirement: Sign-out clears only the signed-out session's refresh state
When a user signs out, the system SHALL discard the in-process refresh state of that session and
SHALL NOT discard refresh state belonging to other sessions or other users.

#### Scenario: Another user signs out
- **WHEN** user A signs out on a process that holds refresh state for user B
- **THEN** user B's next refresh on that process behaves as if user A had not signed out
