## Context

The recently archived `application-source-refactor` aligned `ApplicationSource.$type` with the shared `SOURCE_TYPE` enum used by `SOURCE_FIELD` (Model/Toolset/Adapter/Interceptor). That removed the enum-type divergence but left two structural asymmetries in place:

1. Two models: `ApplicationSource { $type, applicationTypeSchemaId? }` vs. `SOURCE_FIELD { $type, containerId?, runnerName?, adapterName?, completionEndpointPath?, configurationEndpointPath?, serverName?, serverVersion? }`.
2. Two source editors: `SourceField.tsx` (generic dropdown → per-$type panel) for every entity except applications; `ApplicationSource.tsx` (radio group → chat/MCP checkboxes or runner picker) for applications and asset-applications.

The BE wire contract for `ApplicationDto.source` was finalized last week as `{ $type: 'endpoints' }` or `{ $type: 'schema', applicationTypeSchemaId }`. This change keeps that contract while collapsing the FE duplication.

## Goals / Non-Goals

**Goals:**

- Regular `DialApplication` edits its source through the same `SourceField.tsx` component used by Model/Toolset/Adapter/Interceptor, with the same dropdown UX.
- One FE struct — `SOURCE_FIELD` — covers every entity's source data. No parallel `ApplicationSource` interface.
- Per-`$type` panels live where other entities' panels live: `components/SourceField/Endpoints/*`.
- Per-branch side-effects (e.g. runner-scheme defaults derivation) live inside the branch component, consistent with how `Containers.tsx` derives `completionEndpointPath`.
- Validation stays in one place (`isValidSourceField`).
- `DialApplication`'s `endpoint`, `mcp`, `viewerUrl`, `editorUrl`, `applicationProperties`, `applicationTypeSchemaId` remain as flat top-level fields on the entity. No data migration.

**Non-Goals:**

- `$type: 'container'` for Applications. Deferred — needs BE verification and UX semantics (how a container URL maps to `entity.endpoint` vs `source.completionEndpointPath`, MCP-in-container semantics, etc.).
- `AssetApp` migration. Assets keep their flat `applicationTypeSchemaId`. `ApplicationSource.tsx` remains as their editor.
- Changes to the Application runner editor (`DialApplicationScheme`). `EndpointAndMCPContainer.tsx` continues to serve it with `dial:`-namespaced field writes.
- A save-time sanitizer that strips irrelevant `SOURCE_FIELD` fields before hitting the wire. Out-of-scope by decision — we trust JSON undefined-drop + branch-local writes.
- Any change to the BE wire contract.

## Decisions

### 1. Unify the model into `SOURCE_FIELD` by adding one optional field

```ts
export interface SOURCE_FIELD {
  $type: SOURCE_TYPE;
  runnerName?: string;
  adapterName?: string;
  containerId?: string;
  completionEndpointPath?: string;
  configurationEndpointPath?: string;
  serverName?: string;
  serverVersion?: string;
  applicationTypeSchemaId?: string;  // NEW
}
```

`DialApplication.source: SOURCE_FIELD`. The `ApplicationSource` interface is removed. `ApplicationSourceType` stays re-exported as an alias of `SOURCE_TYPE` so existing imports keep working:

```ts
// models/dial/application.ts
export { SOURCE_TYPE as ApplicationSourceType } from '@/src/components/SourceField/types';
```

**Alternatives considered:**

- *Keep `ApplicationSource` separate and widen `SourceField<T>` to accept any `{ source?: { $type: SOURCE_TYPE } }`.* Rejected: leaves two parallel types forever, defeats the purpose of unifying.
- *Make `SOURCE_FIELD` a discriminated union on `$type`.* Rejected: the existing struct is a flat bag of optionals; migrating five entities to a discriminated union is a much larger blast radius than this change aims for.

### 2. UI: dropdown-everywhere, all entities route through `SourceField.tsx`

