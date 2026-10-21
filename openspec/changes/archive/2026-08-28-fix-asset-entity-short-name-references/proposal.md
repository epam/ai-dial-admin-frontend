## Why

DIAL Core PR #1813 re-keyed the merged `Config` maps for models, applications, toolsets, interceptors, and roles from their canonical id (`{type}/platform/{name}`) to the **bare short name**. A reference is now validated with a plain `containsKey(ref)` against that short-name key. The admin frontend still stores the old canonical form for API-written (platform) entities, so any dependency the UI attaches — an interceptor on a model, a role on a route/key — is written as e.g. `interceptors/platform/my-ic`, which Core can no longer resolve. Issue #4309 is the reported instance: saving a model with an Assets-created interceptor fails with `Interceptor 'interceptors/platform/<name>' not found in config`. This is a P1 affecting every asset-entity dependency picker for the five short-name-keyed types.

## What Changes

- **Reference form for the five short-name-keyed types (models, interceptors, roles, applications, toolsets) becomes the bare name regardless of origin.** The central helper `getConfigEntityReference` and the model-specific `getModelDeploymentId` stop emitting `{type}/platform/{name}` for API-written entities and emit `option.name` instead. This is what Core's `containsKey` now resolves against.
- **Routes and keys keep their canonical id.** Core still keys routes as `routes/<bucket>/<name>` and keys as `keys/<bucket>/<name>` for blob/API-sourced entries (`MergedConfigStore.isShortNameKeyed` returns false for `ROUTE` and `PROJECT_KEY`; the structural pass carves them out as "key by canonical id legitimately"). Converting them to short names would invert the bug. `getConfigEntityReference` therefore becomes type-aware, not just origin-aware: short-name form for the five types, canonical form for routes and keys.
- **App runners (`APP_TYPE_SCHEMA`) keep their own keying** — Core keys schemas by JSON-Schema `$id`, a separate mechanism, untouched here.
- **The config-file / platform merge collapses on name collision, platform wins.** `unionConfigEntityOptions` currently emits two options when a name exists in both populations, because the two reference forms were distinct keys. After the short-name change both populations produce the same reference, so two options would be a duplicate row. Core's new semantics are that a blob (platform) entry supersedes the file entry via ordinary `Map.put`; the merge must match that — keep only the API/platform option on a name collision, drop the config-file duplicate.
- Update the specs that encode the old canonical-id reference form and the "keep both on collision" merge rule to the new behavior.
- Update the unit specs that assert the old literal forms (`utils/config-entities/tests/options.spec.ts`, `utils/models/tests/deployment-id.spec.ts`).

### Non-goals

- No change to how entities are **read/listed** from Core (metadata + config-file routes), only to the reference stored when one is selected as a dependency and to the merge of the two populations.
- No change to routes, keys, or app-runner (schema) keying — those remain canonical / `$id`.
- No change to the admin-BE-vs-Asset interceptor merge (`mergeInterceptorOrigins`) — that is a different population pair from the config-file/platform merge.
- No change to the blob-storage resource path prefixes used by the publications resolver (`APPLICATIONS_PREFIX = 'applications/'`, `TOOLSETS_PREFIX = 'toolsets/'`); those describe storage paths, not `Config` map keys.

## Capabilities

### New Capabilities
<!-- None — this corrects existing reference-form behavior, it does not introduce a new capability. -->

### Modified Capabilities
- `core-config-file-client`: owns the per-origin reference-form contract and the merge rule. The reference-form requirement changes — the five short-name-keyed types (models, interceptors, roles, applications, toolsets) are now referenced by bare name from both populations, not by canonical id for the API-written half; routes and keys keep their canonical-id form. The "keep both entries on a name collision" merge requirement changes to "platform wins, collapse the duplicate".
- `assets-models`: the canonical deployment-identity requirement changes — the identifier callers use to invoke an API-written model is now the bare name, so the detail view surfaces the bare name, not `models/platform/{name}`.

The other asset-entity capabilities (`assets-interceptors`, `assets-roles`, `assets-app-runners`, `assets-routes`, `assets-keys`) consume the shared helpers governed by `core-config-file-client`; their spec text does not itself assert a reference form, so they need no delta — the behavior change flows through the shared helper.

## Impact

- **Code:**
  - `utils/config-entities/options.ts` — `getConfigEntityReference` becomes type-aware (short-name form for the five short-name-keyed types; canonical form for routes/keys); `unionConfigEntityOptions` collapses on name collision keeping the API/platform option.
  - `utils/models/deployment-id.ts` — `getModelDeploymentId` returns the bare name.
  - `utils/config-entities/rows.ts` — unchanged structurally, but the `name` it carries is now the bare form for the five types.
  - Matching logic (`getInterceptorsGridData`, `getRolesGridData`) is form-agnostic (`name === selected`) and works either way once both sides agree; no change expected, but must be re-verified.
  - Consumers that **parse** a stored reference back out (e.g. strip a `{type}/platform/` prefix to recover a display name) will break if not updated — an audit task covers this. Known prefix consumers: `utils/deployment-navigation.ts` (`APPLICATIONS_PREFIX`), `server/publications/resolver/registry.ts`, `components/Applications/ParametersTab/utils.ts`, `utils/toolset/toolset-auth.ts`. These touch blob-storage paths, not stored config references, so are likely unaffected — the audit confirms rather than assumes.
- **Tests:** `utils/config-entities/tests/options.spec.ts` (the "two distinguishable options" and "canonical id" assertions flip), `utils/models/tests/deployment-id.spec.ts` (expects bare name), `utils/config-entities/tests/rows.spec.ts` (`interceptors/platform/from-api` → `from-api`), `server/config-entities/tests/read.spec.ts`.
- **Backend dependency:** requires DIAL Core at or past PR #1813 (`a61481de`, "short-name resolution via direct keying"). The frontend change is correct only against that Core version; against an older Core it would break the five types. No admin-backend change.
- **Migration:** existing stored resources that already carry canonical-id references (e.g. a model saved before this change with `interceptors/platform/my-ic`) will, on Core #1813, already be failing to resolve — Core's known migration note covers operators reconfiguring such references to short names. The frontend fix prevents *new* bad writes; it does not rewrite existing stored references.
