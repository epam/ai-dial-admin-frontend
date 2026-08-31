## Why

DIAL Core PR #1813 changed how it keys app-runner schemas in its config-map — from the canonical prefix path (`schemas/platform/{name}`) to the schema's `$id` directly. The admin FE still passes the old prefix-based key, so the Parameters tab on `Assets > App Runners` always returns "Schema not found".

## What Changes

- Remove the pre-encoding (`toCoreRunnerName`) applied to `runner.$id` before passing it to `getResolvedRunnerSchema` in `Parameters.tsx` and `View.tsx` — the `AppRunnerSchemaApi.resolvedSchema` method already handles the one `encodeURIComponent` needed for the URL query param.
- Update the stale comment in `AppRunnerSchemaApi` that describes the lookup key as `schemas/platform/{name}`.
- Update the two tests that assert the now-incorrect double-encoded form.

## Capabilities

### New Capabilities

_(none — this is a bug fix)_

### Modified Capabilities

- `app-runner-resources-core-api`: The "Resolved parameters" requirement's scenario must change: the `id` query param sent to Core is now the runner's `$id`, not `schemas/platform/{encoded $id}`.

## Impact

- `src/components/Assets/Platform/AppRunners/Parameters.tsx` — call site fix
- `src/components/Assets/Platform/AppRunners/View.tsx` — call site fix
- `src/server/core/app-runner-schema-api.ts` — comment update
- `src/app/[lang]/platform-app-runners/actions.spec.ts` — test assertion update
- `src/components/Assets/Platform/AppRunners/tests/Parameters.spec.tsx` — test assertion update
- No change to `Entities > Application Runners` (uses a different API path)
