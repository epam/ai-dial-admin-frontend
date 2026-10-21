## Why

QA feedback on #3847: in the table Audit tab, typing into the Activity type, Resource type or Activity ID
filters shows "No Matching Rows". Every audit column offers the same text
filter, whose default operator is *contains*. The analytics backend takes `contains` only on string columns;
Activity type and Resource type are enums there and Activity ID and Parent ID are UUIDs, so it rejects the
request. The frontend swallows the failed request by design, which is why the grid just reads as empty.

## What Changes

- **Exact-match filters on the Analytics view.** Activity type, Resource type, Activity ID and Parent ID offer
  only *Equals* and *Does not equal*, and Equals is the default, so the value typed into the floating filter is
  sent as an operator the backend accepts. The text columns (Resource identifier) keep their text operators.
- **Resource type resolves its label under those operators.** A typed label that names exactly one resource
  type (`table`, `table column`) is sent as that type; the existing *contains* narrowing is unchanged.
- **Config and Deployments views are unchanged**, apart from Resource type now resolving a label typed under
  *Equals* or *Does not equal*.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-audit-analytics-view`: a new requirement for the exact-match filters of the Analytics list.

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/filters.ts` and `grid-columns.tsx` (the shared audit column
  set, switched on the existing `view` parameter) and `components/ActivityAudit/List/utils.tsx`.
- The grid is shared with the Config and Deployments views and the global Analytics list.

## Non-goals

- The Initiated filter. The grid filters on `initiatedEmail`, which the backend does not accept as a filter
  column; the backend is being asked to allow it, and no frontend change is made meanwhile.
- A pick-list (set) filter for the enum columns; the grid library's set filter is not available here.
- Showing an error when a filter request fails (the swallowing is by design).
