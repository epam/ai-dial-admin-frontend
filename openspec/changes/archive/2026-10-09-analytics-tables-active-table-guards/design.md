## Context

Rename is decided by `isRenameRestricted` in `utils.ts`; delete by `isDropRestricted` inside `TableDetailView`,
which covers the pinned grain-key row and, through `isScanMetadataColumn`, the scan pair. The two rules live in
different places and have drifted from the backend, which also refuses to drop an ordering-key or partition
column and to rename a partition column.

## Goals / Non-Goals

**Goals:**
- Both restrictions answered by pure functions in `utils.ts`, side by side, so the next backend rule is added
  where the others are.

**Non-Goals:**
- Letting Nullable be edited, or changing how a patch is built.

## Decisions

### D1. `isDropRestricted` becomes a pure `isDropRestrictedColumn(table, column)` next to `isRenameRestricted`

`TableDetailView` keeps the pinned-row check (a grid concern) and asks the util for the rest. The util
covers: scan-metadata pair (existing), ordering-key members and the partition column (new). The grain-key row
needs no entry: it is pinned and already excluded. `isRenameRestricted` gains the partition column.

*Alternative:* extend the callback inside the component. Rejected: the same rule set is needed by the modal
(rename) and the grid (drop), and a component callback cannot be unit-tested without mounting a grid.

### D2. Nullable in the edit modal is a disabled `DialSwitch` seeded from the column

The switch follows the Sensitive switch's placement and component, with a caption stating that nullability
cannot change once the column exists. It is never part of `ColumnEditValues`, so `buildColumnEditPatch` is
untouched and a patch can never carry it. This is the cheapest way to meet the QA ask without implying that
the flag is editable.

*Alternative:* omit it and explain in a tooltip. Rejected: the QA report is that the flag is missing.

### D3. The not-scannable statement lives in the header summary, next to the pair it replaces

`TableProperties` already renders the pair when declared. When the table is a source and both are absent it
renders a short statement in their place, from one new i18n string. The summary requirement said "no
substitute message"; that wording predates #4146, whose detail view section asks for the statement, and this
change corrects the spec to match.

### D4. Role fields reuse the count-collapsing tag renderer

`DialSelectField` accepts `customMultiSelectTagsRenderer`, and `MultiSelectTagsRenderer` already shows as many
tags as fit plus a `+N`. The three-line wrapper that binds the two moves from `Assets/BaseAssetList/utils.tsx`
into `MultiSelectTagsRenderer.tsx`, so the asset grid and the role fields import one definition.

### D5. The Values popup fix is a one-element change

A value row is a flex row of a `w-full` field column and the remove button. The column takes the full width, so
the button shrinks to 36 px while its content stays 40 px, and the 4 px overflow makes the popup's scroll
container draw a horizontal scrollbar (measured in the running app). Marking the button non-shrinking removes
it. The file is shared (`Common/Multiselect/Modal`); the fix adds no prop and no behaviour.

## Risks / Trade-offs

- **The partition column is checked by name.** A rename that the backend allows for other columns is refused
  here for the partition one only. → Matches the backend's reject; verified against its `bad_request`.
- **The count renderer measures hidden copies of every tag.** → Existing behaviour of the renderer, and role
  lists are short.
