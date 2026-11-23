## Context

See `proposal.md` for the motivation. The Access tab (`components/Analytics/Tables/access/`) already covers most of the service's contract: it re-reads the grant lists before every `PUT /access` and sends only changed keys, renders `ineffective_grants` messages as in-drawer warning banners, hides itself on `403`, and the **Rows restricted** badge already reads `permissions.rows_restricted`. What is missing is narrow:

- The role picker is fed only by Core's role catalog, so `*` cannot be chosen, and a `*` entry created through the API is shown as a role called `*`.
- `QueryExprType` has no `param` member. `summarizeExpr` (`access/utils.ts`) falls through to its function-call branch for an unknown expression and reads `args` of a parameter, so a stored caller-value policy breaks the roles table.
- `TABLE_ROW_POLICY_URL` uses `encodeURIComponent`, which leaves `*` unencoded.
- The drawer always saves grants first and the row policy second.

The row-limit editor reuses the Query Builder's `FilterGroup` / `FilterCondition` through `FilterTreeContext`, passing `NO_FUNCTIONS` to switch the function operand off.

## Goals / Non-Goals

**Goals:**

- One representation of the Everyone grantee: the literal `*` in data, a label in the UI.
- The caller-value operand lives in the shared condition editor as an opt-in, so the row-limit editor stays "the Query Builder's editor, shared rather than duplicated".
- No client-side copy of the service's validation rules beyond what decides whether a control is offered.

**Non-Goals:**

- A SQL view of the row limit.
- Any change to `Common/*` components.

## Decisions

### `*` is a constant plus a label helper, not a catalog entry

`EVERYONE_ROLE = '*'` in `access/constants.ts` (consumers: picker options, role label, privilege locks, save order, URL encoding test fixtures). A `roleLabel(role, t)` helper in `access/utils.ts` returns the translated label for `*` and the name otherwise; the roles grid's role cell, the drawer's read-only role, `RemoveRoleDialog` and the role search all go through it. The picker option is built in `RoleDrawer` and prepended to `roleOptions`, independent of `useRoleCatalog`.

*Alternative — inject `*` into `useRoleCatalog`.* Rejected: the catalog is "Core's merged role population" with an origin per entry; `*` has no origin, and it must be offered when the catalog fails.

The Everyone row gets a `role="group"`-style distinction by an icon beside the label (decorative, `aria-hidden`; the label already names it), so it does not read as a provider role by text alone.

### Write/Modify lock reuses the system-table lock

`SYSTEM_LOCKED_PRIVILEGES` already lists Write and Modify. The drawer computes one `lockedPrivileges` + reason from `isSystem` and `role === EVERYONE_ROLE`; a system table's reason wins when both apply, because it is true of every role there. Picking Everyone for a new role clears a Write/Modify selection made before the role was chosen — in practice impossible, since the cards appear only after a role is chosen, but `planAccessSave` must never send `*` in those lists.

### Save order flips only for Everyone

`onSave` in `RoleDrawer` branches on `role === EVERYONE_ROLE && selection.read && rowsMode === RowsMode.Some`: row policy first, grants second. A failed policy request returns to `DrawerPhase.Editing` (not `RowLimitFailed`: nothing was saved, so "Save row limit" would be the wrong action). A failed grants request after a stored policy also stays in `Editing`; repeating both is safe because `PUT row-policies` is idempotent, and a policy on a grantee with no read path confers nothing.

*Alternative — flip the order for every role.* Rejected: it rewrites the existing "grants saved, row limit failed → Save row limit" flow and its specs for no gain; a named role with a grant and a not-yet-stored policy does not lift anyone else's confinement the way `*` does.

Removal keeps its existing order (grants out first, policy deleted second), which is already the safe one for `*`.

### Unconfined Everyone is warned about, not blocked

A kit `Notification` (`SectionMessage`, `Warning`) in the row step while Everyone + Read + All rows. Blocking was considered and rejected: the service accepts the grant, and "everyone reads this table in full" is a real configuration (a reference table). The service's own `lifts_row_policies` banner follows the save; the pre-save warning exists because by then the grant is already live.

