## Context

The `TestSuite` model has a `testCaseSchema?: TestCaseSchema[]` property that defines the structure of test case data fields. Currently this property is read-only in the UI — used only as a dropdown source for input bindings (`TemplateVariables.tsx`) and metric bindings (`Bindings.tsx`). There is no way for users to add, edit, or remove schema fields from the frontend.

Schema changes are persisted via the existing `updateTestSuite` flow — no new API endpoints are needed. The backend handles data migration for existing test cases when schema changes.

## Goals / Non-Goals

**Goals:**
- Let users manage test case schema fields (add, inline-edit, remove) directly in the UI
- Use inline grid editing (EditableCellRenderer) consistent with how test case data is edited
- Integrate into the Test Cases tab as a collapsible panel between header and grid
- All user-facing strings internationalized

**Non-Goals:**
- Rename field functionality (postponed — BE not ready)
- FE-side data migration when schema changes (BE handles this)
- Validation of existing test case data against schema changes
- Type coercion or compatibility warnings when changing field types
- Drag-and-drop reorder (nice-to-have, deferred)

## Decisions

### 1. Panel placement: topContent inside ListEntities

The schema manager panel is rendered via ListEntities' `topContent` prop, placing it between the header row (with Test Case Schema toggle, Import, Export, Add buttons) and the test cases grid. Both panels are always visible simultaneously when the schema panel is open.

**Why topContent over separate section:** Keeps schema editing contextually near the test cases it defines. The toggle just shows/hides the panel — buttons remain accessible.

### 2. Inline grid editing instead of separate edit panel

The original design mirrored the Response Columns pattern (EditColumn.tsx) with a separate edit panel below the grid. This was changed to **inline grid editing** using EditableCellRenderer for Name/Description, SelectCellRenderer for Type, and ag-grid's built-in checkbox for Required.

**Why:** Inline editing is more direct and matches how the test case data grid itself works. It eliminates the extra click to open/close an edit panel. The EditSchemaField component exists but is unused — kept for potential future use.

### 3. ag-grid EditableCellRenderer focus pattern

When using EditableCellRenderer in ag-grid columns, the column definition MUST include:
- `editable: false` — without this explicit setting (vs undefined), ag-grid's keyboard handler steals focus from the input
- `valueGetter` — without this, ag-grid's change detection on `setValue` triggers cell refresh/recreation
- In-place data mutation in the onChange callback (`data[field] = value`) — ensures `setValue` sees no change

This pattern is documented in `openspec/config.yaml` and matches `getTestCaseColumns`.

### 4. Data flow: dirty-ref + flush-on-blur

Unlike the original design (direct onChange on every modification), the implementation uses a **deferred update pattern** to prevent focus loss:

```
User types in cell → onCellChange mutates data in place + updates schemaRef
User leaves grid (blur) or unmounts panel → flushToParent(schemaRef.current)
  → TestCasesList → onChange({ ...testSuite, testCaseSchema })
    → View.tsx updates selectedTestSuite state
      → Save button → updateTestSuite API
```

Structural changes (add field, remove field) and checkbox toggles notify the parent immediately since they don't involve text input focus.

### 5. No SaveValidationContext

The original design planned to use SaveValidationContext (like Response Columns). The inline editing approach doesn't need it — empty field names are allowed during editing, and validation happens at save time on the backend.

### 6. Toggle button in HeaderButtons

A ghost-style button with `IconSettings` is added to `HeaderButtons`. It shows solid style when schema panel is open. Accepts `onToggleSchema` callback and `isSchemaOpen` flag.

## Risks / Trade-offs

- **Schema and test case data can diverge** → Mitigated: BE handles reconciliation. FE treats schema as metadata only.
- **No undo for field removal** → Mitigated: Save is a separate explicit action. User can navigate away without saving to discard changes.
- **Grid rebuild after schema change** → The test cases grid derives columns from actual test case data, not from testCaseSchema. Schema changes won't affect the grid columns until the BE processes the update and test cases are re-fetched.
- **Deferred flush on blur** → If the user clicks Save while a schema field is still focused, the blur fires first (rAF), then the click handler runs. React 18 batching ensures the save reads the updated state.
