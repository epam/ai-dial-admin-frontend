## Why

The `TestCaseSchema` model exists on the `TestSuite` entity and is already used by input bindings and metric bindings dropdowns, but there is no UI for users to manage schema fields (add, edit, remove). Users cannot define or adjust the test case data structure from the frontend — they must rely on the backend to infer it. Adding a schema manager gives users direct control over the shape of their test case data.

## What Changes

- Add a collapsible **Test Case Schema Manager** panel inside the Test Cases tab, toggled via a header button
- The panel displays schema fields in an ag-grid with columns: Name, Type, Required, Description
- Each field row has Edit and Remove action columns
- An inline edit panel (below the grid) allows editing a field's properties — following the existing Response Columns `EditColumn` pattern
- Add Field creates a blank entry and opens the edit panel
- Name is editable only when adding a new field (rename is postponed — BE not ready)
- Type is a dropdown of the existing `TestCaseItemType` enum values (STRING, NUMBER, BOOLEAN, OBJECT, ARRAY, FILE)
- Drag-and-drop reorder of fields (nice-to-have)
- Schema changes are persisted through the existing `updateTestSuite` flow (no new API endpoints)
- BE handles data migration for existing test cases when schema changes

## Capabilities

### New Capabilities
- `testcase-schema-manager`: Collapsible inline panel for managing TestCaseSchema fields on a test suite — add, edit, remove, reorder fields with type/required/description metadata

### Modified Capabilities

## Impact

- **Components**: New components under `src/components/TestSuites/TestCaseSchema/` (SchemaManager, EditSchemaField)
- **Existing components**: `TestCasesList.tsx` and `Header.tsx` gain a toggle button and host the schema panel
- **Column utils**: New `getSchemaFieldGridColumns()` in `utils/columns.tsx`
- **i18n**: New keys in `TestSuitesI18nKey` enum and `en.ts` locale
- **API**: No new endpoints — uses existing `updateTestSuite` with `testCaseSchema` property
- **No breaking changes** to existing functionality