`IneffectiveGrantReason` gains `LiftsRowPolicies`. The banner code is untouched — it renders `message` for any reason.

### Caller value is a third right-operand kind, switched on through the tree context

- `QueryExprType.Param` and a `QueryParamExpr { type, name }` join `QueryExpr` in `models/analytics/query.ts`.
- `FilterOperandKind.Param`; `FilterPredicateNode` gains `rightParam: string | null`.
- `FilterTreeContextValue` gains `callerValues: CallerValue[]` (name + label + description). The Query Builder's fallback in `useFilterTree` supplies an empty list, so its Filter section offers nothing new. `RowLimitEditor` supplies the two values.
- `FilterCondition` adds the kind to `rightKindOptions` when `callerValues` is non-empty, the operator is `eq`/`ne` and the resolved operand type is `string`; the existing "switched to `in` returns to a literal" reset is widened to this rule.
- `serialize.ts` emits the param expression; `deserialize.ts` accepts a predicate whose one side is a field and the other a param, normalizing the field to the left — `eq`/`ne` are symmetric, so the stored meaning is unchanged. `isPredicateRepresentable` accepts it only when the context offers caller values, so the Query Builder still sends such a tree to JSON.
- `access/row-limit.ts` is unchanged: `serializeNode` returns null for a `Param` kind with no name, which `hasUnfinishedCondition` already reads as unfinished.
- `summarizeExpr` gets a `Param` case returning the name, and its `default` stops assuming `args`.

*Alternative — a row-limit-only condition component.* Rejected by the existing requirement that the editor is shared, and it would fork operator rules.

The two caller-value names are a string enum in `models/analytics/query.ts` (`CallerValueName`), used by the picker and the tests. Names typed in the JSON view are not checked against it: the service owns that rule and its `422` message already reaches the notification and the field highlight.

### Row-policy path encoding

`TABLE_ROW_POLICY_URL` keeps `encodeURIComponent` and additionally replaces `*` with `%2A`. Scoped to this URL builder rather than a general helper: no other path segment in the API layer can hold `*`.

### Empty-result hint reads the source table lazily

`ResultArea` shows `NoDataContent` for an empty result. The hint needs `rows_restricted` of the query's source, which the builder's entity schema does not carry. A small hook beside `ResultArea` calls the existing `getTable(name)` server action the first time a result for a given source comes back empty, caches the flag per source name for the page's lifetime, and yields `false` on any failure without a notification. The hint is the `description` of the same `NoDataContent`.

*Alternative — fetch permissions with the schema on page load.* Rejected: one more request on every page load for a hint that only an empty result of a confined caller needs.

A SQL-view run has no attributed source, so the hook is not invoked there.

## Risks / Trade-offs

