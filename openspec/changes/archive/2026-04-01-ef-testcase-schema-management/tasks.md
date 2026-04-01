## 1. i18n Keys & Constants

- [x] 1.1 Add new i18n keys to `TestSuitesI18nKey` enum in `src/constants/i18n.ts` (TestCaseSchema, SchemaField, AddField, EditField, NoSchemaFields, SchemaDescription, DuplicateFieldName)
- [x] 1.2 Add English translations for new keys in `src/locales/en.ts`

## 2. Grid Column Definitions

- [x] 2.1 Add `getSchemaFieldGridColumns()` function to `src/components/TestSuites/utils/columns.tsx` — columns: Name (EditableCellRenderer, editable:false, valueGetter), Type (SelectCellRenderer), Required (agCheckboxCellRenderer, editable:true), Description (EditableCellRenderer, editable:false, valueGetter)

## 3. Core Components

- [x] 3.1 Create `src/components/TestSuites/TestCaseSchema/EditSchemaField.tsx` — standalone edit form (unused by SchemaManager, kept for potential future use)
- [x] 3.2 Create `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx` — inline-editable ag-grid (GridView) with Add/Remove actions. Uses dirty-ref + flush-on-blur pattern for text edits, immediate parent notification for structural changes (add/remove) and checkbox toggles. Mutates row data in place to prevent ag-grid cell refresh during typing.

## 4. Integration

- [x] 4.1 Update `src/components/TestSuites/TestCases/Header.tsx` — add schema toggle button (solid when open, ghost when closed) with `onToggleSchema` callback and `isSchemaOpen` prop
- [x] 4.2 Update `src/components/TestSuites/TestCases/TestCasesList.tsx` — add `isSchemaOpen` state, toggle handler, render SchemaManager via ListEntities `topContent` prop (between header and test cases grid). Wire `onChangeTestCaseSchema` to call parent `onChange`.
- [x] 4.3 Add `topContent` prop to `src/components/ListView/List.tsx` (ListEntities) — renders between header row and grid

## 5. Testing

- [x] 5.1 Unit tests for `getSchemaFieldGridColumns()` in `utils/columns` — verify column definitions, cell renderers, editable flags
- [x] 5.2 Component test for `EditSchemaField` — renders form fields, Save disabled on empty name, Save disabled on duplicate name, Cancel closes without changes
- [x] 5.3 Component test for `SchemaManager` — renders grid with fields, Add creates new field, Remove deletes field, empty state display

## 6. Quality Checks

- [x] 6.1 Run lint, format, and type checks (`nx lint ai-dial-admin`, `nx format:check`, `nx typecheck ai-dial-admin`)
- [x] 6.2 Run unit tests (`nx test ai-dial-admin`)
