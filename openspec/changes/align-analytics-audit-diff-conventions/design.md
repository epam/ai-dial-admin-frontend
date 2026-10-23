# Design — align the analytics revision diff with the shared audit conventions

## Context

See `proposal.md` — Why. Three structural facts shape the approach:

1. **The analytics diff is a separate branch, not a variant of the shared path.**
   `generateCurrentResource` (`generate-diffs.ts:169-178`) returns `buildAnalyticsDiff(current, compare, isCurrent)`
   as its first statement for `isAnalyticsResource(type)`, before the shared key walk and before
   `IMAGE_HIDDEN_KEYS` / `CONTAINER_HIDDEN_KEYS` are ever consulted. Whatever this change adds for
   analytics has to live on the analytics side; the existing hidden-key sets are unreachable from it.
2. **The analytics projector emits leaf paths, not top-level keys.** `getSnapshotLeaves` flattens a
   snapshot to dotted parameters (`grain.grain_key`, `partition_by.granularity`), so a suppressed
   *member* is a suppressed *path prefix*: hiding `state` means hiding `state.cursor_version`,
   `state.lag_seconds` and every other leaf beneath it. The shared sets, which run before flattening,
   never had to express this.
3. **The empty-row restore has one call site and no other caller.** `restoreEmptyValueRows`
   (`analytics-diffs.ts:163-170`) is module-private and applied once, to `result.properties`
   (`:222`). Removing it cannot affect the container, image or admin diffs.

## Goals / Non-Goals

**Goals:**

- One drop rule across the whole diff engine, so the `properties` bucket and a column bucket behave
  the same way on the same page.
- Suppression expressed per resource family, declaratively, in the same shape the reader of
  `generate-diffs.ts` already recognises.

**Non-Goals:**

- Unifying the two diff builders. The analytics branch stays a branch; this change does not attempt
  to fold `buildAnalyticsDiff` back into the shared key walk.
- Making the suppressed facts reachable some other way — no second request, no side panel for
  `permissions`, no "show internal fields" toggle.

## Decisions

### D1 — The hidden-key sets live in `analytics-diffs.ts`, keyed by resource type

A `Partial<Record<ActivityAuditResourceType, Set<string>>>` beside `ANALYTICS_COLUMN_PARAMETERS`,
with the three entries the spec's table states, and a lookup that answers an empty set for an
unlisted type.

**Why not extend `generate-diffs.ts`'s existing sets.** They are consulted inside the shared key
walk, which the analytics branch returns before reaching (fact 1). Putting analytics entries there
would leave them dead and imply the branch honours them.

**Why keyed by resource type rather than a single union set.** `id` is noise on a saved query and is
a resource's own name on nothing else in the family; `created_at` does not exist on a table at all. A
union set would suppress a key on a resource type that never carries it — harmless today, wrong the
moment the service adds it.

**`TableColumn` resolves to the `Table` set.** A column activity's snapshot *is* the table's
definition — the spec's own *Table column snapshot resolves through its table* — so the set is chosen
from the snapshot's family, not from the activity's resource type. One predicate over the two table
types, not two identical entries.

### D2 — Suppression matches the parameter's first path segment

A leaf parameter is suppressed when its first `.`-separated segment is in the set. `permissions`
hides `permissions.write` and `permissions.modify`; `state` hides every `state.*` leaf; a scalar like
`created_at` has one segment and matches itself.

**Why not exact-match the full path.** The service owns the shape of `state` — `PipelineDto.StateDto`
carries well over a dozen members today. Listing each leaf would make this change a maintenance debt
that silently stops working the next time the service adds one.

**Why not suppress at the projector.** `getSnapshotLeaves` answers what a snapshot *contains*, and
it answers it twice per comparison — once per side — and again through `snapshotRows` when the rows
are built. Teaching it to drop keys would put a diff decision inside a shape question and spread it
over three call sites. Filtering is applied once, where the union parameter list for the `properties`
bucket is assembled (`analytics-diffs.ts:208-210`).

### D3 — `restoreEmptyValueRows` is deleted, not narrowed

The function and its call disappear; the `properties` bucket is built by `compareNestedFlatObject` /
`fillNestedFlatObject` alone, exactly as every other bucket already is.

**Why not keep it for the column bucket instead** (the shape issue #4486 reports): that inverts the
convention — it would extend the exception rather than end it, and the owner's decision in this
session is that analytics follows the shared rule. #4486 therefore closes as correct-by-convention.

**Why the restored rows were not load-bearing.** Two classes of row disappear. A column attribute
empty on both sides (`enum_values: []` on a non-enum column) states nothing a reader did not already
know from `type`. A pipeline's `state.*` leaves are `@NotAudited` on the service side, so a revision
read never restores them: the rows were empty for *every* pipeline revision and could never have
shown a change.

### D4 — The empty-state path is untouched and must stay untouched

`activity-audit-diff-empty-state` fires when **both** snapshot reads come back absent, and it keys on
the rendered `sections` map. Dropping empty rows makes an all-empty bucket more likely, not less, so
the guard has to keep reading rendered sections rather than raw bucket keys. This change adds no
branch there; the regression risk is covered by a test rather than by a code change.

## Risks / Trade-offs

- **An access-list change becomes an activity whose diff shows nothing.** `access` (the table's
  `write` / `modify` role lists) *is* audited — the field on `TableDefinitionEntity` carries no
  `@NotAudited` — but `TableDto` does not return it, so today the only trace of such a change in the
  diff is the `permissions` derivative this change hides. → The derivative was already unusable as
  that trace: it is computed from the reader's roles, and a full admin sees `true/true` at every
  revision. The real fix belongs to the service: serve `access` on
  `GET /v1/tables/{name}/revision/{revision}`. Recorded here; no ticket filed (see Open Questions).
- **A reader who learned the current behaviour sees fewer rows in `All parameters`.** → The rows that
  disappear carry no value on either side; every field that holds a value in either snapshot is still
  listed, which is what the requirement now says.
- **A future analytics resource type carries a genuinely auditable field named like a suppressed
  one.** → The sets are per resource type and the spec states each entry's reason, so the collision
  is visible at review time rather than silent.

## Migration Plan

Spec delta, code and tests land together; there is no stored state, no i18n key and no API contract
involved, so rollback is a revert of the one commit. Nothing to backfill: the diff is computed per
request from two snapshot reads.

## Open Questions

- Should ADAS be asked to serve `access` on the table revision endpoint, so an access-list change has
  a visible diff? Answering it later changes neither this change's specs nor its tasks — the frontend
  would read a field it is already shaped to render.
