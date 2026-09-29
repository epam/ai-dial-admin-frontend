## Context

The JWT refresh callback currently retrieves an `openid-client` client from a process-global cache populated during the interactive NextAuth login callback. That client does not exist on a new replica or after a restart, so an otherwise valid session fails its first access-token refresh. Adding a static import of configured providers to reconstruct the client creates an initialization cycle: `auth-callbacks` imports `nextauth-client`, which imports `auth-providers`, which reads `tokenConfig` from `auth-callbacks` while that constant is in its temporal dead zone.

The solution must work with the existing NextAuth v4 provider definitions and custom GitLab and Ping Identity providers, without relying on local environment files or introducing shared infrastructure.

## Goals / Non-Goals

**Goals:**

- Refresh an expired session token after process-local OIDC client state is lost.
- Keep the client captured during the login callback as the preferred refresh path.
- Avoid an authentication module initialization cycle.
- Reconstruct only from the configured provider matching the session token’s provider ID.
- Preserve the current refresh-error result when reconstruction is impossible or the IdP request fails.

**Non-Goals:**

- Persisting clients or refresh coordination across replicas.
- Altering sign-in behavior, token claims, scopes, client credentials, or IdP configuration.
- Adding sticky sessions or a distributed cache as a workaround.
- Guessing endpoints for providers lacking sufficient configured discovery or endpoint metadata.

## Decisions

### Lazy-load configured providers only after a cache miss

`NextClient.getOrCreateClient` SHALL dynamically load the configured provider collection after checking the existing cache. This breaks the startup cycle while retaining access to the same provider configuration NextAuth receives.

**Alternative considered:** Move `tokenConfig` into a third module so that providers can remain statically imported. This removes the immediate cycle but increases initialization coupling and does not address the need to reproduce NextAuth’s provider resolution. Lazy loading makes the expensive and failure-prone path explicitly refresh-only.

### Normalize provider configuration before constructing a client

The resolver SHALL combine NextAuth’s generated provider fields with its nested user-supplied `options` before reading client credentials, issuer, discovery metadata, or endpoint definitions. It SHALL use OIDC discovery from `wellKnown` when supplied and otherwise construct an issuer only when verified issuer and token endpoint data are available. The constructed `openid-client` client SHALL be stored through the existing cache method.

**Alternative considered:** Reuse NextAuth’s private `openidClient()` helper. The helper is not a public API, so importing it would couple the app to internal package layout and make upgrades fragile.

### Treat custom providers as explicit compatibility cases

GitLab SHALL use its configured well-known discovery URL. Ping Identity SHALL be verified against the current provider configuration; implementation must either provide the explicit metadata needed for reconstruction or report the provider as unreconstructable rather than manufacturing endpoint URLs.

**Alternative considered:** Assume every configured `issuer` supports standard discovery. This would hide configuration errors and can refresh against an unintended endpoint.

### Keep error handling at the refresh callback boundary

The resolver returns `null` for unavailable or unreconstructable provider configuration and propagates discovery/construction failures to the existing `refreshAccessToken` catch block. The callback retains the previous JWT plus `RefreshAccessTokenError` and logs the failure with the existing redaction behavior.

**Alternative considered:** Trigger a new sign-in redirect from the resolver. That changes session semantics and makes a server-side provider-resolution failure look like a deliberate sign-out.

## Risks / Trade-offs

- **[Concurrent cache misses on one process can duplicate discovery requests]** → The existing cache is populated immediately after construction; implementation tests cover reuse after the first client is stored. Distributed coordination remains out of scope.
- **[Provider config shapes vary between NextAuth providers]** → Normalize top-level and nested `options` fields and add focused tests for discovery and explicit-endpoint branches.
- **[Ping Identity may not expose enough metadata]** → Validate its configured behavior before declaring the fallback supported; preserve the controlled refresh error if metadata is absent.
- **[Dynamic import defers a configuration problem until token expiry]** → Log the provider-resolution failure at refresh time without logging token contents, and cover the unavailable-provider path.

## Migration Plan

1. Deploy the lazy provider-resolution and on-demand client-reconstruction implementation with tests.
2. Existing login-created clients continue refreshing from cache without behavior changes.
3. Sessions routed to a new process reconstruct their provider client at first refresh and then cache it locally.
4. If a deployment rollback is required, revert the application change; affected sessions return to the pre-existing refresh behavior and users may need to sign in again after a process transition.

## Open Questions

- Which Ping Identity discovery URL or explicit token endpoint is guaranteed by the production configuration, and can it be represented in the current custom provider definition?