Applications drop the `DialRadioGroup` + checkbox pattern in favor of the `DialSelectField` dropdown used by every other entity. This is a visible (but small) UX change: the two existing options (Endpoints / App Runner) become a dropdown instead of a radio.

`SourceField.tsx` generic constraint widens:

```ts
// before
const SourceField = <T extends DialInterceptor | DialModel | Toolset>({ ... })
// after
const SourceField = <T extends DialInterceptor | DialModel | Toolset | DialApplication>({ ... })
```

`SourceField.tsx` gains a SCHEMA branch:

```tsx
{source === SOURCE_TYPE.SCHEMA && (
  <AppRunners
    entity={entity as DialApplication}
    onChange={onChangeEntity as (entity: DialApplication) => void}
    runners={runners}
    isEntityImmutable={isEntityImmutable}
    isModal={isModal}
    disabled={isReadonly}
  />
)}
```

**Alternatives considered:**

- *Keep radio for Applications, add a `variant` prop to `SourceField`.* Rejected: grows the component surface to preserve an inconsistency. The user explicitly chose dropdown-for-all.

### 3. Split the endpoint editor, drop the runner-editor coupling

`components/SourceField/Application/EndpointAndMCPContainer.tsx` today handles two entity shapes via `view === ApplicationRunners` branches that fork field names (`endpoint` vs `dial:applicationTypeCompletionEndpoint`, `mcp` vs `dial:applicationTypeMcp`). We split it:

- **New** `components/SourceField/Endpoints/ApplicationEndpoint.tsx` — sibling of `ModelEndpoint`/`ToolsetEndpoint`. Handles `DialApplication` only: chat endpoint checkbox + input, MCP endpoint checkbox + input with transport/forwardPerRequestKey/configDelivery. Writes to flat `entity.endpoint` and `entity.mcp` — no model change for those fields.
- `EndpointAndMCPContainer.tsx` stays, but all `DialApplication` branches are removed. It becomes exclusively the `DialApplicationScheme` editor used inside the application runner view.

`components/SourceField/Endpoints/Endpoints.tsx` gets a new case:

```tsx
{view === ApplicationRoute.Applications && (
  <ApplicationEndpoint
    entity={entity as DialApplication}
    onChange={onChange as (entity: DialApplication) => void}
    isModal={isModal}
    disabled={disabled}
  />
)}
```

**Alternatives considered:**

- *Keep one component that handles both entity shapes.* Rejected: today's `view`-branching inside `EndpointAndMCPContainer` is already the main source of complexity; splitting produces two single-purpose components that are easier to reason about and test. Slight duplication of layout markup is an acceptable cost.

### 4. Side-effects live in the branch component

Convention set by `Containers.tsx`:

```ts
// Containers.onSelect — derives completionEndpointPath for Models when a container is picked
const updatedEntity = {
  ...entity,
  endpoint: '',
  baseEndpoint: '',
  source: { ...entity.source, $type: CONTAINER, containerId: id },
};
if (view === Models) {
  updatedEntity.source.completionEndpointPath = getEndpointPrefix(...) + getEndpointPostfix(...);
}
onChange(updatedEntity);
```

We apply the same convention to `AppRunners` (SCHEMA branch). When a runner is selected:

1. Fetch the resolved scheme via `getResolvedApplicationScheme(runner.$id)`.
2. Derive defaults via `getSchemaDefaults(scheme)` as `Record<string, DefaultsValue>`.
3. Call `onChange` once with `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: runnerId }, applicationProperties }`.

`SourceField.tsx` stays fully generic — no knowledge of runners or `applicationProperties`.

**Alternatives considered:**

- *`useEffect` in the Application view watching `entity.source`.* Rejected: spreads Application-specific logic across call sites; today's pattern is self-contained inside the branch.
- *Callback prop on `SourceField` for source-type change.* Rejected: adds surface area without benefit; the branch component already owns its own selection event.

