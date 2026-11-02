## Why

On the draft schema surface a partition column can be chosen with the granularity left empty or set to "None", and
the request builder then leaves the partition out without a word: the table is created unpartitioned although the
author picked a column. A partition has no meaning without its granularity.

## What Changes

- **Granularity is required once a partition column is chosen.** The field is marked required, offers only day,
  month and year (the "None" choice goes), shows a message while empty, and Save stays disabled until it is set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: "Define and materialize a table schema" (the Granularity field and the Save gate).

## Non-goals

- Preselecting a granularity: the hint names month as the usual choice, but the author makes it.
- The JSON editor, whose own completeness rules are unchanged.
