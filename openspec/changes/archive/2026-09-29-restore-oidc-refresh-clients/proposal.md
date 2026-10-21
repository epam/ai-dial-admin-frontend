## Why

OIDC client instances are currently cached only in the serving process during the interactive login callback. A session refresh routed to another replica, or handled after a process restart, cannot find that client and fails when the access token expires. The first attempt to reconstruct the client also introduced a circular module dependency that prevents the application from initializing.

## What Changes

- Reconstruct and cache a configured OIDC client on demand when refreshing an expired access token and no in-process client is available.
- Defer provider configuration resolution until refresh time so authentication module initialization remains acyclic.
- Recreate provider configuration using NextAuth-compatible option merging and issuer discovery or verified explicit endpoints.
- Preserve the login-time client cache as the normal refresh fast path.
- Return the existing refresh-token error outcome when a provider cannot be reconstructed, with actionable server-side logging.
- Add coverage for cached, reconstructable, and unsupported provider paths, including custom GitLab and Ping Identity configuration.

## Capabilities

### New Capabilities
- `oidc-refresh-client-recovery`: Restores OIDC clients needed to refresh JWT sessions after process-local client state is unavailable.

### Modified Capabilities
- None.

## Impact

- Affects the NextAuth token callback and the process-global client cache in `apps/ai-dial-admin/src/utils/auth/auth-callbacks.ts` and `apps/ai-dial-admin/src/utils/auth/nextauth-client.ts`.
- Uses the existing NextAuth v4 provider configurations in `apps/ai-dial-admin/src/utils/auth/auth-providers.ts`, including custom GitLab and Ping Identity providers.
- Does not change the user-facing sign-in flow, session format, ingress configuration, or backend API contracts.

## Non-goals

- Introducing distributed session or client caching.
- Changing IdP settings, token lifetimes, scopes, or ingress session affinity.
- Supporting a provider that lacks sufficient discovery or explicit endpoint metadata to safely construct an OIDC client.