### 5. Central view-aware clearing in `SourceField.onChangeSource`

Switching source types should drop stale fields. Today:

```ts
// SourceField.tsx today — clears only endpoint
onChangeEntity({ ...entity, source: { ...entity.source, $type: sourceType }, endpoint: '' });
```

We extend it to branch on `view`:

```ts
const reset: Partial<T> = { endpoint: '' } as Partial<T>;
if (view === ApplicationRoute.Applications) {
  Object.assign(reset, {
    mcp: void 0,
    viewerUrl: void 0,
    editorUrl: void 0,
    applicationTypeSchemaId: void 0,
    applicationProperties: void 0,
  });
}
onChangeEntity({ ...entity, source: { ...entity.source, $type: sourceType }, ...reset });
```

This is the same clearing set that today's `ApplicationSource.tsx::handleRadioChange` performs. Moving it here keeps one source of truth and removes the need for branch components to clear each other's fields.

**Alternatives considered:**

- *Let branch components clear sibling fields on mount / first edit.* Rejected: risk of transient inconsistent states where both old and new fields are populated between renders.
- *Expose a `resetOnChange(type, entity)` prop.* Rejected: overkill for a ~8-line local branch. Can be added later if more views need custom clearing.

### 6. Validation extension

`isValidSourceField` grows two branches:

```ts
// components/SourceField/utils.ts
export const isValidSourceField = (entity: DialModel | DialInterceptor | Toolset | DialAdapter | DialApplication): boolean => {
  const source = entity.source;
  if (source?.$type === SOURCE_TYPE.CONTAINER)     return !!source.containerId;
  if (source?.$type === SOURCE_TYPE.ADAPTER)       return !!source.adapterName && !!source.completionEndpointPath;
  if (source?.$type === SOURCE_TYPE.RUNNER)        return !!source.runnerName;
  if (source?.$type === SOURCE_TYPE.MCP_REGISTRY)  return !!source.serverName;
  if (source?.$type === SOURCE_TYPE.SCHEMA)        return !!source.applicationTypeSchemaId;      // NEW
  if (source?.$type === SOURCE_TYPE.ENDPOINTS) {
    const app = entity as DialApplication;
    if ('mcp' in entity || 'endpoint' in entity && (app.viewerUrl !== undefined || app.editorUrl !== undefined || app.applicationProperties !== undefined)) {
      // Application case: at least one of chat endpoint or MCP endpoint must be valid
      const chatValid = app.endpoint ? getUrlError(app.endpoint, void 0, true) === null : false;
      const mcpValid = app.mcp?.endpoint ? getUrlError(app.mcp.endpoint, void 0, true) === null : false;
      return chatValid || mcpValid;
    }
    return getUrlError((entity as DialModel).endpoint || (entity as DialAdapter).baseEndpoint, void 0, true) === null;
  }
  return false;
};
```

The Application discriminator needs a concrete check — the implementation can use a narrower type-guard (e.g. `view` passed through, or a dedicated `isDialApplication(entity)` helper). Exact discriminator is an implementation detail to pick during apply; the behavior contract is: for applications, the ENDPOINTS branch is valid iff at least one of chat or MCP endpoint URL is valid.

**Alternatives considered:**

- *Application gets its own validator beside `ApplicationEndpoint.tsx`.* Rejected by user preference in explore session — prefer a single validator with a branch.

### 7. AssetApp — unchanged, component stripped

`AssetApp` keeps its flat `applicationTypeSchemaId` (the archived refactor scoped it out and that still holds). The existing `ApplicationSource.tsx` stays as the AssetApp-only editor — all DialApplication branches are removed:

- `view === ApplicationRoute.AssetsApplications` is the only path.
- The `(entity as AssetApp).applicationTypeSchemaId` accesses stay.
- The `!getSchemaSourceId(entity.source) && !(entity as AssetApp).applicationTypeSchemaId` mount-init logic simplifies to just the AssetApp case.
- Imports of `ENDPOINTS_SOURCE`, `SCHEMA_SOURCE`, `createSchemaSource`, `getSchemaSourceId` are removed as unused.

