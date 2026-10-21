## Why

The exact-match filters (#4950) stopped the Analytics audit list from sending a substring match the backend
rejects, but a filter the backend still refuses (an unknown activity type, a partial UUID) leaves a silently
empty grid, and the QA scenario `table` (find both Table and Table column rows) no longer works. Activity type
and Resource type are closed sets of values, so the reader can pick from them instead of typing, and no
invalid filter can be entered.

## What Changes

- **Activity type and Resource type become value lists** in the Analytics view: checkboxes for the values the
  analytics backend defines, requested with the `in` operator. This follows the existing value-list filters of
  the runs and sessions grids.
- **Activity ID and Parent ID stay exact-match**, and text that is not a UUID gives an empty list (or no
  restriction, under *Does not equal*) without a request.
- **A failed list request is reported.** The backend's error is shown as a notification, instead of the grid
  reading as empty.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-audit-analytics-view`: the exact-match requirement is replaced by requirements for the identifier
  columns, for the value lists, and for the Config/Deployments resource-type label resolution it also held; a
  new requirement for the failed-request notification.

## Impact

The Analytics view of the shared audit grid only; the Config and Deployments lists keep their filters and
behaviour.

## Non-goals

- The Initiated filter: the grid already filters on `initiatedEmail`, and it works once the backend change that
  accepts it is released.
- Reporting a failed *lookup* (the parent-resolution and import-group requests): those fail open by design.
- A pick-list for the identifier columns.
