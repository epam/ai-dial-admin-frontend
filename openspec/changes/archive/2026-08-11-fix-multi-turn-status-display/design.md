## Context

`getValidityStatusColumn` (`src/components/TestSuites/utils/columns.tsx:131`) is a single shared column factory used by four grids:

| Consumer | Rows grouped? |
| --- | --- |
| `getTestCaseColumns` — TestSuites test cases (`:127`) | yes |
| `getDatasetTestCaseColumns` — Datasets test cases (`Datasets/utils/columns.tsx:40`) | yes |
| `PickPublicDataset` attach-dataset preview (via `getDatasetTestCaseColumns`) | yes |
| CSV import preview (`TestCases/Import/utils.tsx:15`) | no — plain rows, no `rowType` |

It renders `ValidityStatus` with `params.data.validationWarnings.map(w => w.message).join(', \n')`. It has no knowledge of row types today, so it fires identically on `GROUP`, `TURN`, and `SINGLE` rows.

The grouped surfaces all reach the grid through `useTurnGroupProjection` → `projectGroupsToGridRows`, so a rule expressed in terms of `GroupedGridRow` covers all three at once.

## Goals / Non-Goals

**Goals**

- One validity signal per logical test case, wherever a row representing that case exists.
- Each distinct warning stated once in the master row's tooltip.
- Zero change for single-turn cases and for non-grouped consumers of the shared column.

**Non-Goals**

- Attributing warnings to individual turns (see the proposal's Non-goals — the backend does not supply this).
- Reshaping the row data. This is display-layer only.

## Decisions

### Blank the turn row, don't strip the data

The guard lives in the cell renderer, not in `expandTestCasesToRows`. Turn rows keep `valid`/`validationWarnings` because `aggregateValidity` derives the `GROUP` row from exactly those fields — removing them from turn rows would leave the master row with nothing to aggregate. Keeping the change at the render boundary also means nothing downstream (save/collapse, dirty tracking, include-in-run filtering, export) sees a different row shape.

*Rejected:* moving `valid`/`validationWarnings` out of the `...rest` spread and onto the group row directly. It removes the duplication at the source, but it changes `TestCaseRow`'s shape mid-pipeline and would force `aggregateValidity` to take the original `TestCase` rather than its rows — a wider blast radius than the problem justifies.

### Guard on `isFlattened`, not on `rowType` alone

`GroupedGridRow.isFlattened` (`models/evaluation/test-case-grouping.ts:24`) is already set by `toTurnRow` and is `true` exactly when an active column filter has flattened groups and no `GROUP` row was emitted. Blanking `TURN` rows unconditionally would, in that mode, leave an invalid case showing no validity at all — strictly worse than today's duplication. So the rule is: blank a `TURN` row only when a master row exists to carry the signal.

### Keep the blacklist, don't whitelist

The guard blanks `TURN` and lets everything else render, matching the rule the shared column factory already follows (task 4.4 of `add-multi-turn-test-cases`: *"select renderers by blacklisting GROUP and TURN rather than whitelisting SINGLE, so an unprojected caller with no `rowType` stays editable"*). This is what keeps the import preview grid working without a special case.

### Deduplicate by warning identity, not by message

`aggregateValidity` dedupes on `code | path | fieldName | message` rather than on `message` alone. Two warnings with the same text but different `path` are genuinely distinct — only `message` is rendered today, but collapsing them on text would discard information the model carries and would quietly change behaviour if `path` is ever surfaced.

`valid` is unchanged: a group is valid only when every turn is.

## Risks

- **If the backend later emits per-turn warnings**, turn rows will need their status back, and `path`/`fieldName` become the routing mechanism. The guard is one condition in one renderer, so reverting it is cheap — but the requirement should be revisited rather than silently kept.
- **A `TURN` row with a genuinely different `valid` than its siblings would be invisible.** Not reachable today: every turn row is spread from the same case-level fields, so they are identical by construction. The dedupe test pins that assumption by asserting distinct warnings are preserved.
