## Context

`Assets > App Runners` reads and writes the runner resource through `assetApi` against DIAL Core, but four option lists still come from the admin backend. All four were verified in the code rather than taken from the previous change's notes, and the fourth was missed by that earlier audit:

| Read | Where it fires | Client |
|---|---|---|
| `interceptorsApi.getInterceptorsList` | `assets-app-runners/[id]/page.tsx`, on every detail load | `InterceptorsApi` |
| `rolesApi.getRolesList` | same page; feeds `TabsContent` → `EntityRoutes` → `RouteRoles` | `RolesApi` |
| `utilityApi.getSystemProperties` | `EntityView/Interceptors/Interceptors.tsx`, on mount | `UtilityApi` |
| `modelsApi.getModelsTopics` | `Assets/AppRunners/Properties.tsx` → `SchemeProperties` → `AppRunnerExtendedProperties` → `TopicsControl` | `ModelsApi` |

All four are constructed with `host: process.env.DIAL_ADMIN_API_URL` in `src/app/api/api.ts`; `assetApi` uses `DIAL_CORE_API_URL`.

The role list is the one the earlier audit missed. It is not decorative: `RouteRoles` intersects a route's grants with it, so a failed read makes granted roles disappear from the tab.

DIAL Core keeps each config entity type in two places, and its merged runtime configuration is the union of both — `MergedConfigStore` is defined as "the union of `FileConfigStore` and API-managed entities loaded from `ResourceService`". `ConfigPostProcessor.validateCrossReferences` checks a reference against that merged map. So the set Core will accept is exactly:

```
/v1/metadata/{type}/platform/        API-written entries ("core assets")
        ∪
/v1/admin/config/file/{type}         configuration-file entries
```

The first is blob-only by design — `ConfigResourceMetadataController`'s javadoc states "listings are now blob-only. File-sourced entries are not surfaced here; during MVP, operators consult `aidial.config.json` directly." The second closes that gap and is served by `FileConfigController` under the `ADMIN_FILE_CONFIG` route template.

## Goals / Non-Goals

**Goals:**
- No admin-backend request is required to view or configure an app runner.
- Every option offered by a picker on this surface resolves in Core's merged configuration, so a selection cannot produce a write Core rejects for an unresolvable reference.
- The shared controls this surface reuses keep their current behaviour on every other surface.

**Goals (added during implementation):**
- `Assets > Models` also stops requesting the topic catalogue. Not in the original scope, and called out here because it is real behaviour with no requirement of its own: `hasTopicCatalogue` is a single predicate keyed on the view, and `Assets > Models` is the other surface that must not reach the admin backend for a catalogue Core has no equivalent of. Gating only the runner view would have left an identical dependency in place one line away, and the models change had already established the same decision for the same reason. The `assets-models` capability spec should absorb this when that surface's own unlink lands; recorded in `tasks.md` §6 so it is not lost.

**Non-Goals:**
- The rest of the Models side of the same union. `Assets > Models` still reads its role list, interceptor list and global interceptors from the admin backend; it should consume this change's client as a follow-up. Bundling that here would make one change span two surfaces.
- Any change to `Entities > Application Runners`, which is admin-backend-backed by design.
- Writing config-file entities. That surface is read-only.
- The topic catalogue as a concept. Core has no topic registry, so there is nothing to move — only a fetch to stop making.
- The two pre-existing shared-code defects recorded in the proposal. Fixing them here would widen the diff into code this change has no other reason to touch.

## Decisions

**Read both Core populations and union them, rather than picking one.**
Reading only the metadata route would hide configuration-file entities, which Core accepts as valid references — the picker would be unable to express a valid configuration. Reading only the config-file route would hide everything created through the admin UI. The union is not a heuristic: it is the same pair `MergedConfigStore` merges and `validateCrossReferences` checks against, so the offered set and the accepted set coincide by construction.

**Do not union with the admin backend as well.**
Superficially "more complete", actually worse. The admin backend can hold an entity it has not pushed to Core; offering it would let a user select something Core then rejects with a 422 naming a reference they did not know was unresolvable. Sourcing purely from Core makes an offered option a guarantee.

