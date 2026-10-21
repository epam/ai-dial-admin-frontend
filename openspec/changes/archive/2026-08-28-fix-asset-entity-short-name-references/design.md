## Context

DIAL Core PR #1813 (`a61481de`, "short-name resolution via direct keying") changed how the merged `Config` maps are keyed. For five entity types — `MODEL`, `INTERCEPTOR`, `ROLE`, `APPLICATION`, `TOOL_SET` — the map key changed from the canonical id (`{type}/platform/{name}`) to the **bare short name**. `MergedConfigStore.isShortNameKeyed` returns `true` for exactly those five and `false` for everything else. A reference is now validated with a plain `containsKey(ref)` against that one map (`ConfigPostProcessor.validateCrossReferences`).

The admin frontend's reference-form logic was built against the *old* canonical-id keying. The central helper `getConfigEntityReference` (`utils/config-entities/options.ts`) emits `{type}/platform/{name}` for any API-written (platform) option, and `getModelDeploymentId` (`utils/models/deployment-id.ts`) emits `models/platform/{name}`. So a dependency saved today — an interceptor on a model, a role on a route/key — carries a canonical id that Core's short-name map can no longer resolve, producing the `… not found in config` rejection in issue #4309.

A second, coupled behavior: `unionConfigEntityOptions` currently emits **two** options when a name exists in both the config-file and API-written populations, because the two populations produced *different* reference forms (bare name vs canonical id) and so were legitimately distinct keys. After the short-name change both populations produce the *same* reference for the same name; keeping both would render a duplicate picker row, and Core's new semantics are that the blob (platform) entry supersedes the file entry via ordinary `Map.put`.

Routes (`routes/<bucket>/<name>`) and keys (`keys/<bucket>/<name>`) remain canonical-id-keyed for API-sourced entries — `Config.java` field comments and the `ConfigPostProcessor` structural pass (`processStructural` / `rejectSlashKeyedNames`) explicitly carve them out as "key by canonical id legitimately". App-runner schemas are keyed by JSON-Schema `$id`, a separate mechanism.

## Goals / Non-Goals

**Goals:**
- Store the bare short name as the dependency reference for the five short-name-keyed types (models, interceptors, roles, applications, toolsets), from both populations, so the reference resolves against Core's new map.
- Keep the canonical-id reference form for routes and keys (the two non-short-name-keyed types that are still offered through the same picker pipeline).
- Collapse the config-file/platform merge on name collision, keeping the platform (API-written) option, to match Core's blob-supersedes-file semantics and avoid duplicate picker rows.
- Update the specs that encoded the old canonical-id form and the "keep both on collision" merge rule.

