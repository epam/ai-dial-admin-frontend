## Why

Duplicating an Application whose `external_services` includes an OAuth-authenticated entry fails with
`Bad Request: CLIENT_SECRET is required for OAUTH authentication` (GitHub #4390). Core never returns
the real `client_secret` on read, so the duplicated payload carries an OAuth `auth_settings` block
missing the one field Core requires for that type. Toolsets hit the identical problem for their own
(single, top-level) `auth_settings` and already fix it — on duplicate, an OAuth `auth_settings` is
reset to `{ authentication_type: NONE }` — in `DuplicateAsset.tsx` and `DuplicateToolset.tsx`. That
reset never runs for Applications because it only inspects a toolset-shaped `auth_settings` field;
Applications carry their auth per-entry under `external_services`, a shape the check never looks at.

`DuplicatePlatformAsset.tsx` (the platform-bucket duplicate modal for both Applications and Toolsets)
has no such reset at all, so a platform-bucket OAuth Toolset hits the same failure today too, via the
same root cause, just undetected until now.

## What Changes

- `DuplicateAsset.tsx` (public-bucket Applications/Toolsets): extend the existing OAuth-reset check to
  also walk `external_services`, resetting any service whose `auth_settings.authentication_type ===
  OAUTH` to `{ authentication_type: NONE }`. Non-OAuth services (`API_KEY`, `DIAL_NATIVE`, `NONE`) are
  untouched — their real credentials live behind a separate sign-in/consent flow, not in this field.
  Service `display_name`/`description` are preserved; only that service's `auth_settings` is replaced.
- `DuplicatePlatformAsset.tsx` (platform-bucket Applications/Toolsets): port the same two resets —
  the existing toolset `auth_settings` reset (currently only in `DuplicateAsset.tsx`) and the new
  `external_services` walk — so platform-bucket duplication gets the same protection.
- No change to the toolset-only `DuplicateToolset.tsx` path (legacy `Toolsets` view) — it already
  resets OAuth `auth_settings` and has no `external_services` field to walk.

## Capabilities

### Modified Capabilities

- `app-external-services-auth`: duplicating an Application with an OAuth external service now resets
  that service's `auth_settings` to `NONE` instead of carrying over an incomplete OAuth block, for both
  public- and platform-bucket duplication.
- `platform-toolsets`: duplicating a platform-bucket Toolset with OAuth `auth_settings` now resets it
  to `NONE`, matching the existing public-bucket behavior.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Deployments/DuplicateAsset.tsx`
- `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx`
- Their existing test files (`DuplicateAsset` currently has no dedicated spec file — check before
  writing tests; `DuplicatePlatformAsset.spec.tsx` exists and needs new cases)
- No API/backend change — client-only, avoids ever sending an incomplete OAuth block instead of relying
  on Core's rejection.

## Non-goals

- Not implementing the issue's alternative ("prompt the user to re-enter the secret before
  finalizing") — clearing to `NONE` and letting the user re-configure auth after duplicating is the
  chosen approach, consistent with the existing Toolset behavior.
- Not touching `API_KEY`/`DIAL_NATIVE` external services or toolset auth — those don't carry a
  duplicable secret in `auth_settings` today.
- Not changing `DuplicateToolset.tsx` (legacy `Toolsets` view) — already correct.
