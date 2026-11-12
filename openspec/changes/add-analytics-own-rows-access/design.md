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
