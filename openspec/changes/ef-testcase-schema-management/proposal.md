## Why

The `TestCaseSchema` model exists on the `TestSuite` entity and is already used by input bindings and metric bindings dropdowns, but there is no UI for users to manage schema fields (add, edit, remove). Users cannot define or adjust the test case data structure from the frontend — they must rely on the backend to infer it. Adding a schema manager gives users direct control over the shape of their test case data.

## What Changes

- Add a collapsible **Test Case Schema Manager** panel inside the Test Cases tab, toggled via a header button
- The panel displays schema fields in an ag-grid with inline-editable columns: Name, Type (dropdown), Required (checkbox), Description
- Each field row has a Remove action column
- All fields are edited directly in the grid cells (same pattern as test case data editing), no separate edit panel
- Add Field appends a blank row to the grid
- Type is a dropdown of the existing `TestCaseItemType` enum values (STRING, NUMBER, BOOLEAN, OBJECT, ARRAY, FILE)
- Drag-and-drop reorder of fields (nice-to-have, not yet implemented)
- Schema changes are persisted through the existing `updateTestSuite` flow (no new API endpoints)
- BE handles data migration for existing test cases when schema changes

## Capabilities

### New Capabilities
- `testcase-schema-manager`: Collapsible inline panel for managing TestCaseSchema fields on a test suite — add, inline-edit, remove fields with type/required/description metadata

### Modified Capabilities

## Impact

- **Components**: New component under `src/components/TestSuites/TestCaseSchema/` (SchemaManager). EditSchemaField exists but is unused (kept for potential future advanced-edit mode).
- **Existing components**: `TestCasesList.tsx` and `Header.tsx` gain a toggle button; `ListEntities` gains a `topContent` prop to host the schema panel between header and grid
- **Column utils**: New `getSchemaFieldGridColumns()` in `utils/columns.tsx`
- **i18n**: New keys in `TestSuitesI18nKey` enum and `en.ts` locale
- **API**: No new endpoints — uses existing `updateTestSuite` with `testCaseSchema` property
- **No breaking changes** to existing functionality
