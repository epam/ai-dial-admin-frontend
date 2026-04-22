## Why

The backend (`ai-dial-admin-backend` PR #860) removes `customAppSchemaId` from `ApplicationDto` and introduces a polymorphic `source` field discriminated by `$type`. FE currently passes `DialApplication` straight to the API with no transformation layer, so the breaking change would cause silent data loss on create/update and broken reads from the API.

## What Changes

- **`DialApplication` model** — remove `customAppSchemaId`, add `source?: ApplicationSource` (discriminated union: `endpoints` | `schema`)
- **`ApplicationSource.tsx`** — all reads/writes of `customAppSchemaId` migrate to `source`; the existing `SourceType` radio-button behaviour is unchanged
- **`ParametersTab/utils.ts`** — `getAppRunner()` reads schema ID via `source` instead of `customAppSchemaId`
- **`ApplicationAppRoutes.tsx`**, **`CollapsableInterceptors.tsx`**, **`AdditionalProperties.tsx`**, **`Interceptors.tsx`** — guard checks on `customAppSchemaId` replaced with `source`-based checks
- **`ApplicationRunners/View/View.tsx`** — `initialValues` for regular-app creation uses `source` instead of `customAppSchemaId`
- **Utility helper** — `getSchemaSourceId(source?)` extracts `applicationTypeSchemaId` from a source value, keeping callsites readable

## Non-goals

- Container source type (`$type: 'container'`) — not supported in this change
- `AssetApp` / asset-applications flow — uses a separate API (`assetsApi`) and its own `applicationTypeSchemaId` field; no changes
- Core application endpoints — share the same `DialApplication` type and are covered automatically by the model change; no extra adapter needed
