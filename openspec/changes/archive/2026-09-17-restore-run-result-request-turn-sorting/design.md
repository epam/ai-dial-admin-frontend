## Context

The Extraction Result grid supplies `EllipsisHeader` as a full AG Grid `headerComponent` for the
Run, Request, and Turn index columns. A full custom header replaces AG Grid's standard header
controller, including its sorting interaction and sort indicator. The text filter on Test Case name
is client-side grid state and already composes with AG Grid sorting once the header interaction is
available. See `proposal.md` for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**

- Preserve truncated-header tooltip behavior while retaining AG Grid's native sorting UI and keyboard behavior.
- Keep sorting numeric by using the existing numeric, 1-based index `valueGetter` results.
- Avoid custom filter/sort coordination so sorting naturally operates on AG Grid's filtered row set.

**Non-Goals:**

- Implementing a custom comparator or changing null ordering.
- Persisting filter or sort state beyond the grid's existing lifecycle.

## Decisions

### Use the ellipsis renderer as an inner header component

Configure `EllipsisHeader` through `innerHeaderComponent` instead of replacing the complete header.
AG Grid's standard header remains responsible for pointer and keyboard sorting and for the active
sort indicator, while the inner component retains the existing truncated label and tooltip.

The alternative was to teach `EllipsisHeader` to call `progressSort`, subscribe to sort events, and
render accessible sort state itself. That duplicates grid behavior and creates more surface for
accessibility and upgrade regressions.

### Declare index columns sortable explicitly

Set `sortable: true` on the shared index-column builder so Run, Request, and Turn consistently state
their intended behavior instead of depending on library defaults. Their `valueGetter` returns numbers,
so AG Grid's built-in comparator provides numeric ordering for both unfiltered and filtered rows.

## Risks / Trade-offs

- [The inner renderer could receive different layout constraints than the former full header] → Keep
  its existing min/max width classes and cover the live appearance and interaction in browser verification.
- [Changing the shared builder also restores Run sorting] → This matches the existing capability's
  requirement that sorting not be disabled and restores behavior lost through the same header regression.

## Migration Plan

Ship as a client-only grid configuration change with no data migration. Rollback consists of reverting
the column-definition change.
