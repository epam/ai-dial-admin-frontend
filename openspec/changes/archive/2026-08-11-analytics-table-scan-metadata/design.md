## Context

The analytics data-access service exposes a source table's scan-metadata pair — `identity_column` and
`version_column` — on the table-management API. The contract below was read directly from that service's
`origin/development` (`ScanMetadataRules.java`, `DefineSchemaRequest.java`, `TableDto.java`,
`TableSchemaService.java`, and `openspec/specs/table-management/spec.md`).

| Surface | Behavior |
|---|---|
| `POST /v1/tables/{name}/schema` | both members optional for a `source`; either member is 422 for an `enrichment` |
| a declared member | must be a column of the same request, non-nullable, not `sensitive`; `version_column` must be `timestamp` |
| an omitted member | leaves any stored value **unchanged** — there is no way to clear one |
| once `ACTIVE` | `POST` answers 409, and no `PATCH` member sets the pair — the choice is permanent |
| `GET /v1/tables` and `/{name}` | both returned, each absent when not declared |
| `PATCH` `drop` of a pair column | 422 |
| `PATCH` `rename` of a pair column | allowed; repoints the stored pair in the same transaction |
| `PATCH` `update` with `sensitive: true` | 422; `sensitive: false` and every other attribute stay editable |

Two facts drive the design and are not obvious from the endpoint shapes:

1. **The scan needs both members.** `ScanSourceMetadata.cursorColumns()` refuses on
   `isBlank(version) || isBlank(identity)`. A source carrying only one is exactly as unscannable as one
   carrying neither.
2. **Nothing server-side prevents a half-declared pair.** `ScanMetadataRules.validateSource` validates each
   member independently, and the service's own spec says a source with "neither scan column — or only one of
   the two" materializes `ACTIVE`. Combined with fact (1) and the declare-once rule, a user who picks an
   identity and forgets the version ships a permanently unscannable table whose only repair is deleting and
   recreating it.

Current FE state: neither field exists anywhere in `src/models/analytics/`. The two insertion points are
the `isActive` source branch of `TableDetailView.tsx` (the read-only ordering-key/partition summary) and the
source branch of `DraftSchemaEditor.tsx`, both fed by `use-draft-schema-form.ts` and `utils.ts`.

## Goals / Non-Goals

**Goals:**

- Make a source table created through the Admin UI capable of being scannable, without an operator migration.
- Let an operator read an `ACTIVE` source's declared pair from the detail view.
- Make the permanently-broken half-declared state unreachable through the UI.
- Keep the PATCH flow from producing a request the backend will answer 422 to.

**Non-Goals:**

- `_updated_at` as a version column on an `upsert_by_key` source — requires modeling the table's `write`
  discipline first (and note the existing unrelated `permissions.write` name collision).
- The enrichment-grain-key immutability rule — not derivable from a single `GET /v1/tables/{name}`.
- Declaring the pair on an already-`ACTIVE` source — no API exists.
- Any "not scannable" message: an absent value is simply omitted, as `ordering_key`/`partition_by` are today.
- The table-level `ttl` object and `ColumnDto.heavy`, both also unmodeled on the FE.

## Decisions

### The pair is all-or-nothing in the draft form, stricter than the backend

Save is disabled while exactly one select is set, and the empty one carries a validation message. The two
useful states are both and neither; one alone is only ever a mistake, and it cannot be corrected after
materialization.

*Alternative considered:* mirror the backend exactly (two independent optional selects). Rejected — it
leaves a dead-end reachable through the only surface that can prevent it. *Also considered:* allow the
submit but warn. Rejected — a warning the user can click past buys nothing over a gate they can satisfy in
one click, and the pair is create-only anyway, matching the ordering-key/partition/granularity treatment the
form already gives its other permanent choices.

Shape, in `use-draft-schema-form.ts` alongside the existing `canMaterialize` computation:

```
pairRequired = Boolean(table.identity_column || table.version_column)   // stored, and uncleanable
pairComplete = (identity && version) || (!identity && !version && !pairRequired)
canMaterialize = …existing source checks… && pairComplete
```

### `version_column` gets its own option helper, not `getTemporalColumnNames`

`getTemporalColumnNames` accepts `Date` and `Timestamp` (correct for the partition column); the backend
requires `timestamp` for a version column and 422s a `date`. Two new pure helpers in `utils.ts` instead:
`getIdentityColumnNames(rows)` (trimmed `source_name` of rows that are `!nullable && !sensitive`) and
`getVersionColumnNames(rows)` (that set narrowed to `AnalyticsFieldType.Timestamp`). Both mirror
`getTemporalColumnNames`' existing signature and de-duplication so the three read alike.

