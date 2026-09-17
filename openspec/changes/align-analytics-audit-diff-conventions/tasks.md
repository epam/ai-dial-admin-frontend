# Tasks — align the analytics revision diff with the shared audit conventions

## 1. Drop rows that are empty on both sides

- [ ] 1.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/analytics-diffs.ts`, delete
      `restoreEmptyValueRows` (`:163-170`) and its call on `result.properties` (`:222`), so the
      `properties` bucket is built by `compareNestedFlatObject` / `fillNestedFlatObject` alone, like
      every other bucket. Leave the column-bucket path, the `bucket.length` gate and
      `applyBucketStatus` untouched.
- [ ] 1.2 Rewrite the test `emits a row for every field an enrich-pipeline snapshot carries, empty
      collections included` (`tests/analytics-diffs.spec.ts:263`) — its invariant is the one this
      change reverses. The replacement asserts the new rule on the same `olderPipeline` /
      `newerPipeline` fixtures: every field holding a value on at least one side is emitted, and
      `inputs`, `input_bindings` (empty on both revisions) are not. Update the fixture comment at
      `:54-57`, which states the old intent.

## 2. Hidden-key sets per resource type

- [ ] 2.1 In `analytics-diffs.ts`, add an `ANALYTICS_HIDDEN_PARAMETERS` map —
      `Partial<Record<ActivityAuditResourceType, Set<string>>>` beside `ANALYTICS_COLUMN_PARAMETERS`
      — carrying `Table` → `permissions`, `Pipeline` → `created_at`, `updated_at`, `state`, and
      `SavedQuery` → `id`, `created_at`, `updated_at`, plus a lookup that maps `TableColumn` onto the
      `Table` set (its snapshot *is* a table definition) and answers an empty set for any other type.
      Each entry carries the one-line reason the spec's table gives; do not restate it per call site.
- [ ] 2.2 Give `buildAnalyticsDiff` the resource type: add the parameter and filter the union
      parameter list for the `properties` bucket (`:208-210`) by the leaf's **first** `.`-separated
      segment, so `permissions` removes `permissions.write` / `permissions.modify` and `state`
      removes every `state.*` leaf. The column buckets are not filtered — a column's parameters come
      from `columnRows`, not from the snapshot walk.
- [ ] 2.3 In `generate-diffs.ts`, forward the `type` that `generateCurrentResource` already holds to
      `buildAnalyticsDiff` (`:177`). No other call site exists.

## 3. Tests

- [ ] 3.1 `tests/analytics-diffs.spec.ts`: a column attribute empty on both sides emits no row; a
      column present on one side only still produces its bucket with placeholder rows; a table field
      empty on both sides emits no row.
- [ ] 3.2 `tests/analytics-diffs.spec.ts`: per resource type — a `Table` snapshot's `permissions`
      leaves are absent while its other fields remain; a `Pipeline` snapshot emits no `created_at`,
      `updated_at` or `state.*` row but still emits `generation`; a `SavedQuery` snapshot emits no
      `id`, `created_at` or `updated_at` row but still emits `owner_id` and `owner_email`; a
      `TableColumn` activity suppresses `permissions` like its table. Add a saved-query fixture —
      there is none today.
- [ ] 3.3 `tests/generate-diffs.spec.ts`: `generateCurrentResource` passes the resource type through,
      so a suppressed key is absent by resource type and a non-analytics resource type's diff is
      byte-identical to today's (the shared key walk must not see the new argument).
- [ ] 3.4 Guard the empty-state path: with both snapshots absent the result is still a single empty
      `properties` bucket, so `activity-audit-diff-empty-state` keeps firing. Dropping empty rows makes
      an all-empty bucket more likely, and that spec keys on rendered sections.

## 4. Quality checks

- [ ] 4.1 From `apps/ai-dial-admin/`: `npx prettier --write` over exactly the files this change touched
      (never a directory — a human works in this tree concurrently); `npm run lint 2>&1 | tail -30`,
      comparing against the pre-existing warning count rather than aiming at zero;
      `npx tsc -p tsconfig.app.json --noEmit` (green on `development` and blocking in CI, so any error
      here is this change's); and
      `npx vitest run src/components/ActivityAudit --reporter=dot`, then the full
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. Report the output.

## 5. Browser verification

Not included: the owner declined a `spec-browser-verify` task for this change in the session that
proposed it. Every scenario here is a claim about which rows `buildAnalyticsDiff` emits, and tasks
3.1-3.4 assert them directly on its output.
