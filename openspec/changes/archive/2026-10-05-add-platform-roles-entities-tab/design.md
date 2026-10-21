## Context

Platform Roles (`/platform-roles`) is a Core-direct surface: it reads and writes
`roles/platform/{name}` through Core with no admin-backend involvement (`openspec/specs/platform-roles/spec.md`).
Its `DialRoleResource` model already declares `limits?: Record<string, DialCoreRoleLimits>` — a map of
per-model, plain-number minute/day/week/month token limits — but nothing in the UI reads or writes it
yet; the detail view renders exactly one tab, `Properties` (cost limits + sharing).

The admin-backend side solves the equivalent problem today for `Entities > Roles`
(`components/Roles/View/TabsContent.tsx`, `EntityViewTab.Entities` branch): an `Entities: {n}` header,
an `+Add` popup (`AddEntitiesTab`'s `AddEntitiesView` + the shared `EntityView/AddEntitiesGrid` modal),
and per-token editable columns (`ROLES_ENTITIES_COLUMNS` → `EntityView/Roles/utils.ts`'s
`LIMIT_COLUMNS`). That machinery is built around the admin-backend's entity union
(`DialRole`/`DialModel`/`DialKey`/…) and its string-typed `DialRoleLimits` with an `enabled` flag and an
`UNLIMITED_VALUE` sentinel for "explicitly no limit, overriding the role's own default". None of that
fits Platform Roles: there is no admin-backend entity union here, no `enabled` flag (map presence
already means "attached"), no default-limit-to-override concept, and limits are plain numbers, not
strings.

`Assets > Models` already solves the second half of the problem — showing Core's `platform` and
config-file model populations together — via `readConfigEntities`/`ConfigFileEntityType.Models`
(confirmed in use by `assets-models/[id]/page.tsx`, and referenced as already-merged in
`EntityView/Interceptors/Interceptors.tsx`'s `NEEDS_ASSET_MERGE_VIEWS` comment).

## Goals / Non-Goals

**Goals:**

- Add an `Entities` tab to the Platform Role detail view, visually and behaviorally close to the
  `/roles` Entities tab, scoped to models only.
- Let a user attach one or more models (from Core's platform + config-file populations) to a role and
  edit each attached model's four token limits independently, with stable, non-disruptive multi-row
  editing.
- Persist edits into `DialRoleResource.limits["<model-name>"]` as plain numbers, through the existing
  `updateRole` save path — no new server action or backend endpoint.

**Non-Goals:**

- No other entity type (applications, routes, toolsets, keys) in the add-popup or the Entities grid —
  models only, per the proposal.
- No change to the entity-side `Entities > Roles` surface or its components — this is new,
  Platform-Roles-scoped code, not a generalization of `AddEntitiesTab`/`AddEntitiesView`.
- No "default limit" / inherit-and-override concept for Platform Roles — Core's `Role.limits` has none,
  unlike the admin-backend's `defaultRoleLimit`.
- No change to how `costLimit` or `share` are edited (Properties tab is untouched).

## Decisions

### Build feature-local components, don't extend `AddEntitiesTab`/`AddEntitiesView`

`AddEntitiesView` (`components/AddEntitiesTab/`) is typed around the admin-backend's seven-entity
union (`EntitiesGridData`) and its string/`enabled`/`UNLIMITED_VALUE` limit model. Extending its prop
surface to also accept Core `DialRoleResource`/model-resource rows would widen an
admin-backend-specific component with Core-specific semantics it doesn't otherwise need, for a single
caller. Platform Roles already keeps its other tab content feature-local
(`Assets/Platform/Roles/Properties.tsx`, `CostLimits.tsx`, `Sharing.tsx`) rather than reusing
`Entities > Roles`' components, so a new `Entities.tsx` (+ grid/columns helpers) under
`Assets/Platform/Roles/` follows the established split instead of crossing it.

What **is** reused as-is: `EntityView/AddEntitiesGrid` (the multi-select popup shell — generic over
row type `T`, no admin-backend coupling), `withSourceColumn`/`hasConfigEntityOrigin`
(`utils/config-entities/source-column.ts`) for a Source column distinguishing platform vs config-file
models in the popup, `Grid/CellRenderers/EditableCellRenderer` for inline-editable cells, and the
`isSkipRefresh` convention from `components.md` §11 / `SchemaManager.tsx`.

**Alternative considered:** generalize `LIMIT_COLUMNS`/`createLimitColumn` to accept a "no-limit
representation" strategy (sentinel string vs. numeric absence) so both surfaces share one column
factory. Rejected for this change — the two notions of "no limit" are semantically different (an
explicit override sentinel vs. simple absence with no default to fall back to), and bridging them in
one function would make both call sites harder to read for a single shared loop of four columns. A
future unification is possible but out of scope here.

### Model source: reuse Core's merged Api/ConfigFile population, not a second merge

The add-models popup's row set comes from the same source `Assets > Models` already reads —
`readConfigEntities` with `ConfigFileEntityType.Models` — rather than independently fetching platform
models and config-file models and merging them again. This is the same reasoning
`EntityView/Interceptors` already documents for excluding `Assets > Models`/`Assets > App Runners` from
its own merge (`NEEDS_ASSET_MERGE_VIEWS` comment): the merged population already exists upstream, so a
second merge would risk double-counting or drifting from it. The popup grid gets a Source column via
`withSourceColumn` so a user can tell platform models from config-file ones when both are present.

### Persisted shape and edit semantics

`limits["<model-name>"]: { minute?: number; day?: number; week?: number; month?: number }`. Per the
resolved open questions from the earlier exploration:

- **Attaching** a model via the popup inserts `limits["<model-name>"] = {}` (or merges into an existing
  entry if the model was previously attached and the entry already exists) — no token fields are set.
- **Editing** a token field writes that key as a plain number (`0` included) into the model's entry.
- **Clearing** a token field's input removes just that key from the model's entry. The model's row
  stays in the grid, and its other token values are untouched, even if every key ends up removed
  (`limits["<model-name>"] = {}` is a valid, fully-no-limits state for an attached model).
- **Removing** a model (row action) deletes the `limits["<model-name>"]` entry outright.
- A token field with no key present in the entry renders a "No limits" placeholder, matching the
  proposal's wording (a new copy string — the admin-backend's equivalent placeholder reads "Not
  specified" for its own, sentinel-based "no limit"; the two surfaces mean related but distinct things
  and need not share a label).

### Multi-row stable editing

Inline edits follow the `SchemaManager.tsx`/`EntityView/Roles` convention already named in
`components.md` §11: the tab owns `limits` state, each token-cell edit computes the next `limits`
object and calls the parent's `onChange(updatedRole, /* skipRefresh */ true)`, and the grid only calls
`gridApi.updateGridOptions({ rowData })` when `isSkipRefresh` is false (save, discard, or an add/remove
that changes row membership). Editing row A then row B in sequence never rebuilds the grid between
edits, so scroll position, focus, and any pending edit are preserved.

## Risks / Trade-offs

- **Core write-normalization gap** → `platform-roles/actions.ts`'s `updateRole` already normalizes
  `costLimit`/`limits` to Core's wire shape; this change doesn't add a new write path, but a per-model
  entry with zero token keys (`{}`) must round-trip as an attached-with-no-limits model, not be
  stripped as "empty". Verify this explicitly against the existing normalization in
  `utils/roles/limits.ts`/`actions.ts` and add coverage if it currently drops empty objects.
- **Two "no limit" meanings in the app** (admin-backend sentinel vs. Core absence) → mitigated by
  keeping the two implementations and their copy separate rather than forcing one model to fit both.
- **Config-file models are immutable/read-only elsewhere** (`config-file-entity-views` capability) →
  attaching a config-file-sourced model to a role's `limits` is still a write to the *role*, not to the
  model, so this is consistent with existing read-only guarantees; no conflict expected, but worth an
  explicit scenario in the spec so it isn't reasoned about implicitly.

## Open Questions

- Exact i18n copy for the tab label, popup title, and the "No limits" placeholder (follow
  `.claude/rules/components.md` §10 — reuse `EntitiesI18nKey`/`ButtonsI18nKey` where an existing key
  fits, add `RolesI18nKey`/a Platform-Roles-scoped key only where it doesn't).
- Whether a read-only admin sees the tab at all or sees it without the Add/edit/remove affordances —
  follow the existing Properties-tab precedent (`CostLimits.tsx`/`Sharing.tsx` already gate on
  `isReadOnlyAdmin`); not called out explicitly in the original ask, so default to the same pattern
  unless tasks.md review says otherwise.
