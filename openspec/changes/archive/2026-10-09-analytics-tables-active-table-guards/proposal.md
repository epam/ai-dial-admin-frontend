## Why

QA feedback on #3847 found that an `ACTIVE` table's detail view offers actions the backend always refuses
(dropping an ordering-key or partition column, renaming a partition column), hides a column's Nullable flag
from the edit modal, never says that a table without a scan-metadata pair is not scannable (the requirement
from #4146), and clips a long role list in Manage access without any way to see or scroll the rest.

## What Changes

- **Delete is not offered** for a column the ordering key or the partition column names, as it already is for
  the grain key and the scan-metadata pair. The backend answers such a drop with 422.
- **The partition column's name is not editable**, as the ordering key's, the grain key's and a `_`-prefixed
  column's already are. Renaming one fails with `bad_request`.
- **The edit modal shows Nullable**, read-only. Nullability is fixed once the column exists, so it is shown
  for reference and never sent.
- **A scannability statement.** An `ACTIVE` source that declares neither `identity_column` nor
  `version_column` says in the header summary that the table is not scannable, in place of silently showing
  nothing. This replaces the "no substitute message" wording of the summary requirement.
- **Role lists collapse to a count.** Manage access shows as many role tags as fit and a `+N` for the rest.
- **The Values popup loses its horizontal scrollbar.** The remove button of a value row shrank below its own
  width and its content spilled past the row. This is a layout fix in a shared popup with no spec-level
  behaviour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: "Table detail column schema management" (drop and rename restrictions, read-only
  Nullable in the edit modal, the not-scannable statement) and "Full-admin per-table role management panel"
  (role tags collapse to a count).

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/`: `TableDetailView.tsx`, `EditColumnPopup.tsx`,
  `TableProperties.tsx`, `TableAccessPanel.tsx`, `utils.ts`, their specs.
- `apps/ai-dial-admin/src/components/Common/Multiselect/Modal/NewItemInput.tsx`: a one-element layout fix,
  shared with every popup built on `Multiselect`.
- `apps/ai-dial-admin/src/components/Grid/CellRenderers/MultiSelectTagsRenderer.tsx` and
  `Assets/BaseAssetList/utils.tsx`: the tag-renderer wrapper moves to the first so both features share it.
- `apps/ai-dial-admin/src/locales/en.ts` and `src/constants/i18n.ts`: two new strings.

## Non-goals

- Making Nullable editable: the backend patch has no member for it.
- Draft-surface changes (the previous change) and the enum or Object rules of the column row editor.
- The columns grid alignment and top-border reports: already fixed earlier (see the same issue's history).
- Backend changes.
