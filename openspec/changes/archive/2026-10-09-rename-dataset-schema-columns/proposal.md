## Why

Renaming a dataset schema field silently drops that column's value from every test case (Issue #4841).
`PUT /api/v1/datasets/{id}` diffed schemas by `name`, so a rename was indistinguishable from
delete + add. The backend (ai-dial-admin-evaluation-framework-backend#246) now gives every schema
field a stable, server-assigned `id` and treats "same `id`, new `name`" as a rename that moves the stored
values. The frontend has to carry that `id` through to make rename real instead of destructive.

## What Changes

- `TestCaseSchema` gains an optional `id` (server-assigned UUID). Existing fields keep their `id` through
  every edit in `SchemaManager` and it is sent back on `PUT`; newly added fields have no `id`.
- Renaming an existing field's Name keeps its `id`, so on save the backend moves the field's test-case
  values to the new name instead of dropping them. Applies to both entry points that share
  `SchemaManager`: the Dataset Schema tab and the TestSuite "Test case schema" modal. After the modal
  updates the private dataset, the TestSuite page refreshes its server data so `valid` and
  `validationWarnings` reflect the updated schema.
- While a rename is unsaved on the Dataset page, the test-cases grid shows the field's existing values
  under the new column name (remapped by `id`), rather than an empty column.
- Field names are validated as unique **case-insensitively**; a duplicate shows an inline error
  notification naming it and blocks Save. Matches the backend's new 400.
- A rename the backend rejects (409 `DATASET_FIELD_RENAME_FORBIDDEN` — PUBLIC dataset bound to ≥1 suite)
  surfaces through the existing save-error toast with the backend's message; nothing is persisted.
- No `id` is ever sent on dataset create (`POST`); the app's create calls send no schema today, and that
  stays true.

## Non-goals

- Proactively locking Name for PUBLIC datasets bound to suites — the 409 toast is the only guard.
- Changing the "Revalidating test cases…" toast, although revalidation now completes inside the `PUT`.
- Any change to CSV/ZIP import/export (still name-based; backend ignores/strips ids there).
- Showing or using `suiteSnapshot.testCaseSchema[].id` on runs beyond accepting it in the type.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dataset-schema`: editing an existing field's Name becomes a value-preserving rename; the stale
  "Name input disabled for existing field" scenario is replaced; duplicate-name validation becomes
  case-insensitive with an inline error notification; unsaved renames are previewed in the test-cases grid; rename
  rejection (409) is specified.
- `testcase-schema-manager`: same rename and case-insensitive duplicate rules for the shared
  `SchemaManager` (this spec duplicates the Dataset-page editor requirement and carries the same stale
  "Name disabled" scenario).

## Impact

- Model: `src/models/evaluation/test-suite.ts` (`TestCaseSchema.id`), which is also the run snapshot's
  schema type.
- `src/components/TestSuites/TestCaseSchema/SchemaManager.tsx`, `src/components/Datasets/Schema/SchemaTab.tsx` (validity gate).
- `src/components/Datasets/View/*` and `src/components/Datasets/TestCases/TestCasesList.tsx`
  (persisted schema passed down for the rename remap); `src/utils/evaluation/` (pure remap helper).
- TestSuite modal path (`TestCasesSchemaModal`) persists immediately via `updateDataset`, so it gets
  rename for free once `id` is preserved — no grid remap needed there.
- Backend contract: `PUT /api/v1/datasets/{id}` with `testCaseSchema[].id`; new 409 code. No new routes
  or env vars.
