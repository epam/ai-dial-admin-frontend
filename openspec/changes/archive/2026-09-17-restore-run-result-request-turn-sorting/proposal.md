## Why

The Extraction Result grid no longer allows users to sort request and turn positions, making chained
and multi-turn results difficult to inspect. The regression is especially disruptive after filtering
by test-case name, where users need to order the remaining rows by their request or turn sequence.

## What Changes

- Restore numeric sorting on the Extraction Result grid's Request and Turn columns.
- Keep Request and Turn sorting available while the Test Case name filter is active.
- Add regression coverage for the sortable column definitions and filtered-grid behavior.

## Non-goals

- Changing the grid's default sort order or automatically applying a sort after filtering.
- Enabling filters on Request or Turn.
- Changing comparison or heat-map result grids.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `run-results-turn-columns`: Specify Request and Turn sorting, including composition with the
  existing Test Case name filter.

## Impact

- `apps/ai-dial-admin/src/components/Runs/View/ExtractionResult.tsx` and/or its column definitions in
  `utils.ts` — restore sortable grid configuration.
- Co-located Runs View unit/component tests — cover numeric Request/Turn sorting and filtering.
- No backend API, data-model, dependency, or persistence changes.
