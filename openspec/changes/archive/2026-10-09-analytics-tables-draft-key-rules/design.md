## Context

The draft form keeps key selections as *names* (`orderingKey`, `partitionColumn`, `identityColumn`,
`versionColumn`, `grainKey`), and the grid's single Name input writes both `source_name` and `name`. Before
this change `update('columns')` cleared the Partition, Identity and Version selections whenever their name
dropped out of an eligible list, which a rename looked like; the Ordering key was only filtered when read, so
its stored tag outlived a rename and the select could not deselect it. See proposal.md for the backend rules.

## Goals / Non-Goals

**Goals:**
- One place that decides which columns can key a table, used by every option list and by the reconciliation.
- One reconciliation step that handles retype, removal, nullable/sensitive flips *and* renames for all four
  source-table selections, so none can drift from the others.

**Non-Goals:**
- Changing what the form stores (names stay names; no move to row ids).
- Touching the JSON editor or the active-table view.

## Decisions

### D1. Eligibility lives next to the existing derivers in `utils.ts`

`getIdentityColumnNames` and `getVersionColumnNames` already live there. Add `getOrderingKeyColumnNames`
(non-nullable, not `Object`) and `getPartitionColumnNames` (temporal and non-nullable), both built on one
`collectColumnNames` helper with a per-field predicate. The Grain key list is built from the source table's
`AnalyticsTableColumn`s, not rows, so `getGrainKeyColumnNames` filters those on `type !== Object`.

*Alternative:* inline filters in `DraftSchemaEditor`. Rejected: the reconciliation needs the same lists, and two
copies of a backend rule is how the Ordering key got missed the first time.

### D2. A pure `reconcileKeySelections(prevRows, nextRows, selections)` replaces the inline checks

It returns the four selections (plus granularity) for the new rows, in two passes:

1. **Rename pass.** Pair rows by `ColumnRow.id`; where the trimmed `source_name` changed, rewrite the old name in
   every selection. A rename is not followed when another row still carries the old name or already carries the
   new one.
2. **Prune pass.** Drop any selection no longer in its field's eligible list, the existing behaviour now
   including the Ordering key. A blank new name is not eligible, so it is dropped here. Dropping the Partition
   column also clears its granularity.

Pure and callable on any pair of row sets, so it is unit-tested directly and `update('columns')` shrinks to
one call. This is the same shape as `buildDraftSchemaDto`: a pure function the hook merely applies.

*Alternative considered: clear all four on rename* (what #4146 literally asked for). Rejected: a typo fix in a
selected column's name silently wipes a deliberately chosen key. QA's complaint was the *inconsistency*, and
carrying the name removes it without the data loss. Recorded against #4146 in proposal.md.

### D3. Identity/Version exclusion is derived, not stored

`identityOptions = identityNames \ {versionColumn}` and `versionOptions = versionNames \ {identityColumn}`,
computed in the hook beside the existing names. Nothing else changes: the pair-completeness rule reads the form
values, and a column can never be selected in both because the other select does not offer it. No prune is
needed for this rule; there is no event after which both can hold the same name.

### D4. The stored Ordering key is also filtered by eligibility at read time

`validOrdering` and `buildDraftSchemaDto` currently filter by "is a declared name". They filter by "is an
eligible ordering-key column" instead. This keeps a form seeded from a stored definition (or edited through a
path that bypasses `update`) from submitting a key the backend rejects. A `FAILED` table cannot actually store
an ineligible key, since the backend validates before persisting, so this is a guard, not a migration.

### D5. Hints state the eligibility

The three key hints in `en.ts` gain one short clause each (spec: "Key hints state which columns are
eligible"). No new keys; the existing hint strings change.

## Risks / Trade-offs

- **Clearing a name to retype it drops the selection.** Select-all and retype of a selected column's name
  passes through a blank name, which drops the key. → Accepted and specified: a blank name cannot key a
  table, and the alternative (remembering a dropped key) is state with no visible owner.
- **Two rows sharing a name mid-edit.** Selections are by name, so while two rows are momentarily named the
  same they are indistinguishable. → Existing behaviour (`collectColumnNames` already de-duplicates), and
  the duplicate-name row error already blocks Save.
- **Mutual exclusion hides a column.** A timestamp chosen as Identity cannot also be Version, so a table that
  wanted one timestamp for both roles is no longer expressible. → Intended: it is the configuration the
  backend semantics make unsafe (see the QA report on the shared tiebreaker).
