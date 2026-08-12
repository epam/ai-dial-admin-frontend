## Why

Three related bugs in the Applications → Properties → External Services flow were reported
close together (#3970, #3971, #3976): the auth type selector offers an invalid "Without
authentication" option, duplicate Service IDs silently overwrite each other instead of being
rejected, and logging in to an external service fails with a Bad Request whenever the app's
folder path contains a space. All three sit in the same small surface
(`ResourceMultiAuth`/`ResourceAuthentication` and the external-service sign-in/sign-out server
actions), so they're fixed together in one change.

## What Changes

- Add an `excludeAuthTypes?: ToolsetAuthType[]` prop to `ResourceAuthentication` and pass
  `[ToolsetAuthType.NONE]` from `ResourceMultiAuth` so "Without authentication" is no longer
  selectable for external services (it remains available for Toolsets, which don't pass the prop).
- Validate Service ID uniqueness in `ResourceMultiAuth` on both Add and Edit(rename): if the
  entered ID matches another existing entry, show a field-level error and disable the Apply
  button. The check compares the entered ID against every other key in `external_services`,
  excluding the entry's own original ID (so re-saving without renaming is unaffected).
- Fix external-service sign-in/sign-out URL construction to per-segment URL-encode the app path
  using the existing `encodeCorePath` helper (`@/src/server/publications/path`), so folder names
  containing spaces (or other reserved characters) no longer produce a malformed `url` and a
  Bad Request from the backend.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `app-external-services-auth`: the auth type selector no longer offers "Without authentication";
  adding/renaming a service now validates against duplicate Service IDs; the sign-in/sign-out
  `url` field is now segment-encoded so paths with spaces work.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Resources/Auth/ResourceAuthentication.tsx`
- `apps/ai-dial-admin/src/components/Assets/Resources/Auth/ResourceMultiAuth.tsx`
- `apps/ai-dial-admin/src/app/[lang]/assets-applications/actions.ts`
- No new i18n key needed — reuses the existing `ErrorI18nKey.NameExists` message
- No backend changes; no breaking changes to existing Toolset auth usage (Toolsets continue to
  offer all three auth types, unaffected by the new `excludeAuthTypes` prop).
