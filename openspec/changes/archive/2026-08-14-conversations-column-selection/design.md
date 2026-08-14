## Context

See `proposal.md` — Why. The shared code this change has to move through, and what each piece assumes:

- `ColumnsPanel` filters its input with `!col.suppressColumnsToolPanel && col.field && col.headerName`. A
  `ColGroupDef` has no `field`, so a grouped grid's definitions are filtered out entirely.
- `GridView` holds `currentColDefs` as a flat array and manipulates it by top-level index and top-level
  `field`: `toggleColumnVisibility` matches `c.field === id`, `onFindColumn` returns a top-level index, and
  `onMoveColumn` splices that array.
- `src/components/Grid/utils.ts` has both shapes already, for different purposes.
  `applyColumnStateOrderToColDefs` orders a flat list **and** applies `hide`;
  `applyColumnStateOrderToTreeColDefs` sorts *top-level* entries by their first leaf and does **not** apply
  `hide`, because on the tree grids the movable unit is the group. Neither fits a grid where groups are fixed
  and leaves move.
- `getDefaultSorts` in `AgGridWrapper` reads `col.sort` off top-level definitions, so a grouped grid's default
  sort is invisible to it.
- `AgGridWrapper` already distinguishes `isLiveData`: that branch applies persisted state without calling
  `updateGridOptions({ columnDefs, rowData })`, which is the branch a server-paged grid needs. Conversations
  does not currently pass it, because it has no `storageKey` to restore.
- `ColumnState[]` from `getColumnState()` is already a flat list of **leaf** column state, so the storage
  format needs no change — only the code that maps it back onto definitions.
- `getEntitySchema(name)` already exists as a server action returning
  `{ fields: [{ name, type, source, tag, display_name, description, sensitive }] }`, role-filtered by the
  service. `AnalyticsFieldType` already enumerates the scalar and non-scalar types.
- `ConversationFieldFormat` (`Count | Cost | DateTime | Duration`) and the detail page's field definitions
  already pair a field with a formatter, which is the type→rendering mapping this change needs for
  schema-driven columns.

## Goals / Non-Goals

**Goals**

- Grouped grids get column selection without flat grids changing behaviour at all.
- The Conversations catalog reflects the entity as the service describes it, so it does not go stale when the
  rollup gains a field.
- A column's provenance attribution survives every operation the panel offers.

**Non-Goals**

- No columns from other entities. `rate_analytics` and `dial_usage_log` are separate entities and the DSL has
  no join, so the catalog is one entity's fields — the Rating column stays outside it.
- No generic query-building UI. The Query Builder is where an operator composes arbitrary projections; this is a
  curated view that can show more of its own table.
- No change to `TreeColumnsPanel` or the grids using it. Its "top-level entries move" model is a different
  shape and stays as it is.
- No per-user server-side persistence. Local storage per view, as every other grid already does.

## Decisions

### The panel's unit of work becomes a leaf descriptor, derived once

Rather than teaching each of `ColumnsPanel`, `toggleColumnVisibility`, `onFindColumn` and `onMoveColumn` to
walk a tree, `GridView` derives a flat list of leaf descriptors — `{ field, headerName, hide, groupId }` — from
whatever shape `columnDefs` has, and the panel renders that. A toggle or a move produces a new *definitions*
tree by writing the change back at the leaf's location.

This keeps one code path for both shapes: a flat grid's leaves are its definitions, so its descriptor list is
what the panel already received, and its behaviour is unchanged by construction. It also gives the panel the
`groupId` it needs to show group membership without a second traversal.

*Alternative considered:* branching inside each callback on whether `columnDefs` is grouped. Four branches to
keep in sync across seven grids, and the flat path would no longer be the only path — regressions there would
be silent.

### Reordering is clamped to the leaf's own group

`onMoveColumn` resolves both the dragged leaf and the target index to their groups and returns unchanged when
they differ. The grid's `marryChildren` already refuses a cross-group move, so the alternative is a panel whose
drop appears to succeed and is then discarded — and on this grid the group is a provenance claim, so a
successful cross-group move would be worse than a rejected one.

*Alternative considered:* letting a cross-group drop move the column *and* re-parent it. Rejected: the group
states which entity the value came from. Re-parenting would make the band lie.

### Grouped column-state helpers are added alongside the flat ones, not folded into them

`utils.ts` gains a grouped variant that orders leaves within their groups **and** applies `hide` to them, plus
grouped counterparts for `haveColDefsSamePanelState`, `updateColumnVisibilityInStorage` and
`getColumnVisibilityFromGridState`. The flat functions keep their current bodies and their current callers.
`getDefaultSorts` learns to look at leaves.