### Pair membership is matched on `source_name`, never on the exposed `name`

The backend resolves `requireDroppable` and `requireNotSensitive` by physical source name, and the stored
pair holds source names. An exposed name diverges from its source name the moment a column is renamed, so a
guard keyed on `name` would silently stop guarding the renamed column. One helper,
`isScanMetadataColumn(table, column)`, is the single place this comparison lives — used by both the drop
predicate and the popup's Sensitive prop.

### Renaming stays allowed; `isRenameRestricted` is deliberately untouched

Unlike grain-key and ordering-key columns, a rename of a pair column is explicitly permitted and the backend
repoints the stored pair in the same transaction. Nothing extra is needed to reflect it: `applyPatch` in
`TableDetailView.tsx` already awaits `reload()` on every successful patch, so the summary re-renders with
the repointed name.

### The drop action is hidden, not disabled

`ActionMenuOperationDeclaration` exposes a `hidden` predicate and no disabled one; the pinned grain-key row
already uses it via `isPinnedRow`. The drop predicate becomes `isPinnedRow(...) || isScanMetadataColumn(...)`,
which keeps the one mechanism the grid already has rather than introducing a second.

### The Sensitive switch is plainly disabled

Only the `true` direction is refused (`TableSchemaService` checks `Boolean.TRUE` before calling
`requireNotSensitive`), but a pair column is guaranteed `sensitive: false` — the define-time check rejects a
sensitive one and the patch guard stops it ever becoming one. So "disable the switch" and "block only the
true direction" are the same behavior here, and the former needs no new state. `EditColumnPopup` takes one
new optional `sensitiveDisabled?: boolean` prop, passed to `DialSwitch`'s `disabled` with a `caption` naming
the reason; `buildColumnEditPatch` is unchanged.

### A `FAILED` table's stored pair is seeded and treated as required

`createDraftSchemaForm` already seeds ordering key, partition, and grain from the table; the pair joins them.
It has to: an omitted member leaves the stored value alone, so a form that showed the pair as empty while the
definition still stored it would both mislead the user and let a re-post keep a value pointing at a column
the re-post no longer declares. `pairRequired` above is what closes that — once a value is stored, neither
select may be left empty before Save enables, and the validation message says so rather than repeating the
"or both empty" escape route that does not apply there.

Both halves of the gate test **emptiness**, not option membership, while `buildDto` guards each member with
membership. The asymmetry is deliberate: a seeded value that is not a currently-qualifying option can only be
a system column (`_ingested_at`), which a user-created source cannot have declared in the first place — the
backend rejects a scan member naming an undeclared column. Gating Save on membership would therefore add a
dead-end state (Save disabled with no selectable value that satisfies it) guarding against something
unreachable from this form, while the membership check in `buildDto` is what actually stops a stale name from
being sent.

### Selections invalidate through the existing `update()` guard

`use-draft-schema-form.ts` already clears a stale `partitionColumn` (and its granularity) inside `update()`
when `key === 'columns'`. The two new selections clear the same way, against their own option helpers, so a
column renamed, removed, retyped, or flipped to nullable/sensitive can never leave a stale name in
`buildDto()`. No new effect, no new state.

### Helper text reuses the Partition column label pattern

The existing `PartitionColumn` label composes a `DialTooltip` + `IconInfoCircle` beside the label text. Both
new labels follow it, carrying the two things the form cannot enforce: that the values are the caller's own
promise (version assigned at ingest, monotonic, never backdated; identity unique per row) and that the choice
is permanent once the table materializes.

## Risks / Trade-offs

- **The Save gate is stricter than the API, so a scripted or migration-made table can still be
  half-declared** → the detail view renders whichever member exists and omits the other, so such a table
  displays truthfully; no FE code assumes both are present.
- **A `_`-prefixed pair value (`_ingested_at` on the seeded sources) matches no row in the columns grid** →
  expected, per the service's own DTO documentation. The summary renders the value; `isScanMetadataColumn`
  simply never matches a grid row, so the guards are inert rather than wrong.
- **The helper text carries an unenforceable promise, and a user can still declare a non-unique identity** →
  physically unverifiable at any layer; the tooltip states it, which is the same standing the operator
  migration had before this change.
- **Requiring the pair on a `FAILED` table whose stored column was since removed forces the user to pick a
  new one** → correct, not a regression: the alternative is a stored pair pointing at a column that no
  longer exists, which no request could repair.
- **Three new i18n keys plus two labels in `AnalyticsTablesI18nKey`** → additive, placed beside the existing
  `OrderingKey`/`PartitionColumn` keys.
