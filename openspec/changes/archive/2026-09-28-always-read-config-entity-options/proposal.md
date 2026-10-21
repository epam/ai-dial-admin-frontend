## Why

`getConfigEntityOptions` currently treats `DIAL_ADMIN_API_URL` as a prerequisite for listing config-file entities, even though that listing is served by DIAL Core. Deployments without the admin backend consequently omit valid Core configuration-file options from pickers.

## What Changes

- Always issue the DIAL Core config-file name read when composing entity-picker options, independent of whether `DIAL_ADMIN_API_URL` is configured.
- Preserve the existing union, partial-failure reporting, and API-written metadata read behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `core-config-file-client`: Picker option composition must include the config-file population regardless of admin-backend configuration.

## Impact

- `apps/ai-dial-admin/src/server/config-entities/read.ts` and its focused unit tests.
- `openspec/specs/core-config-file-client/spec.md` requirement for the two Core populations.
- No API contract, UI component, or dependency changes.

## Non-goals

- Changing the `DIAL_ADMIN_API_URL` behavior of any admin-backend client.
- Altering option normalisation, duplicate precedence, or partial-read failure handling.