The reason to add rather than generalise: `applyColumnStateOrderToTreeColDefs` already demonstrates what
happens when one name covers two shapes — it sorts top-level entries and ignores `hide`, which is correct for
its callers and wrong here. A third behaviour behind the same name would be a trap. Selection happens once, in
`GridView`, based on the shape of `columnDefs`.

### Hiding a column clears its sort and filter through the grid API

On a visibility toggle to hidden, `GridView` clears that column's sort and its filter model entry via the grid
API before applying the new definitions. On a server-paged grid the filter change is what triggers the
re-fetch, so the correction happens through the same path as any other filter change — no special casing in the
datasource.

*Alternative considered:* leaving the filter in place and marking the column visible-but-filtered. That keeps
the filter discoverable but defeats the point of hiding, and AG Grid's default — silently keeping both — is the
behaviour the spec is closing.

### Restored state is applied before the datasource is set

For Conversations, the datasource is assigned in an effect once `gridApi` exists, while `AgGridWrapper`
restores persisted state in its own effect. Child effects run before parent effects, so the restore precedes
the assignment.

**Corrected during review.** This section originally said the datasource assignment would be *gated* on the
restore having run, and the implementation attempted that by restoring inside `onGridReady`. That code was
dead: `GridView` passes `currentColDefs`, which is still `undefined` when `AgGridReact` fires `onGridReady`,
so the guard never armed and the effect did all the work anyway. Both the early restore and its ref guard were
removed. The ordering that actually holds — child effect before ancestor effect — is documented at the effect
instead, together with the consequence if it ever changed: AG Grid purges and re-requests on a restored sort or
filter model, so the cost would be one extra request rather than wrong rows.

Conversations also starts passing `isLiveData`, so the persisted state is applied without
`updateGridOptions({ columnDefs, rowData })` — the branch that exists for exactly this row model.

### The catalog is curated columns plus unconsumed schema fields

A pure builder takes the schema's fields and the curated column definitions and returns the catalog: each
curated column as-is, then one column per remaining field, excluding `sensitive` fields, `object` / `array`
types, and any field a curated column already consumes (`first_request_time` and `last_request_time` are
consumed by activity). Type drives the rest — formatter, alignment, sortability and which filter preset the
column spreads, reusing `baseStringFilter` / `baseNumberFilter` and the existing `ConversationFieldFormat`
formatters.

Being a pure function of `(schema, curated)` makes the exclusion rules testable without a grid, which matters
because they are the rules most likely to be got wrong as the entity evolves.

*Alternative considered:* a hardcoded catalog of the fields the entity has today. Simpler, and it is what the
review feedback could be read as asking for — but it goes stale silently the first time the rollup changes, and
the schema call is already made elsewhere on the same backend.

### The projection follows visibility, and only growing it re-queries

The visible schema-driven fields are passed into the query builder and unioned with the curated fields.
Enabling a column changes the projection, so paging restarts; disabling one does not, because the loaded rows
still answer a narrower projection correctly.

*Alternative considered:* always projecting every offered field so visibility is purely client-side and instant.
That was the right answer while the field set was a known thirteen; it stops being right once the catalog is
whatever the service reports, since the page would then pay for every field the entity ever gains.

## Risks / Trade-offs

- **Seven existing grids depend on the code being changed**, and their behaviour must be identical afterwards.
  → The leaf-descriptor derivation is an identity transform for a flat list, and the flat helpers keep their
  bodies; the grids' own column specs are the regression net.
- **`checkColDefsChanges` and the reset affordance compare definitions positionally.** A grouped comparison
  that gets this wrong makes "Reset to default" appear permanently, or never. → Covered by tests over both
  shapes; the comparator is pure.
- **Enabling a column costs a full re-page**, which on a deep scroll throws away a lot of fetched rows. → It is
  the honest behaviour, and it matches what a filter change already does; the alternative shows empty cells for
  data that was never requested.
- **A schema-driven column has no hand-tuned cell.** A long string field will truncate and a nullable measure
  will render a placeholder, without the stacked two-line treatment the curated columns get. → Acceptable for
  opt-in columns; a field that proves important enough gets promoted to a curated column.
- **Adding a `storageKey` disables `autoSizeStrategy: fitGridWidth`**, so every column needs an explicit width
  and the grid can now under- or over-fill its container. → Explicit widths are part of the work, not a
  follow-up; the seven default columns are the case to get right.
- **A persisted column choice can outlive the field it names.** If the entity drops a field, stored state
  references a column that no longer exists. → The existing helpers already skip unknown `colId`s when mapping
  state back onto definitions; the grouped variants must keep that behaviour rather than throwing.
- **One more request on page load** for the schema. → It is cacheable and small, and the failure path degrades
  to the curated columns rather than to an empty grid.
