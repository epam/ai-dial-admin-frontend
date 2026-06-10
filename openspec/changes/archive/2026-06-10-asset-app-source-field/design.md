## Context

The shared source model (`SOURCE_FIELD` in `components/SourceField/types.ts`) and the shared `SourceField` editor already exist and are used by Models, Toolsets, Adapters, Interceptors, and regular `DialApplication`. Asset applications (`AssetApp`, route `AssetsApplications`) were the one holdout: they kept a flat `applicationTypeSchemaId` field and a bespoke `DialRadioGroup`-based `ApplicationSource.tsx` editor. The prior `application-source` spec made this explicit ("AssetApp MUST NOT gain a source field"), justified by the asset/publication wire format being unchanged.

Backend PR #907 changes the application-resource DTOs to use the polymorphic `source` object, so the asset format now matches the regular application format. This removes the only reason for the carve-out.

`AssetApp` is defined as `DialFile & Omit<DialApplication, 'source'> & EntityValidityState` plus extra fields including the flat `applicationTypeSchemaId`. Because it deliberately omits `source`, it cannot use the shared `SourceField` without a model change.

## Goals / Non-Goals

**Goals:**
- `AssetApp` uses the same `source` model and `SourceField` editor as regular applications.
- The asset source dropdown offers exactly **Endpoints** and **App Runner** (`SCHEMA`).
- Net deletion of bespoke code (`ApplicationSource.tsx` + its `constants.ts`).
- Behavior parity with today's radio editor (same field-reset on source switch).

**Non-Goals:**
- No Application Container source type for assets.
- No change to regular `DialApplication`, the runner editor, or endpoint/MCP field storage.

## Decisions

### 1. Make `AssetApp` inherit `source`, drop the flat field from the base model
`AssetApp` already extends `DialApplication` (it only subtracts `source` via `Omit`). Remove that `Omit` so `AssetApp` inherits `source: SOURCE_FIELD | undefined`. Then remove the flat `applicationTypeSchemaId` from **`DialApplication`** itself — not just from `AssetApp` — because AssetApp would otherwise keep inheriting it from the base model. The flat field is dead on the base: only the bespoke `ApplicationSource` (being deleted) and AssetApp paths read it; regular applications already use `source`.

- *Why:* one model, one editor, one validator, zero flat schema fields. The schema id lives at `source.applicationTypeSchemaId`, read via the existing `getSchemaSourceId(source)` helper.
- *Note on coupling:* `AssetApp` and `DialApplication` are already coupled at the type level via inheritance; removing the `Omit` reuses that, it does not add new wiring. Genuinely decoupling the two interfaces is out of scope.
- *Alternative considered:* keep both fields and sync them. Rejected — dual sources of truth, exactly the smell the backend PR removes. Also rejected: leave the base field and `Omit<DialApplication, 'applicationTypeSchemaId'>` on AssetApp — more verbose and leaves a dead field on the base model.

### 2. Reuse `SourceField` with a new route-scoped item list
Add `ASSET_APPLICATION_SOURCE_ITEMS = [ENDPOINTS, SCHEMA]` to `SourceField/constants.ts` and wire `ApplicationRoute.AssetsApplications` into `getItems()`. In `Assets/Apps/Properties.tsx`, replace `<ApplicationSource>` with `<SourceField view={AssetsApplications} sourceItems={ASSET_APPLICATION_SOURCE_ITEMS} runners={runners} ...>`, mirroring `Applications/View/Properties/Properties.tsx`.

- *Why:* the dropdown selector, SCHEMA→`AppRunners` panel, ENDPOINTS→`Endpoints` panel, and `isValidSourceField` SCHEMA/ENDPOINTS branches already exist and need no new behavior.
- *Note:* no `getContainers` prop is passed for assets, and `CONTAINER` is not in the item list, so no container UI appears.

### 3. Extend the stale-field reset to AssetsApplications
`SourceField.onChangeSource` clears app-specific fields (`mcp`, `viewerUrl`, `editorUrl`, `applicationTypeSchemaId`, `applicationProperties`, `responsesEndpoint`) only when `view === ApplicationRoute.Applications`. Extend the condition to also include `AssetsApplications`.

- *Why:* preserves the field-clearing parity that `ApplicationSource.handleRadioChange` provided.

### 4. Migrate reads and delete the bespoke component
Replace `(asset).applicationTypeSchemaId` reads with `getSchemaSourceId(source)` in `getAppRunner` and `Assets/Apps/Properties.tsx`; drop the `|| (entity as AssetApp).applicationTypeSchemaId` fallbacks in the two interceptor views (the `getSchemaSourceId` branch now covers assets). Update `ApplicationRunners/View/View.tsx:228` to write the schema source. Delete `ApplicationSource.tsx` and its `constants.ts` once no importers remain.

## Risks / Trade-offs

- [Asset payload now sends `source` instead of `applicationTypeSchemaId`] → Aligns with backend PR #907; verify `assets-applications/actions.ts` passes the entity through without remapping. If the backend PR is **not yet merged** when this ships, the asset save/load would break. → Gate on #907 being merged/deployed before release; flag in the PR description.
- [`getAppRunner` accepts both `DialApplication | AssetApp` and currently checks the flat field] → After migration both branches resolve through `source`; keep the `editorUrl` match as a fallback. The `AssetApp`-flat test cases in `ParametersTab/tests/utils.spec.ts` must be updated to use `source`.
- [Hidden readers of `AssetApp.applicationTypeSchemaId`] → A repo-wide grep is part of the tasks; the type removal makes any missed site a compile error in strict mode.
