## Context

The `TestSuite` model has a `testCaseSchema?: TestCaseSchema[]` property that defines the structure of test case data fields. Currently this property is read-only in the UI — used only as a dropdown source for input bindings (`TemplateVariables.tsx`) and metric bindings (`Bindings.tsx`). There is no way for users to add, edit, or remove schema fields from the frontend.

The closest existing pattern is the **Response Columns** manager in `EndpointSchema > Columns/Columns.tsx` + `EditColumn.tsx`: an ag-grid listing items with Edit/Remove actions, and an inline edit panel that appears below the grid when editing.

Schema changes are persisted via the existing `updateTestSuite` flow — no new API endpoints are needed. The backend handles data migration for existing test cases when schema changes.

## Goals / Non-Goals

**Goals:**
- Let users manage test case schema fields (add, edit properties, remove, reorder) directly in the UI
- Follow the established Response Columns pattern for consistency
- Integrate into the Test Cases tab as a collapsible panel
- All user-facing strings internationalized

**Non-Goals:**
- Rename field functionality (postponed — BE not ready)
- FE-side data migration when schema changes (BE handles this)
- Validation of existing test case data against schema changes
- Type coercion or compatibility warnings when changing field types

## Decisions

### 1. Panel placement: collapsible section above the test cases grid

The schema manager panel lives inside `TestCasesList`, toggled by a button in the `HeaderButtons` toolbar. When expanded, it renders above the ag-grid.

**Why over sidebar:** The Response Columns pattern uses an inline panel, not a sidebar. Sidebars are reserved for heavier workflows (TryOut). A collapsible section keeps the user in context of the test cases they're defining schema for.

**Why in TestCasesList, not TestCases:** The schema is conceptually part of the test case data structure. Placing it near the grid header (alongside Import/Export/Add) makes the relationship clear.

### 2. Component structure mirrors Response Columns

```
src/components/TestSuites/TestCaseSchema/
├── SchemaManager.tsx      (mirrors Columns.tsx)
└── EditSchemaField.tsx    (mirrors EditColumn.tsx)
```

- `SchemaManager` manages the grid, add/remove operations, and `editableFieldIndex` state
- `EditSchemaField` is the inline form panel with Name, Type, Required, Description fields
- Column definitions added to `utils/columns.tsx` as `getSchemaFieldGridColumns()`

**Why not reuse Columns.tsx directly:** The field shapes differ (ResponseColumn has expression/displayName; TestCaseSchema has name/type/required/description). The pattern is reused, not the component.

### 3. Name field is read-only after creation

When adding a new field, Name is editable. When editing an existing field, Name is displayed but disabled. This prevents accidental data loss since rename requires BE coordination that isn't ready yet.

### 4. Data flow through existing onChange chain

```
SchemaManager → onChangeTestCaseSchema(schema[])
  → TestCasesList → onChange({ ...testSuite, testCaseSchema })
    → View.tsx updates selectedTestSuite state
      → Save button → updateTestSuite API (includes testCaseSchema)
```

No new context providers or state management needed. The schema panel simply calls the same `onChange` callback that `TestCasesList` already receives from its parent.

### 5. Validation uses SaveValidationContext

Like Response Columns, the schema manager dispatches validation state via `SaveValidationContext`. An empty name on any field marks the form as invalid, preventing save.

### 6. Reorder via drag-and-drop (nice-to-have)

The project already has `react-dnd` as a dependency. If implemented, row drag handles in the ag-grid allow reordering schema fields. The reordered array is passed through the same `onChangeTestCaseSchema` callback. This can be added as a follow-up if the core CRUD is delivered first.

### 7. Toggle button in HeaderButtons

A ghost-style button with a settings/schema icon (`IconSettings` or `IconColumns` from `@tabler/icons-react`) is added to `HeaderButtons`. It accepts an `onToggleSchema` callback and an `isSchemaOpen` flag to visually indicate the active state.

## Risks / Trade-offs

- **Schema and test case data can diverge** → Mitigated: BE handles reconciliation. FE treats schema as metadata only.
- **No undo for field removal** → Mitigated: Save is a separate explicit action. User can navigate away without saving to discard changes. Also BE handles data, so removing a schema field doesn't immediately delete test case data.
- **Grid rebuild after schema change** → The test cases grid derives columns from actual test case data, not from testCaseSchema. Schema changes won't affect the grid columns until the BE processes the update and test cases are re-fetched.