- [The service may store a caller value on the left side; the editor rewrites it column-first on the next save] → Equality is symmetric; the stored predicate means the same. Covered by a deserialize test.
- [The pre-save warning and the service's banner say similar things] → They fire at different moments: one before the grant exists, one reporting what was stored. Kept both, per the service's contract that the banner is shown after every save.
- [A `*` policy saved before a grants request that then fails leaves a policy with no grant] → Harmless by the service's rules (a policy never grants); the roles table lists it as "Cannot read rows" with the kept filter, which is accurate.
- [The hint's lazy request can lose a race with a fast second run] → The flag is keyed by source name, not by run; a late answer only ever updates the same source.
- [A themes-service palette could lower the warning banner's contrast] → The kit `Notification` variant is reused as in the existing banners; no new colors.

## Open Questions

- Whether the service also accepts an unencoded `*` in the path. It does not affect the approach: the path is encoded either way.

## Follow-up: role-keyed access API

### Context

The service now stores one entry per role, `{privileges, rows, columns}`, read as a whole with `GET /access` and written per role with `PUT` / `DELETE /access?role=`. The five-list `PUT` and every `/row-policies` call are removed. Three things the first part worked around disappear with them: the lists no longer have to be re-read and merged before a save, a role's grants and row limit are no longer two requests, and the role is a query value rather than a path segment.

`use-table-access.ts` holds `access: TableAccess` (five lists) and `policies: RowPolicies` and derives `RoleRow[]` from both. `RoleDrawer` drives two requests through `DrawerPhase.RowLimitFailed`. `canManageRoles` is `isFullAdmin`, and the tab also waits for a non-`403` read.

### Goals / Non-Goals

**Goals:**

- The entry is the unit everywhere: one model, one read, one write per role.
- Nothing the service decides is decided again on the client — warnings, conflicts and refusals are rendered, not predicted.
- A save can never store less than the drawer shows or drop what it does not show (kept row limit, kept column limit, unknown column names).

**Non-Goals:**

- Running against a service that still has the removed endpoints. The two releases ship together.
- Any change to `Common/*` components.

### Decisions

#### One model for the entry

`models/analytics/table.ts`: `TableAccessEntry { privileges: TableGrantKey[]; rows: RowPolicy | null; columns: string[] | null }`, `TableAccessConfig { generation: number; roles: Record<string, TableAccessEntry>; ineffective_grants: IneffectiveGrant[] }`, `TableAccessEntryDto` (entry + `generation`) and `TableAccessEntryResult` (entry + `generation`, `role`, `ineffective_grants`). `TableAccess`, `RowPolicies`, `RowPoliciesResponse` and `TableAccessUpdateResult` are deleted. `TablePermissions` gains `grant` and `columns_restricted`. `IneffectiveGrantReason` drops `EnrichmentReadInert` and gains `LiftsColumnPolicies` and `EveryoneReadsAllRows`; the banner code still renders any reason.

`access/utils.ts` loses `emptyAccess`, `normalizeAccess`, `planAccessSave`, `planRoleRemoval` and `applyAccessResult`. `buildRoleRows` takes the `roles` map; `selectionFromAccess` becomes a read of one entry's `privileges`. A new pure `buildEntry(stored, selection, rowLimit, columnLimit, isEnrichment)` is the only place that decides what is sent, which is where the "kept while hidden" rules live:

- `rows` — the editor's filter while the row step is offered and **Only some rows**; `null` while offered and **All rows**; the stored `rows` while the step is not offered.
- `columns` — the same three-way rule for the column step.
- on an enrichment — `write` / `modify` only, `rows` and `columns` `null`.

*Alternative — keep the five-list shape in state and convert at the API boundary.* Rejected: the conversion would have to invent list semantics for `columns` and would keep the merge code alive for no caller.

#### One request per save, so two drawer phases go

`DrawerPhase` becomes `Editing`, `SavedWithBanner` and `Conflict`. `RowLimitFailed`, **Save row limit**, the "what was saved" note and the Everyone policy-first branch are deleted, with their i18n keys. A `422` leaves the drawer in `Editing`; the existing `findNamedField` highlight is fed from the same error message as before.

#### The generation lives in the hook, not in the drawer

`useTableAccess` keeps `generation` beside `roles` and updates it from every `GET` and every `PUT` response. `saveEntry(role, entry)` and `removeRole(role)` read it from a ref at call time, so a drawer opened before another role was saved does not send a stale number for a reason unrelated to its own role. After a successful save or removal the hook re-reads the whole configuration: the `PUT` response reports only the saved entry's warnings, while `lifts_row_policies` on `*` can be caused by any role.

*Alternative — patch local state from the `PUT` response and skip the re-read.* Rejected: the tab-level warnings would be stale exactly when a save changes them.

#### Conflict is a drawer state, not a retry

The server actions return a failure untouched; `errorHeader` carries the service's code, as `previewPipeline` already relies on. `access_conflict` puts the drawer in `DrawerPhase.Conflict`: an error `Notification` (`SectionMessage`, with `role="alert"`), **Save role** disabled, **Reload role** as the banner's action. Reload calls the hook's re-read and resets the drawer's state from the fresh entry by remounting its body on a key that includes the generation. `table_busy` is an ordinary error notification with the drawer left in `Editing`.

*Alternative — re-read and resend automatically.* Rejected: it overwrites the other administrator's change to the same role, which is the one case the generation exists to stop.

#### The tab is gated by `permissions.grant`

`useAnalyticsTablePermissions.canManageRoles` reads `permissions.grant`, with the same `!isEnableAuth` fallback as the other per-table flags. The hook keeps the silent `403` handling as a second line: a `grant` flag and the endpoint's own check are computed in different places, and a tab that errors for a user who cannot manage access is the wrong failure. `isColumnsRestricted` is added beside `isRowsRestricted`.

#### Warnings are routed by role, not by reason

`AccessTab` splits `ineffective_grants` once: items of `EVERYONE_ROLE` go to a warning `Notification` group above the grid; the rest are grouped by role and handed to the role cell, which shows a warning icon inside a kit `Tooltip`, its `aria-label` carrying the messages so they do not depend on hover. Routing by role keeps the client free of a list of "table-wide" reasons that would need editing whenever the service adds one. The banner is static content of the loaded tab, so it is not a live region; the post-save banner in the drawer keeps `role="status"`.

#### Confirmation for an unconfined Everyone

`onSave` checks `isEveryone && selection.read && rowsMode === All && !(stored entry holds read with rows null)` and, when true, opens a kit confirmation dialog instead of saving. Its secondary action sets `RowsMode.Some`. The inline warning from the first part stays: it explains the state while the user is still choosing, the dialog stops the save.

#### Column limit step

A new `ColumnLimitStep.tsx` in `access/`: a kit `RadioGroup` and a searchable multi-select. Options are the table's own `columns` plus, on a source table, `<enrichment>.<column>` for each enrichment. `TableDetailView` already reads the definition of every enrichment of a source table to find keyed columns; it keeps those definitions and a failed-read flag in state and passes both down, so the step needs no request of its own and shows an inline note when a definition could not be read. Stored names missing from the options are appended as plain options so they stay selected.

The roles grid gets a **Columns** column whose cell is an `EllipsisTooltip` over "N columns: a, b"; no `tooltipValueGetter`.

*Alternative — a checkbox list of every column in the drawer.* Rejected: system tables have dozens of columns and the drawer is already five steps.

#### Enrichment tables

`AccessTab` and `RoleDrawer` receive `sourceTable?: string` (set for an enrichment). The drawer extends the existing lock computation: `lockedPrivileges` is Get/Read for an enrichment, Write/Modify for a system table or Everyone, the union when several apply, each with its reason. Steps 3–5 are hidden through the same `is…StepOffered` helpers taking `isEnrichment`. The source link is the existing table detail route.

#### One badge component for both restrictions

`RowsRestrictedBadge.tsx` becomes `RestrictedBadge.tsx` with a `kind` enum (rows, columns) selecting label, tooltip and icon; both call sites pass the kind.

#### URL building

`TABLE_ACCESS_ROLE_URL(name, role, generation?)` builds the query with `URLSearchParams`. `TABLE_ROW_POLICIES_URL`, `TABLE_ROW_POLICY_URL` and the `%2A` replacement are deleted: `*` is a legal query character and the service decodes the value once.

### Risks / Trade-offs

- [Frontend and service must be deployed together; a mismatch breaks the Access tab either way] → Stated in the proposal's impact; the tab's failure mode is an error notification with an empty, disabled roles table, not a broken page.
- [A re-read after every save doubles the requests of a save] → One small `GET`; it is what keeps tab-level warnings truthful.
- [**Reload role** discards the user's input] → Deliberate and stated in the banner; merging two administrators' edits of one role is not something the UI can do safely.
- [A table meant to be public carries the standing warning forever] → Accepted; dismissing it is a non-goal.
- [Reading every enrichment's columns for the picker costs one request per enrichment] → Lazy, on first use of **Only some columns**, cached for the view.
- [A column-restricted role that reads through a second role can see fewer columns than either lists] → The service's evaluation rule; the drawer does not try to preview effective visibility.

### Open Questions

None. The service's stable code arrives as `errorHeader` of a failed server action (`BaseApi` copies the body's `error` member there), which the pipeline hooks already compare against runner codes; `access_conflict` and `table_busy` are told apart the same way.
