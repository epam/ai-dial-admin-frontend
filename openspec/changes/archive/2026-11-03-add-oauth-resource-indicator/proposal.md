## Why

Core now sends the RFC 8707 `resource` parameter on the OAuth token exchange and refresh
([ai-dial-core#2218](https://github.com/epam/ai-dial-core/pull/2218)) and stores it in the auth settings of
Assets toolsets and application external services. Core's PR is explicitly "not complete on its own":
authorization servers that bind tokens to a resource check **both** legs, so without `resource` on the
authorization URL the exchange is rejected. Statically registered clients also have no way to set the value
in the admin UI.

## What Changes

- Add `resource?: string` to `DialToolsetResourceAuthSettings` (shared by Assets toolsets and application
  external services via `DialExternalServiceAuthSettings`).
- Add a "Resource" field to `ResourceOAuthSection` (the static, "Existing client" OAuth editor). It is optional,
  validated as an http(s) URL, and locked while signed in like the other auth fields.
- Send `resource` on the authorization URL in `ResourceAuthButtons` (Assets toolsets) and
  `ExternalServiceAuthButtons` (application external services) when it is set.
- A cleared field is saved as a blank `resource`, which core reads as "clear"; an untouched one is left as
  loaded, which core reads as "keep". Both save actions already forward unknown auth-settings keys, so no
  server-action change is needed beyond a regression test.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `oauth-client-validation`: Assets OAuth auth settings gain an optional Resource field with URL validation,
  signed-in lock, and clear-vs-keep save semantics.
- `app-external-services-auth`: the OAuth login redirect for Assets toolsets and external services carries
  `resource` when configured, and an external service round-trips it through the application save.

## Non-goals

- **Config toolsets** (`Toolset` / `OAuthSection` / `Toolsets/Auth/AuthButtons`). They go through
  ai-dial-admin-backend, whose auth-settings DTO has no `resource` yet; that is a separate backend-first change.
- Dynamic client registration UI (not offered today). Core fills `resource` from the server's Protected
  Resource Metadata; the UI only displays whatever core returns.
- Deriving or prefilling a value in the UI. Static clients often sit behind servers that reject `resource`
  (Entra v2), so the field stays empty unless the admin fills it.
- Client-side fragment rejection; core validates "absolute URI without fragment" and its 400 surfaces through
  the existing save error notification.

## Impact

- `src/models/dial/resource.ts` (type), `src/components/Assets/Resources/Auth/ResourceOAuthSection.tsx`,
  `ResourceAuthButtons.tsx`, `ExternalServiceAuthButtons.tsx`, `src/constants/i18n.ts` + `src/locales/en.ts`
  (label, placeholder, helper text).
- Shared component: `ResourceOAuthSection` is rendered by `ResourceAuthTypeSection` for both Assets toolsets
  and external services, so both pick up the field together.
- Requires a core build that includes #2218; against an older core the field is silently ignored on save.
- No API route, context or backend change.
