## Why

An application's OAuth external service today needs a hand-registered client: the admin must create it at the provider, then paste client id, secret and both endpoints. DIAL Core now (epam/ai-dial-core#2311, issue #2287) can find the provider's authorization server from an optional `auth_settings.discovery_url` and register the client itself (RFC 7591). The panel has no way to send that field, so the capability is unreachable from the UI.

## What Changes

- **Discovery URL** — external-service OAuth settings gain an optional `discovery_url`, shown as "Discovery URL" with a caption (external services only; Core rejects it for toolsets). Validated as an absolute `http`/`https` URL; required for "Register automatically", optional for an existing client.
- **Register automatically** — `ResourceOAuthSection` offers a second client-registration mode next to "Existing client" (still the default), for external services only. In it the form shows only Discovery URL and the save request carries `discovery_url` and no other OAuth field, `redirect_uri` included.
- **Registered client state** — a service Core registered (`dynamically_registered: true`) shows "Registered by DIAL Core" with its registered fields read-only and an action "Use an existing client instead" that converts it to a static client (client id and secret required). There is no way back to automatic registration on a stored service.
- **Choice only when it can take effect** — "Register automatically" is offered for a new service or a service whose *stored* type is not OAUTH. For a stored OAUTH service the mode follows what is stored.
- **Token auth method "None"** — verified, not changed: `TokenEndpointAuthMethod.CLIENT_SECRET_NONE` is already `'none'` (landed after the requirements doc was written). Add coverage that a stored `none` shows as "None" and that choosing it saves `none`.
- **Errors** — Core's `400` message (`External service '<id>': <reason>`) is shown through the existing save-failure toast. No row marking, no reason-specific hints.
- **Deployment docs** — record the `toolsets.security.allowedRedirectUris` prerequisite (must contain `<admin origin>/external-service-signin`, plus Chat's callback if users sign in from Chat) in `docs/INFRA-CHANGELOG.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-external-services-auth`: the Add/Edit form gains the Register automatically mode, the Discovery URL field, the registered-client read-only state with "Use an existing client instead", and the rule for when the mode choice is offered.
- `oauth-client-validation`: Discovery URL validation (absolute http/https; required only in Register automatically), the relaxed client id/secret/endpoint requirements in that mode, and a stored `none` auth method.

## Non-goals

- Automatic registration for toolsets (the shared component stays toolset-neutral).
- A repair or re-register action for external services; Core has none, and re-registering when `discovery_url` changes is out of Core's scope too.
- Row-level marking of the failing service, or Core-message-specific hints (toast only).
- Changing sign-in: `ExternalServiceAuthButtons` keeps using `window.location.origin + /external-service-signin`, never the stored `redirect_uri`.
- Chat.
- Renaming the Service ID of a stored OAuth service (see design, Risks).

## Impact

- **Shared components:** `ResourceOAuthSection`, `ResourceAuthTypeSection` and `ResourceAuthentication` are shared with toolsets (`Assets/Entities/Toolsets`); every new behaviour sits behind a prop that only `ResourceMultiAuth` sets, so toolset rendering and payloads are unchanged.
- **Models:** `DialToolsetResourceAuthSettings` gains `discovery_url` and `dynamically_registered`.
- **i18n:** new keys in `ToolsetI18nKey` / `ExternalServiceI18nKey` and `locales/en.ts`.
- **Server actions:** none new. `updateApp` already PUTs the whole application; `router.refresh()` after a successful save re-reads it.
- **Backend dependency:** requires a DIAL Core that includes epam/ai-dial-core#2311 (0.50 patch). An older Core rejects `discovery_url` as an unknown field.
- **Docs:** `docs/INFRA-CHANGELOG.md` (`0.24.0` section). The admin deployment guide and Helm values live in other repos and are out of this change.
