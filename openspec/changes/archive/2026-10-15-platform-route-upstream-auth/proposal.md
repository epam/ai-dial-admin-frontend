## Why

DIAL Core 0.49.0 lets global routes choose whether an upstream key is sent as `API-KEY` or as a Bearer authorization header. Assets > Routes currently has no control for that Core-owned setting, and duplicating a route already configured with `BEARER` fails because Core does not return its write-only key.

## What Changes

- Add an upstream authentication-type selector to the Assets > Routes editor, with Core-compatible `API_KEY` and `BEARER` values.
- Preserve Core's default behavior by treating an absent stored value as `API_KEY`.
- Require a newly entered key when a new route upstream, or an upstream newly switched to `BEARER`, needs one.
- Let a duplicate of a route with Bearer upstreams collect replacement key values before creation, so it retains its Bearer configuration without exposing the source secret.
- Keep a failed duplicate on the list and surface Core's error; navigate to the clone only after a successful create.
- Keep route writes from replacing a stored upstream secret with an empty value.

### Non-goals

- Do not add this selector to admin-backend entity Models or Routes.
- Do not expose it for platform models, application routes, App Runner routes, or upstream interface overrides, because Core does not use it there.
- Do not read, reveal, or silently copy a stored upstream key.
- Do not add a server-side Core clone API.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `platform-routes`: Support Core upstream authentication type configuration and safe duplication of Bearer-authenticated platform routes.

## Impact

- Shared upstream transport model and editor, with the control enabled only by Assets > Routes.
- Platform route create/update payload normalization and duplicate flow in `BaseAssetList`/`DuplicatePlatformAsset`.
- Platform route, duplicate-modal, shared-editor, server-action, and payload utility tests.
- No admin-backend API contract changes; platform routes continue to read and write directly to DIAL Core.
