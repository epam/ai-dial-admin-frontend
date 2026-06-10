## Why

Backend PR [epam/ai-dial-admin-backend#907](https://github.com/epam/ai-dial-admin-backend/pull/907) replaces the flat `applicationTypeSchemaId` field on the application-resource DTOs with a polymorphic `source` object (`{ $type: 'schema' | 'endpoints', applicationTypeSchemaId? }`). Regular `DialApplication` editing already uses the shared `source` model and `SourceField` component, but **Asset applications** (`AssetApp`) were deliberately left on the old flat field and a bespoke radio-group editor because the asset/publication wire format had not changed. PR #907 changes that format, so the carve-out is now stale and the asset path must align.

## What Changes

- **BREAKING (FE internal):** `AssetApp` gains `source?: SOURCE_FIELD` (inherited from `DialApplication`) and drops the flat `applicationTypeSchemaId`. Schema id is now read via the existing `getSchemaSourceId(source)` helper and written into `source.applicationTypeSchemaId`.
- The ~6 code sites that read/write `(asset).applicationTypeSchemaId` migrate to the `source` helpers; the dead `|| applicationTypeSchemaId` fallbacks already present in the interceptor views are removed.
- The bespoke `ApplicationSource.tsx` radio-group editor is replaced by the shared `SourceField` component, wired with a new `AssetsApplications` route entry.
- A new `ASSET_APPLICATION_SOURCE_ITEMS` list offers exactly two source types — **Endpoints** and **App Runner** (`SCHEMA`). No Application Container option (matches today's radio choices).
- `SourceField.onChangeSource`'s stale-field reset, today gated to `ApplicationRoute.Applications`, is extended to also cover `AssetsApplications`.
- `ApplicationSource.tsx` and its local `constants.ts` are deleted once unreferenced.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `application-source`: the AssetApp source editor is migrated from the pruned `ApplicationSource` component (flat `applicationTypeSchemaId`) to the shared `SourceField` component backed by `AssetApp.source`. Reverses the prior "AssetApp editor remains the pruned ApplicationSource component" requirement and the "AssetApp MUST NOT gain a source field" constraint.

## Non-goals

- No change to the regular `DialApplication` source editor (already migrated).
- No change to the application runner editor (`EndpointAndMCPContainer`).
- The Application **Container** source type is intentionally NOT offered for assets.
- No change to endpoint/MCP field storage (`entity.endpoint`, `entity.mcp` stay flat).

## Impact

- **Models:** `src/models/dial/deployment-asset.ts` (`AssetApp`).
- **Components:** `src/components/Assets/Apps/Properties.tsx`; delete `src/components/SourceField/Application/ApplicationSource.tsx` + its `constants.ts`; extend `src/components/SourceField/SourceField.tsx` and `src/components/SourceField/constants.ts`.
- **Reads migrated:** `Applications/ParametersTab/utils.ts` (`getAppRunner`), `EntityView/Interceptors/Interceptors.tsx`, `EntityView/Interceptors/CollapsableInterceptors.tsx`, `ApplicationRunners/View/View.tsx`.
- **Serialization:** asset payload now carries `source` to match backend PR #907 (verify `assets-applications/actions.ts` passes the entity through without remapping).
- **Tests:** update/extend specs touching AssetApp source; the existing `SourceField` and `application-source` test suites already cover SCHEMA/ENDPOINTS for app-like entities.
