## Context

See proposal.md — Why. Current state relevant to the approach:

- `SchemaManager` (shared by the Dataset Schema tab and the TestSuite `TestCasesSchemaModal`) already lets
  the Name cell be edited inline for every row, and mutates row objects **in place** (so AG Grid does not
  recreate the editing cell). Any extra property on a row object — such as a server `id` — therefore
  survives edits and reaches `PUT` untouched. The only frontend gap for a working rename is that
  `TestCaseSchema` does not declare `id`.
- Dataset page: `DatasetView` holds `originalDataset` (server state) and `selectedDataset`
  (`structuredClone`, edited). Save = `updateDataset` (PUT) first, then `updateTestCases` for dirty rows,
  then `clearDirtyAndRefresh()` + `router.refresh()`. Tabs are mounted conditionally, so opening the Test
  cases tab refetches test cases and expands them against `selectedDataset.testCaseSchema`.
- TestSuite page: the schema modal's Apply calls `onChangeDataset` without an etag, which PUTs
  immediately and reloads the dataset. A rename there is persisted before the grid refetches.
- Dataset create calls (`createTestSuiteWithDataset`, `createDatasetForSuite`) send no schema; clone
  sends only name/description.

## Goals / Non-Goals

**Goals:** carry `id` end to end; preview unsaved renames on the Dataset page without a server round trip;
case-insensitive duplicate validation shared by both `SchemaManager` hosts.

**Non-Goals:** a remap in the TestSuite grid (rename is persisted on Apply, so the refetch already has new
keys); a dedicated 409 branch in the save handler; touching `EditSchemaField.tsx` (not imported anywhere).

## Decisions

### D1. `id?: string` on `TestCaseSchema`, no stripping anywhere
Add the optional field to the shared model (`src/models/evaluation/test-suite.ts`) with a one-line
comment at the type that it is server-assigned and used only to classify renames. Because the same type
backs `SuiteSnapshot.testCaseSchema`, the optional run-snapshot `id` is covered for free.
`onAddField` keeps creating rows without `id`.
*Alternative:* a separate `DatasetSchemaField` type — rejected, every consumer would need to convert and
the snapshot type would diverge.

### D2. 409 via the existing error path
`DatasetView.onSave` already shows `getErrorNotification(errorHeader, errorMessage)` and refreshes on any
non-success PUT; the backend's message ("Cannot rename fields of PUBLIC dataset … bound to N test
suite(s)") is user-readable. No code-specific branch. The PUT is atomic, so the refresh reloads a
consistent server state. Same for the TestSuite modal path (`onChangeDataset` already toasts errors).

### D3. Rename remap as a pure util applied before row expansion
`remapRenamedFields(testCases, savedSchema, editedSchema)` in `src/utils/evaluation/` (next to
`test-case-grouping.ts`):
- Build renames = fields whose `id` exists in both schemas with different `name`.
- For each test case, rebuild `data` and every `multiTurnData[i]`: copy the entry, delete **all** old
  keys first, then set `new = original[old]` for each rename whose old key is present. Reading from the
  untouched original makes swaps (`a↔b`) and chains (`a→b`, `b→c`) correct, mirroring the backend.
- No renames → return the input unchanged (referential no-op).
`Datasets/TestCases/TestCasesList.refreshGrid` applies it to fetched test cases before
`expandTestCasesToRows`. Rows then carry new-name keys, so cell edits and `getDirtyRows` produce
new-name payloads, which is what the backend expects since the PUT (with the rename) runs before
`updateTestCases`.
*Alternative:* remap inside `expandTestCasesToRows` — rejected, it has four callers that don't need it.

### D4. Saved schema is a ref in the list, advanced by the save
The remap needs the server-side schema. `DatasetView` passes `originalDataset.testCaseSchema` as
`savedSchema` via `TabsContent` → `TestCases` → `TestCasesList`, which keeps it in a ref. After a
successful PUT the View calls `clearDirtyAndRefresh(selectedDataset.testCaseSchema)`, which advances the
ref **before** refetching. Without that, the refetch between the PUT and `router.refresh()` would remap
already-renamed server data against the old schema, and a swap would show swapped back. A ref rather
than View state because `clearDirtyAndRefresh` runs in the same tick as the PUT resolving — a state
update would not reach that refetch's closure.

### D5. Duplicate detection shared by both hosts
Pure util `getDuplicateFieldNames(schema): Set<string>` (lower-cased names occurring more than once,
ignoring empty names) in `src/utils/evaluation/`. Uses:
- `DatasetSchemaTab` validity dispatch: invalid if any name/type is empty **or** duplicates exist.
- `TestCasesSchemaModal` `disableConfirmButton`: same condition.
- `SchemaManager`: renders an error `DialNotification` above the grid naming the first duplicated name
  (in its original casing), the same shape `EndpointSchema/Columns` uses for duplicate response columns.
*Alternative:* mark the colliding Name cells `aria-invalid` — rejected: row edits deliberately skip grid
refresh so the focused input survives typing; repainting the *other* colliding row needs a forced cell
refresh that recreates the focused input. The sibling grid uses a banner only.

### D6. Refresh TestSuite validation after an immediate schema update
The TestSuite modal persists private-dataset schema changes immediately, outside the TestSuite Save flow.
After a successful `updateDataset`, `TestSuiteView.onChangeDataset` keeps reloading the dataset and also
calls `router.refresh()`. The server page then reruns `getTestSuite`, and the refreshed
`valid`/`validationWarnings` replace the stale client copy through the existing `originalTestSuite`
effect. The failure path does not refresh because no schema change was persisted.

## Risks / Trade-offs

- [In-place mutation means `id` survives only because nothing clones rows selectively] → unit test in
  `SchemaManager` asserting a renamed row still carries its `id` in the emitted schema.
- [Remove + re-add with the *same* name] → backend maps it back to the old `id` by name; the grid shows
  it empty until save (no `id` locally). Acceptable: the values come back after save.
- [JSON editor lets a user hand-edit or invent ids] → backend rejects unknown/duplicate ids with 400,
  surfaced by the existing error toast.

## Migration Plan

None on the frontend. Requires the backend from ai-dial-admin-evaluation-framework-backend#246; against
an older backend the extra `id` is absent from responses, so behavior falls back to today's name-based
diff.