**A new client rather than an extension of `AssetApi`.**
`AssetApi` is keyed by `ResourceType` over the resource and metadata route families, both of which are read-write and bucket-scoped. The config-file family is read-only, differently shaped, and not bucket-scoped. Modelling it as a `ResourceType` would mean giving `AssetApi` a type it must refuse to write — the kind of special case that invites a later caller to try. A separate small client keeps that boundary honest.

**Treat the readable type set as an explicit allow-list.**
`/v1/admin/config/file/keys` returns 403 to every caller including admin, because the file map's keys are the secrets themselves. A client that derives its supported types from the route pattern would appear to support keys and fail at runtime. The allow-list makes the constraint visible at the call site instead.

**Carry origin as data on every option; never infer it from the value's shape.**
A config-file entity is referenced by bare name, an API-written one by canonical id (`{type}/platform/{name}`). Inferring from shape — "contains a slash, therefore canonical" — breaks on a name that legitimately contains a separator, and silently writes the wrong reference. Issue #4078 hit exactly this on the runner picker, where an asset runner's reference is `schemas/platform/{encoded $id}` and an entity runner's is a bare `$id`; the fix there was an explicit origin discriminator, and section 14 of that change is the precedent to follow.

**Keep both entries when a name exists in both populations.**
Collapsing them would make the stored reference ambiguous — the two forms are not interchangeable, and Core resolves them as different keys in the same map. Both are offered, each labelled with its origin, mirroring the `Source` column pattern #4078 introduced.

**Replace the interceptor requirement rather than modify it.**
The published requirement is named "Interceptors tab uses the admin-BE interceptor list". A `MODIFIED` delta matches by exact requirement name — verified against this repo's archived deltas — so it cannot rename. Rather than leave a published requirement whose name asserts something false, the delta removes it with a reason and adds the correctly-named replacement. `RENAMED` plus `MODIFIED` on one requirement would be two operations on the same target with no precedent in this repo to confirm the tooling's ordering.

**Neither population's listing carries a description, and the union normalises down rather than up.**
This contradicts an earlier assumption and is the main thing the contract read changed. The metadata route returns `ResourceItemMetadata` — name, author, timestamps. The config-file listing returns `{name}` and nothing else. Neither carries a description or a display name; the pickers involved render exactly those two columns (`DISPLAY_NAME_COLUMN`, `DESCRIPTION_COLUMN` in `EntityView/Interceptors/utils.ts`).

Note this is stronger than "config-file rows are poorer than API rows" — the earlier framing. Both are equally poor in this respect, so the Description column is empty for every Core-sourced row, not just half of them. That is a real and visible consequence of sourcing from Core: the admin backend returned a fuller projection.

Filling it would mean a per-entity GET for every name in *both* listings — an N+1 on every picker open, for a column that is decoration. The union therefore normalises to the intersection of what both halves provide: a name, plus the origin discriminator. The origin label is what explains the emptiness rather than leaving it looking like missing data.

Alternative considered: fetch each entity lazily when a row is focused. Rejected for this change — it adds a request-per-interaction to solve a cosmetic gap, and the origin column already tells the user why the cell is empty. Worth revisiting only if descriptions turn out to matter for picking.

**The reference forms are confirmed at Core's own point of validation, not inferred.**
`MergedConfigStore.canonicalId` is `type.urlSegment() + "/" + bucket + "/" + name` — literally `interceptors/platform/{name}` — and API-written entries are inserted into the same map as file entries with that key, while file entries keep their bare config-map keys. `ConfigPostProcessor.validateCrossReferences` then resolves a reference with `interceptors.containsKey(ref)`: an exact key match, no normalisation, no fallback. So the two forms are different keys rather than aliases, and offering both populations under one form would make roughly half the options unresolvable.

One consequence worth recording: `validateSingleInterceptor` sets `interceptor.setName(canonicalId)` on API-written entries, so in Core's merged view an API-written entity's own `name` field *is* its canonical id. Any picker code that matches a stored selection against an entity's `name` — `getInterceptorsGridData` does exactly this — must compare against the reference, not the bare display name, or an API-written selection will silently fail to render as selected.

