## Why

On a source table, a column that is the grain key of an enrichment can be renamed in the Edit column modal and dropped from the columns grid, and only the save fails: the service refuses with a validation error because the enrichment joins on that shared column name. The user learns the rule from a rejected request instead of from the page.

## What Changes

- The detail page of an `ACTIVE` source table learns which of its columns key an enrichment, from the listing of tables and the definitions of the enrichments it names as built on this table.
- A column that keys an enrichment is treated like the other rename-locked columns: its Name field in the edit modal is disabled, it cannot be renamed inline in the columns grid, and its drop action is disabled.
- The edit modal states why the Name field is locked and names the enrichment, saying the enrichment must be dropped first if the column has to change.
- The display name, tag, description and sensitive fields of such a column stay editable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: a new requirement covers the columns an enrichment depends on; the existing column-management requirement is untouched.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/` — `TableDetailView.tsx`, `TableProperties.tsx`, `EditColumnPopup.tsx`, `utils.ts`
- `apps/ai-dial-admin/src/constants/i18n.ts` and the locale dictionaries — one hint string
- No new endpoint: the listing names each enrichment's source table, and an enrichment's own definition carries its grain key.