### 8. Wire-format trust, no sanitizer

`DialApplication.source` is `SOURCE_FIELD` in memory. It could carry undefined values for fields irrelevant to Applications (`containerId`, `runnerName`, etc.). JSON serialization drops undefineds, so the payload remains equivalent to today's `{ $type, applicationTypeSchemaId? }`.

Branch components only write fields relevant to their own `$type`:

- `ApplicationEndpoint` writes `entity.endpoint`, `entity.mcp` (not `source.*` beyond `$type`).
- `AppRunners` writes `source.$type = SCHEMA` and `source.applicationTypeSchemaId`.

If a stray value ever slips through (e.g. `source.runnerName` left from a copy-paste), the BE will see an extra field it doesn't care about. Acceptable risk; any real occurrence is a code bug caught in review or typing.

## Risks / Trade-offs

- **[Risk]** `ApplicationSource` interface removal breaks ~20 consumer imports. → **Mitigation:** `ApplicationSourceType` alias stays exported; `tsc` catches remaining `ApplicationSource` (the type name) references which we update in the same PR.
- **[Risk]** Radio → dropdown UX change is user-visible. → **Mitigation:** dropdown is already the established pattern everywhere else in the admin app; this is a unification, not an individual design change. Call it out in PR description.
- **[Risk]** `SourceField.onChangeSource` view-aware clearing adds a coupling to Applications that's different from other views. → **Mitigation:** kept small (single `if` block), documented in code, covered by tests.
- **[Risk]** The validator branch for Applications ENDPOINTS relies on "at least one of chat/MCP". If product later says "both required" or "MCP implies chat", the branch changes. → **Mitigation:** that's a requirement change, not an architectural one; the validator is the right place for it.
- **[Risk]** `AppRunners` now owns the async scheme fetch — any failure flow needs to be explicit (not silent). → **Mitigation:** preserve today's behavior (falls back to the unresolved runner if `getResolvedApplicationScheme` fails, same as current `ApplicationSource.onChangeAppRunner`). Tests cover happy + fallback paths.
- **[Trade-off]** Some Application-shaped clearing lives in `SourceField.tsx` (view-aware branch) rather than entity-specific. This is a pragmatic choice over plumbing a callback prop; consistent with how `Endpoints.tsx` already branches on `view`.

## Migration Plan

1. Merge model-only change: `SOURCE_FIELD += applicationTypeSchemaId?`, `DialApplication.source: SOURCE_FIELD`, drop `ApplicationSource` interface, keep `ApplicationSourceType` alias. Compile.
2. Land the UI split in the same PR (keeping it atomic is cheaper — consumers change once, not twice):
   - Add `ApplicationEndpoint.tsx`.
   - Extend `Endpoints.tsx` with the Applications route.
   - Move scheme-fetch + defaults-derivation from `ApplicationSource.tsx::onChangeAppRunner` into `AppRunners.tsx`.
   - Extend `SourceField.tsx` (type constraint, SCHEMA branch, view-aware clearing).
3. Swap the Properties.tsx caller: `<ApplicationSource>` → `<SourceField view={Applications}>`.
4. Prune `ApplicationSource.tsx` to AssetApp-only.
5. Extend `isValidSourceField` + tests.
6. Remove/adjust `application-source.ts` helpers as needed (most stay, just retyped on `SOURCE_FIELD`).
7. Run lint, tests, format.

**Rollback:** standard revert of the PR. The BE contract is unchanged, so no data rollback needed. Existing stored applications continue to work because the wire shape is identical.

## Open Questions

- *None currently open for this scope.* Container support, AssetApp migration, and runner-editor dropdown are explicitly deferred (see Non-Goals).