**Scope the shared-component changes per surface, not globally.**
`EntityView/Interceptors/Interceptors.tsx` and `TopicsControl` are rendered by roughly fifteen surfaces, most of them admin-backend-backed and correct as they are. The topics path here is the harder one: `TopicsControl` receives no `view` prop through `AppRunnerExtendedProperties`, which is why the models-side gate did not affect it. A `view`-based condition alone will not work — the prop has to be threaded, or the decision passed explicitly by the caller. Threading a prop through `SchemeProperties` also reaches `Entities > Application Runners`, which shares that component, so whichever mechanism is chosen must leave the entity path's behaviour intact.

## Risks / Trade-offs

- [The contract is read from source, not sampled] Every Core-side claim here comes from `epam/ai-dial-core` at a pinned commit — the route template, the response construction, the refusals and status codes are all read directly. This is the stronger source: a sample response shows one case, the handler shows every branch. What source cannot tell us is which entities a given deployment actually defines in its config file versus through the API — a data question, not a contract one. → **Not mitigated, and worth stating plainly:** no run against a live Core was carried out. Two consequences stay open. First, `ConfigFileApi.listNames` treats a missing `items` as an empty list, so a response-shape mismatch would present as a *successful* empty population — fewer options, no error, no warning. Second, `validateCrossReferences` covers `Model.interceptors`, but app-runner schemas are stored as raw strings, so `dial:applicationTypeInterceptors` is likely not cross-checked on write: a wrong reference form would save cleanly and fail only at request time. The cheapest check on first real use is to select one interceptor of each origin, save, reload, and confirm both return selected.
- [Silent option loss] If one population read fails and the code treats the failure as an empty list, the picker quietly shrinks and a user may conclude an interceptor no longer exists. The spec requires the surviving population to still be offered and the failure to be reported. → Mitigation: a test for each single-source failure, asserting both the surviving options and the reported error.
- [Granted-but-unlisted roles] `RouteRoles` currently intersects a route's grants with the fetched list, so anything absent from the list vanishes from the tab. The same defect was found and fixed on the models Roles tab. Moving the source without addressing the intersection would carry the defect over into a permissions surface. → Mitigation: an explicit requirement and test that a granted role absent from the options is still displayed.
- [Shared-component blast radius] Three of the four changes touch components rendered by many surfaces. → Mitigation: for each, a test asserting an admin-backend-backed surface still behaves as before — the models change found that a render-only assertion here passes whether or not the dependency exists, because these components fetch lazily on open rather than on mount, so the assertions must drive the interaction.
- [Reference-form regressions are silent] Writing the wrong reference form produces a valid-looking save that Core rejects, or a reference that resolves to a different entity. → Mitigation: assert the exact stored string, not a match against the helper that produced it.

## Migration Plan

Additive and reversible. No route, resource shape, or stored reference changes, so a runner saved before the change reads back identically after it — a config-file-defined interceptor was already referenced by bare name, and that is the form this change continues to write for that population. Ships without a feature flag, matching how the prior asset-surface changes shipped. Rollback is a plain revert.

## Open Questions

None outstanding. Both were resolved by reading `FileConfigController` rather than by calling the endpoint — Core's auth is server-side only, so neither a shell request nor the browser can reach it before the client exists (the session exposes no access token and a direct browser fetch is cross-origin). Reading the source answered both more precisely than a single sample response would have:

- **Pagination: none.** `handleList` iterates `source.keySet()` and emits every entry in one array. No token, no limit, no `nextToken` convention to mirror.
- **List entry shape: names only.** `items.addObject().put("name", key)` — the listing is `{"items":[{"name":"..."}]}` and carries nothing else. Not `ResourceItemMetadata`, not an entity projection. The per-entity GET does return the full entity plus an injected `name` and `status`, with `@EncryptedField` values dropped.

Two further facts worth having recorded, both from the same read:

- The controller reads `getFileSourcedConfig()` deliberately, so "listings / single GETs cannot accidentally project API-managed entries" — the two populations are disjoint in what each call returns, and a name appearing in both is a genuine collision rather than double-reporting.
- `PROJECT_KEY` is refused **before** the admin check, so `keys` is 403 for every caller. Non-GET returns 405 with `Allow: GET`; a non-admin caller gets 403; an unknown name on a single GET gets 404 while an unknown *type* cannot occur because the route regex closes the set.
