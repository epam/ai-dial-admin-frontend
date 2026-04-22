## Why

Regular `DialApplication` has its own bespoke source UI (`components/SourceField/Application/ApplicationSource.tsx`) and its own model (`ApplicationSource`), while every other entity (Model, Toolset, Adapter, Interceptor) shares the generic `SourceField.tsx` component and the `SOURCE_FIELD` model. The divergence adds maintenance cost, forks patterns for validation / clearing / side-effects, and makes it harder to layer on future source types (containers, future BE work) uniformly across entities.

The recently archived `application-source-refactor` change aligned the `$type` discriminator of `ApplicationSource` with `SOURCE_TYPE` (shared enum). This is the natural next step: merge the models and the UI entry point so Applications edit their source through the same component as the other entities — without changing the BE wire contract that was just set.

## What Changes

- `SOURCE_FIELD` gains an optional `applicationTypeSchemaId?: string` field so a single struct covers every entity's source data.
- `DialApplication.source` changes from `ApplicationSource` to `SOURCE_FIELD`. The separate `ApplicationSource` interface is removed. `ApplicationSourceType` remains exported as an alias of `SOURCE_TYPE` for backward compatibility of ~20 consumers.
- `SourceField.tsx` widens its generic constraint to also accept `DialApplication` and learns the Applications view: ENDPOINTS and SCHEMA source types, dropdown selector (same as every other entity).
- New `components/SourceField/Endpoints/ApplicationEndpoint.tsx` — Chat + MCP inputs for Applications, sibling of `ModelEndpoint`, `ToolsetEndpoint`, etc. Writes to flat `entity.endpoint` and `entity.mcp` (no model change for those).
- `components/SourceField/Application/AppRunners.tsx` (SCHEMA branch) takes ownership of the runner-scheme fetch and `applicationProperties` default-derivation side-effect, mirroring the convention already used by `Containers.tsx`.
- `isValidSourceField` extended with a SCHEMA branch (requires `applicationTypeSchemaId`) and an Applications-specific ENDPOINTS branch (at least one of chat or MCP endpoint must be valid).
- `SourceField.onChangeSource` gets a view-aware clearing path: for `view === Applications` it also clears `mcp`, `viewerUrl`, `editorUrl`, `applicationTypeSchemaId`, `applicationProperties` on source-type change (same semantics as today's `ApplicationSource.tsx`).
- `components/SourceField/constants.ts` gains `APPLICATION_SOURCE_ITEMS = [ENDPOINTS, SCHEMA]`.
- The regular-Application view (`components/Applications/View/Properties/Properties.tsx`) switches from rendering `<ApplicationSource …>` to `<SourceField view={Applications} …>`.
- `ApplicationSource.tsx` stays in the codebase but is **pruned to AssetApp-only** — the only remaining caller is the AssetsApplications view. All `DialApplication`-specific branches are removed.
- `EndpointAndMCPContainer.tsx` stays and continues to serve the `DialApplicationScheme` runner editor (`dial:`-namespaced branches). It no longer has a DialApplication caller.
- **BREAKING (internal only)**: `ApplicationSource` interface is removed; callers that imported it must switch to `SOURCE_FIELD`.

## Capabilities

### New Capabilities

_None._ This change is a refactor of existing surfaces; no new user-visible capability is introduced.

### Modified Capabilities

- `application-source`: Updates the FE internal model and UI entry point so regular Applications use the shared `SOURCE_FIELD` struct and the shared `SourceField` component. The BE wire contract (`{ $type, applicationTypeSchemaId? }`) is unchanged. AssetApp scope is unchanged. Validation rules for the ENDPOINTS branch now allow "chat OR MCP endpoint valid" where previously they relied on the standalone `ApplicationSource.tsx` UI to enforce it implicitly.

## Non-goals

- `$type: 'container'` support for Applications. The necessary BE contract and UX semantics (endpoint derivation, MCP-in-container behavior, etc.) are not yet defined; this is a follow-up change.
- `AssetApp` migration. Assets keep their flat `applicationTypeSchemaId` field. No BE/asset-snapshot format change.
- Changes to the Application runner editor (`DialApplicationScheme`). It keeps `EndpointAndMCPContainer` as its endpoint+MCP editor and has no source dropdown (a runner has only endpoints semantics by definition).
- Wire-format sanitizer. Any irrelevant `SOURCE_FIELD` fields on `DialApplication.source` that happen to be undefined are dropped by JSON serialization; branch components only write fields relevant to their own `$type`.

## Impact

**Code:**

- Type change: `SOURCE_FIELD` (add `applicationTypeSchemaId?`), `DialApplication.source` (was `ApplicationSource`, now `SOURCE_FIELD`).
- New file: `components/SourceField/Endpoints/ApplicationEndpoint.tsx`.
- Modified files: `components/SourceField/SourceField.tsx`, `components/SourceField/Endpoints/Endpoints.tsx`, `components/SourceField/Application/AppRunners.tsx`, `components/SourceField/Application/ApplicationSource.tsx` (pruned), `components/SourceField/constants.ts`, `components/SourceField/utils.ts`, `utils/entities/application-source.ts`, `components/Applications/View/Properties/Properties.tsx`.
- ~20 consumers of `ApplicationSourceType` / `ApplicationSource` — in most cases nothing changes (alias), but the interface removal will surface any code that imports `ApplicationSource` as a type name.

**APIs / BE:** none. Wire contract is unchanged.

**Specs:** the existing `application-source` spec is updated via a delta in this change; AssetApp-scoped language stays.

**Tests:** `utils/entities/tests/application-source.spec.ts`, `components/SourceField/utils.spec.ts` / `tests/utils.spec.ts` need updates to cover the new validator branches. New tests for `ApplicationEndpoint.tsx` and the updated `SourceField` behavior when `view === Applications`.

**Risk:** low. This is a like-for-like refactor that keeps today's UX (radio → dropdown is a small visible UX change), keeps all field locations for `endpoint`/`mcp`/`applicationProperties`, keeps the wire contract, and scopes AssetApp out. The main risks are missed consumers of the removed `ApplicationSource` type (caught by `tsc`) and subtle validation drift (covered by extending `isValidSourceField` tests).
