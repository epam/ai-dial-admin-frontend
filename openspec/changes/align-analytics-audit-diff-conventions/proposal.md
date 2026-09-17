# Bring the analytics revision diff under the shared audit conventions

## Why

The analytics revision diff is the only audit surface that overrides the shared comparator, and the
override misfires. `restoreEmptyValueRows` (`analytics-diffs.ts:163`) re-inserts rows the shared
comparator drops for having an empty value on both sides — but only into the `properties` bucket, so
one page now follows two rules: a table's own field with no value on either side is listed, the same
field on one of its columns is not. Worse, the rows it restores are mostly rows nothing can explain:
a pipeline snapshot's `state.*` members are `@NotAudited` on the service side, so a revision read
never restores them, and the diff prints a dozen empty `state.cursor_version`-style rows for every
pipeline revision.

Separately, analytics is the only resource family with no hidden-key set, and one of its fields —
`permissions` — is computed per request from the caller's own roles, so two admins reading the same
revision pair see different diffs.

## What Changes

- **The analytics diff drops rows that are empty on both sides**, exactly as every other resource
  type already does through `compareNestedFlatObject` / `fillNestedFlatObject`
  (`create-simple-diffs.ts:213,244`, the rule the container audit introduced). `restoreEmptyValueRows`
  and its single call site are removed; nothing replaces them.
  - A pipeline revision stops printing its empty `state.*` rows.
  - Issue #4486 — column attribute rows with an all-empty value are dropped — resolves as
    correct-by-convention. The column bucket was never wrong; the `properties` bucket was.
- **Analytics gains a hidden-key set per resource type**, the affordance `IMAGE_HIDDEN_KEYS` and
  `CONTAINER_HIDDEN_KEYS` already provide (`generate-diffs.ts:74-76`):
  - `Table` → `permissions`, because the service computes it from the caller's identity rather than
    from the revision.
  - `Pipeline` → `created_at`, `updated_at`, `state`.
  - `SavedQuery` → `id`, `created_at`, `updated_at`.
  - `generation`, `owner_id` and `owner_email` stay visible: the first is a declaration fact, the
    other two are resource state whose change is exactly what an audit should surface.
  - Timestamps are suppressed for the reason images suppress theirs: the activity row already carries
    when and by whom, in `epochTimestampMs` and `initiatedEmail`.
- **BREAKING for the spec, not for a consumer.** `An analytics revision diff shows every field of the
  snapshot` currently forbids both behaviors in as many words; its wording is narrowed rather than the
  requirement dropped.

## Non-goals

- **No change to any other resource family's diff.** The shared comparator's drop rule is not touched,
  and neither is the `properties`/`columns` grouping, the added/removed column markers, or the
  no-snapshot empty state.
- **No new backend request.** The `access` gap this uncovers (see `design.md`) is recorded, not worked:
  serving the table's role lists on a revision is the service's call to make.
- **No rollback, route or column-set changes.** The other analytics-vs-rest differences reviewed in
  this session — the global detail route, the absent `Version` column, the deleted-parent suppression,
  the textual status marker — were each decided to stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-audit-analytics-view`: the requirement `An analytics revision diff shows every field of
  the snapshot` changes on two points — a row is emitted per field that carries a value on at least
  one side of the comparison, and the prohibition on a hidden-key list is replaced by the per-resource
  set above. Its `Every field of a table snapshot appears in the diff` scenario and siblings are
  reworded, not removed.

## Impact

- `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/analytics-diffs.ts` — `restoreEmptyValueRows`
  removed; `buildAnalyticsDiff` gains the resource type it needs to pick a hidden-key set.
- `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts` — the one call site
  (`generateCurrentResource:177`) forwards the `type` it already holds.
- Specs under `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/tests/`.
- No i18n key, no server action, no API call and no component changes: the diff engine's output shape
  is unchanged, only which rows it contains.