**Non-Goals:**
- Rewriting already-stored references that carry the old canonical form — those are a Core-side migration concern (Core's own PR #1813 notes that operators should reconfigure `Role.limits` etc. to short names). This change prevents *new* bad writes.
- Changing how entities are listed/read from Core (metadata + config-file routes), only what is stored on selection and how the two populations merge.
- Changing routes, keys, or app-runner (schema) keying.
- Changing the admin-BE-vs-Asset interceptor merge (`mergeInterceptorOrigins`) — a different population pair from the config-file/platform merge.

## Decisions

### Decision 1: `getConfigEntityReference` becomes type-aware, not just origin-aware

Today the helper branches on `origin` only: `ConfigFile` → bare name, `Api` → `{type}/platform/{name}`. After #1813, the reference form is determined by **which type is being referenced**, not by which population it came from: the five short-name-keyed types take the bare name from *both* origins; routes and keys take the canonical id from *both* origins (a config-file route is still referenced by bare name today, though — see the audit note below).

**Chosen:** branch on `type` first, then `origin` only for the non-short-name types:
- For `Models`, `Interceptors`, `Roles`, `Applications`, `Toolsets` → return `option.name` regardless of origin.
- For `Routes`, `Keys` → keep the existing origin branch: `ConfigFile` → bare name, `Api` → `{type}/platform/{name}`.

A small `SHORT_NAME_KEYED` set (mirroring Core's `isShortNameKeyed`) makes the branch explicit and self-documenting.

**Alternatives considered:**
- *Always bare name for every type.* Rejected — breaks routes and keys, which Core still keys by canonical id. This is the over-correction flagged in the proposal.
- *Two separate helpers, one per keying family.* Rejected — duplicates the origin logic and splits the single source of truth the existing `rows.ts`/`options.ts` comments call out. One type-aware helper keeps one source of truth.

**Note on config-file routes/keys:** `getConfigEntityReference` currently returns the bare name for a `ConfigFile`-origin route, and the canonical id for an `Api`-origin route. That asymmetry is unchanged here — Core keys file-sourced routes by name and API-sourced routes by canonical id, so the origin branch for routes/keys stays. The audit task confirms no consumer assumes a single shape across origins for routes/keys.

### Decision 2: `getModelDeploymentId` returns the bare name

`getModelDeploymentId` exists to show the identifier a caller invokes an API-written model by. Under the new keying that identifier is the bare name. Change it to return `name ?? ''` and drop the `MODELS_PREFIX` composition. The `Properties` component that renders it (`components/Assets/Models/Properties.tsx`) needs no structural change — it already displays whatever the helper returns.

**Why not remove the helper entirely:** it still carries the "what a caller invokes this model by" intent and the empty-name guard, and call sites read more clearly with it than with a raw `name`. Removing it would spread the `name ?? ''` guard to every call site.

### Decision 3: `unionConfigEntityOptions` collapses on collision, platform wins

Change the merge so that when a name appears in both populations, only the API-written (platform) option is emitted; the config-file duplicate is dropped. This matches Core's "a blob write naturally supersedes the file entry via ordinary `Map.put`". Duplicates *within* one population are still collapsed (unchanged). Partial-failure degradation is unchanged: whichever population was read is still offered, with the failure reported.

**Implementation shape:** build the API-origin options first, then add file-origin options whose name is not already present — so the API option occupies the slot and the file duplicate is skipped. The `origin` discriminator is still carried (a platform-only name still shows `Api`; a file-only name still shows `ConfigFile`).

**Alternatives considered:**
- *Keep both, let the picker dedupe by reference.* Rejected — after the short-name change both rows would have the same `name` reference and the same display name, producing a true duplicate the grid cannot distinguish; and it would contradict Core's supersession semantics.
- *Collapse to the file option on collision.* Rejected — Core's `Map.put` order is blob-after-file, so the platform entity is the live one; offering the file entry would let a user select an entity Core has shadowed.

### Decision 4: Audit prefix-parsing consumers before assuming they're unaffected

Several utilities parse a `{prefix}/` off a stored value: `utils/deployment-navigation.ts` (`APPLICATIONS_PREFIX`), `server/publications/resolver/registry.ts` (`APPLICATIONS_PREFIX`, `TOOLSETS_PREFIX`), `components/Applications/ParametersTab/utils.ts` (`applications/`), `utils/toolset/toolset-auth.ts` (`toolsets/`). These appear to operate on **blob-storage resource paths** (the `applications/…`, `toolsets/…` forms used for Core resource URLs), not on the `Config` map keys / stored dependency references this change touches. The blob-path prefixes (`applications/`, `toolsets/`, without `platform/`) are a different concern from the config-reference form (`applications/platform/{name}`, now bare `name`).

**Chosen:** include an explicit audit task rather than assume. Each consumer is checked: does it parse a value that *this change* alters (a stored interceptor/role/model/application/toolset dependency reference), or does it parse a blob-storage resource path that this change does not touch? Only the former need updating.

## Risks / Trade-offs

- **[Existing stored references still fail against Core #1813]** → This is a pre-existing condition Core's own migration note already acknowledges (operators reconfigure). The frontend fix prevents new bad writes but does not migrate old ones. Documented in the proposal's Migration note; no frontend-side rewrite is attempted.
- **[Frontend change is correct only against Core ≥ #1813]** → Against an older Core, bare-name references for the five types would not resolve. The deployment pairs this frontend version with Core ≥ #1813; no version-gate is added because the admin frontend is deployed in lockstep with its Core, not against arbitrary older versions.
- **[A consumer silently parses the old canonical form]** → Mitigated by Decision 4's audit task, which must land before the change is considered complete. If a consumer is found that parses stored dependency references, it is updated in the same change.
- **[Merge collapse hides a file-only entity that a user previously relied on]** → Not a regression: under Core #1813 that file entity is already shadowed at runtime by the platform entry of the same name. The picker now reflects what Core actually serves.
- **[Routes/keys asymmetry across origins is subtle]** → Preserved deliberately (Core keys them differently per origin). The type-aware helper's route/key branch keeps the origin split; the audit confirms no caller assumes one shape.

## Migration Plan

1. Deploy alongside Core ≥ #1813. The frontend and Core are released together (milestone `release-0.21`).
2. No data migration on the frontend. Resources saved before this change that carry canonical-id references for the five types already fail against the new Core; operators reconfigure those references to short names per Core's migration note.
3. Rollback: revert the frontend change. Against the *new* Core, the old frontend would resume writing canonical ids — which fail, so rollback is only meaningful if Core is also rolled back to pre-#1813. Coordinated rollback, not frontend-only.

## Open Questions

- Does the *entity* interceptor attach picker (Entities > Applications/Models/AppRunners, via `mergeInterceptorOrigins`) also store a canonical id for `Asset`-origin interceptors, or only the `Assets > Models` / `Assets > App Runners` path (via `readConfigEntities`)? The audit task covers both; the implementation scope expands only if the entity path is also affected.
