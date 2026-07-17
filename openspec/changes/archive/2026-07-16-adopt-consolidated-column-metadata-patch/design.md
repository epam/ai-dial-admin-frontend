# Design — adopt consolidated column-metadata PATCH

## Context

The backend collapsed four column-metadata PATCH ops into one `update` merge-patch list. The FE's
`AnalyticsSchemaPatch` and `buildColumnEditPatch` still emit the old per-op arrays, one of which
(`redescribe`) never existed on the backend at all. The unknown keys are silently dropped, so column
metadata editing quietly no-ops. This change realigns the FE contract and, as a direct consequence of
`description` now being editable, surfaces it in the modal.

## Wire contract

```
PATCH /v1/tables/{name}/schema
{
  add?:    ColumnRequest[],                 // structural — unchanged
  drop?:   string[],                        // structural — unchanged
  rename?: { from, to }[],                  // structural — unchanged
  update?: {                                // NEW — replaces retag/set_display_name/redescribe
    name: string,                           // exposed (post-rename) column name
    tag?: string,                           // merge-patch: omit=leave, ""=clear, value=set
    display_name?: string,                  // merge-patch
    description?: string,                   // merge-patch
    sensitive?: boolean                     // omit=leave, true/false=set   (FE never sends this)
  }[]
}
```

## Decision 1 — one `update` entry, only-changed fields

`buildColumnEditPatch` already diffs each metadata field against the original and only touches changed
ones. That maps cleanly onto merge-patch: build a single object keyed by `name`, add a property only
when that field changed, and emit `update: [entry]` only if at least one metadata field changed.

```ts
// after
export const buildColumnEditPatch = (
  original: AnalyticsTableColumn,
  edited: ColumnEditValues,
): AnalyticsSchemaPatch | null => {
  const patch: AnalyticsSchemaPatch = {};
  const name = edited.name.trim();
  if (name && name !== original.name) patch.rename = [{ from: original.name, to: name }];
  const target = patch.rename ? name : original.name;

  const update: AnalyticsColumnMetadataUpdate = { name: target };
  if (normalized(edited.tag) !== normalized(original.tag)) update.tag = normalized(edited.tag);
  if (normalized(edited.display_name) !== normalized(original.display_name))
    update.display_name = normalized(edited.display_name);
  if (normalized(edited.description) !== normalized(original.description))
    update.description = normalized(edited.description);
  if (edited.sensitive !== Boolean(original.sensitive)) update.sensitive = edited.sensitive;

  if (Object.keys(update).length > 1) patch.update = [update];   // >1 → a metadata field changed
  return Object.keys(patch).length ? patch : null;
};
```

- **Unchanged field → omitted** → backend leaves it (merge-patch absent).
- **Cleared field → `""`** → backend clears it (merge-patch blank). `normalized()` already trims to `""`.
- **Set field → trimmed value** → backend sets it.
- The `> 1` guard (the entry always carries `name`) prevents sending a metadata-only `update` when only
  a rename changed.

## Decision 2 — `sensitive` marked visually and made editable

The backend returns `sensitive` on column responses (`TableDto.ColumnDto`) and query-schema fields
(`QuerySchemaFieldDto`), and documents it as "exposed on the query path to full admins only" — an
access-restriction signal, not cosmetic. So the flag is surfaced, not just typed:

- **Read models** gain `sensitive?: boolean`: `AnalyticsTableColumn`, `AnalyticsEntityField`,
  `FieldOption`. No transform layer exists — backend JSON is cast directly — so the model additions are
  the whole read-side wiring; `fieldsToOptions` passes `sensitive` through.
- **Visual = a colored dot, not a lock.** A shared `Common/SensitiveIndicator` renders a small
  `bg-yellow-400` (bright amber-gold) dot with `role="img"` + `aria-label="Sensitive"`. It carries **no
  tooltip of its own** — both host contexts already own a cell/row tooltip, so the dot stays a pure
  marker and tooltips never double up (the earlier nested-`DialTooltip` doubling is why).
- **Table grid**: the marker is rendered **inline in the name cell, after the name** via a
  `ColumnNameCellRenderer` (name text + trailing dot when `data.sensitive`). The name column stays
  editable — ag-grid swaps in the cell editor on edit, so the renderer only affects display. The
  sensitive note is folded into the name column's `tooltipValueGetter` (`"<name> — Sensitive"`), so the
  cell has a single tooltip rather than the grid's default value tooltip plus the dot's.
- **Query Builder dropdown**: the dot sits in the option's primary line, after the field label; the
  single row-level `DialTooltip` carries the note (`"Sensitive — <description>"`, either part optional).
- **Tooltip copy is just "Sensitive"** — short, not the verbose "exposed on the query path…" sentence.
- **Editable (post-creation)**: `ColumnEditValues` gains `sensitive: boolean`; the modal seeds it from
  `column.sensitive ?? false` and renders a `DialSwitch`. `buildColumnEditPatch` diffs
  `edited.sensitive !== Boolean(original.sensitive)` and, when changed, sets `update.sensitive` (a
  boolean, so it rides the same single `update` entry as the string metadata fields). Because
  `sensitive` is a real boolean rather than a string, it is compared directly (not through
  `normalized()`), and `false` is a legitimate value (turning the flag off), distinct from "unchanged".
- **Editable (at creation)**: `ColumnRow` and `createColumnRow` gain `sensitive: boolean` (default
  `false`); `ColumnRowsEditor` renders a per-row `DialSwitch` beside Nullable, so both the Add columns
  popup and the Create table form can set it. `toTableColumns` includes `sensitive: true` only when the
  row's flag is on (mirroring how it already omits an empty `tag`) — the backend
  `CreateTableRequest.ColumnRequest` accepts `sensitive`, and omitting it defaults to non-sensitive.

## Decision 3 — description joins the modal now

`ColumnEditValues.description` and `EditColumnPopup`'s seed (`description: column.description ?? ''`)
already exist; only the input row is missing. Add a fourth `DialInput` labeled with the existing
`AnalyticsTablesI18nKey.Description`. No new i18n key, no new state wiring — this flips the dead
`description` diff branch live. Blank description is valid input meaning "clear", consistent with
display name and tag.

## Risks

- **Low.** The change is a contract realignment plus one input field. The main correctness surface is
  the patch-builder shape, covered by unit tests. The description field's save path is exercised the
  same way display name / tag already are.
