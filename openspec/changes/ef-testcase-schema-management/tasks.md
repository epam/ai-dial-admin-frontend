## 1. i18n Keys & Constants

- [ ] 1.1 Add new i18n keys to `TestSuitesI18nKey` enum in `src/constants/i18n.ts` (TestCaseSchema, SchemaField, AddField, EditField, NoSchemaFields, DuplicateFieldName)
- [ ] 1.2 Add English translations for new keys in `src/locales/en.ts`

## 2. Grid Column Definitions

- [ ] 2.1 Add `getSchemaFieldGridColumns()` function to `src/components/TestSuites/utils/columns.tsx` — columns: Name, Type (lowercase formatter), Required (boolean), Description

## 3. Core Components

- [ ] 3.1 Create `src/components/TestSuites/TestCaseSchema/EditSchemaField.tsx` — inline edit panel with Name (disabled for existing), Type dropdown (TestCaseItemType values), Required checkbox, Description input, Save/Cancel buttons. Save disabled when name is empty or duplicate.
- [ ] 3.2 Create `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx` — collapsible panel with ag-grid (GridView), Add button, Edit/Remove row actions, editableFieldIndex state, EditSchemaField panel. Mirrors `Columns/Columns.tsx` pattern. Calls `onChangeTestCaseSchema(schema[])` on any modification.

## 4. Integration

- [ ] 4.1 Update `src/components/TestSuites/TestCases/Header.tsx` — add schema toggle button (ghost style, icon) with `onToggleSchema` callback and `isSchemaOpen` prop
- [ ] 4.2 Update `src/components/TestSuites/TestCases/TestCasesList.tsx` — add `isSchemaOpen` state, toggle handler, render SchemaManager panel above the grid when open. Wire `onChangeTestCaseSchema` to call parent `onChange` with updated `testCaseSchema`.

## 5. Testing

- [ ] 5.1 Unit tests for `getSchemaFieldGridColumns()` in `utils/columns` — verify column definitions, type formatter
- [ ] 5.2 Component test for `EditSchemaField` — renders form fields, Save disabled on empty name, Save disabled on duplicate name, Cancel closes without changes
- [ ] 5.3 Component test for `SchemaManager` — renders grid with fields, Add creates new field and opens edit panel, Remove deletes field, Edit opens panel for selected field

## 6. Quality Checks

- [ ] 6.1 Run lint, format, and type checks (`nx lint ai-dial-admin`, `nx format:check`, `nx typecheck ai-dial-admin`)
- [ ] 6.2 Run unit tests (`nx test ai-dial-admin`)
