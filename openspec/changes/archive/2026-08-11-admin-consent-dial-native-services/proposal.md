## Why

DIAL Core is gaining a `DIAL_NATIVE` external-service authentication type (`ai-dial-core` PR #1815): a
headless application — the Scheduler — acting as a user who is not present, through that user's own
offline credentials. Two independent decisions authorize it. The user enables offline access in Chat
(out of scope here). **A DIAL administrator approves a specific application's use of the service — and
that approval reaches every user in the installation who has enabled offline access, not only users who
opted into that application.** This admin UI is the only place that decision is made, and the only place
an admin learns how far it reaches.

Nothing about the current external-services row can express that. Worse, the row is actively misleading
for the new type before a single line of consent code exists:

- `ExternalServiceAuthButtons.tsx:251` returns early only for a missing or `NONE` auth type, so any
  unrecognised type — `DIAL_NATIVE` included — renders **Log in** / **Log out**. Core rejects sign-in for
  `DIAL_NATIVE` at both levels with a 400, so the button is guaranteed to fail.
- `ResourceMultiAuth.tsx:196-204` paints the status dot green when *either* `user_level_auth_status` or
  `app_level_auth_status` is `SIGNED_IN`. For `DIAL_NATIVE`, core deliberately fills
  `user_level_auth_status` with *the viewing admin's own* offline-credential state
  (`ExternalServiceStatusEnricher.enrich`), so the dot goes green because the admin personally connected
  offline access — while the application is unapproved and every scheduled run will fail.
- `ResourceAuthentication.tsx:90` does `authOptions.find(...)!` on the selected type. An unrecognised type
  is not in `authOptions`, so a read-only admin opening that service's edit form gets a `TypeError` on
  `config.icon` and loses the panel.

All three are latent today for any auth type the frontend enum does not know; `DIAL_NATIVE` is the first
one that will actually arrive.

## What Changes

- **Row action dispatches on `authentication_type`, by known value.** `OAUTH` and `API_KEY` keep today's
  Log in / Log out behaviour untouched. `DIAL_NATIVE` gets consent actions and never a Log in action in
  any state. An unrecognised type renders **no action at all** — replacing the current
  "unknown ⇒ Log in" fall-through.
- **Consent state is read from the payload the list already returns.** `auth_settings.app_level_auth_status`
  maps to approved (`SIGNED_IN`) / not approved (`SIGNED_OUT`), rendered with consent wording — `Approved`,
  never `Signed in`. No new read endpoint.
- **`user_level_auth_status` is suppressed for `DIAL_NATIVE` rows**, in both the status dot and any label.
  It describes the current admin, not the application's users, and is the row's most dangerous misread.
- **Grant flow**: `Grant consent` → confirmation dialog naming the installation-wide blast radius →
  `POST /v1/applications/{appId}/external-services/{id}/consent` → re-read the app so the row reflects what
  Core stored. Because the reach is installation-wide, the confirmation applies to *granting*, not only
  withdrawing.
- **Withdraw flow**: same shape over `DELETE`. A `false` response body means "nothing to withdraw" and is
  treated as success, not an error.
- **Consent actions are hidden from read-only admins.** Core gates on admin access and returns 403, but a
  visible button that always fails generates support pressure to loosen the server check — the exact
  self-approval path the core design closed.
- **`DIAL_NATIVE` is displayed but not selectable in the auth-type selector.** Declaring the service is an
  app-manifest act; approval is the only mutation this UI offers on such a row. The type renders as a
  non-clickable card with no auth-settings fields, which also removes the `find(...)!` crash.
- **A `DIAL_NATIVE` row offers no Edit and no Delete** — consent is literally its only mutation. Besides
  matching the declaration model, this prevents renaming an approved service's Service ID, which would
  silently orphan its consent record. Unrecognised types keep both actions so they remain removable.

Non-goals, and deliberately so:

- The user-facing offline-access flow in Chat, the Scheduler client, and any Core change.
- Who granted consent and when. Core drops it from the stored record on purpose; the audit log
  (`event=external_service_consent`, with `admin_user_id`) is the system of record. The row shows approved /
  not approved only.
- A count of affected users. Obtaining it means enumerating every user bucket, which the Core storage
  design specifically avoids. The dialog copy carries the scope in words instead.
- Creating a `DIAL_NATIVE` service from this UI.
- Any cross-application "unapproved services" indicator. The Assets → Applications list is metadata-only
  (`assetApi.list` → `toResourceInfoList`: name, path, version, author, timestamps), carries no
  `external_services`, and Core cannot enrich a metadata listing — marking rows would cost one content
  fetch per application. The only fallback (mark it on the application page) is where this change already
  renders the state, so it would ship nothing.
- An IdP-readiness warning on the consent dialog. The gap is installation-level provisioning while consent
  is per-application, and Core already fails legibly with a 503 at redemption.

## Capabilities

### New Capabilities

None. Admin consent is a new action on an existing capability's screen, reading an existing status field.

### Modified Capabilities

- `app-external-services-auth`: the row's action is dispatched on `authentication_type` instead of
  rendering Log in for anything non-`NONE`; an unrecognised type renders no action; `DIAL_NATIVE` rows
  render approval state plus grant/withdraw and suppress `user_level_auth_status`; the auth-type selector
  displays a non-selectable `DIAL_NATIVE` card for a service already declared with that type.

## Impact

**Code**

- `src/models/dial/resource.ts` — `ToolsetAuthType.DIAL_NATIVE`. Shared with toolsets, so the toolset
  caller must exclude it (Core's validator rejects `DIAL_NATIVE` outside external services).
- `src/components/Assets/Resources/Auth/` — `ExternalServiceAuthButtons` (dispatch), `ResourceMultiAuth`
  (status dot, row layout), `ResourceAuthentication` / `ResourceAuthTypeSection` (non-selectable card, crash
  fix), `external-service-auth-utils.ts` (approval predicate), plus a new consent-action component and
  confirmation dialog.
- `src/app/[lang]/assets-applications/actions.ts` — two new server actions.
- `src/server/core/` — a new API class for `/v1/applications/{appId}/external-services/{id}/consent`. This
  is a **new URL family** for the frontend: external services are currently written through the application
  PUT, and sign-in/out goes to `/v1/ops/external-service/*`.
- `src/constants/i18n.ts`, `src/locales/en.ts` — dialog and row copy, which is a deliverable of this change
  rather than decoration.

**API**

- Depends on `ai-dial-core` PR #1815 landing as-is. Verified against `b8efa89`: no request body, no query
  parameters, bare boolean response, level fixed to `APPLICATION`, 403/400/404/500 mapped through
  `ExternalServiceErrors`. There is a fifth failure the original plan did not list —
  `400 "Application-level consent is not supported for: {appId}"` when the credentials locator has no
  `APPLICATION` descriptor — handled the same way as the other 400.
- `appId` may contain slashes and spaces (`public/my app`). Core decodes the path segment-wise, which
  `encodeCorePath` already matches; raw application paths must never be concatenated into the URL.
- The change degrades safely if `DIAL_NATIVE` reaches the config module before the consent endpoints do: an
  unrecognised type renders no action, and a missing `app_level_auth_status` — which Core leaves absent for
  a userless caller — is treated the same way.

**Systems**

- No Core change, no new dependency, no schema migration. The boolean response body needs no plumbing:
  `ServerActionResponse.response` is typed `T extends object`, and both `true` and `false` are success.
