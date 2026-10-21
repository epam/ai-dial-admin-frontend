## Why

An Analytics catalog import writes one audit activity per object it creates — and, when it rolls back, one per
object it deletes again — so in the Activity Audit's Analytics view a single import reads as a scatter of unrelated
`Create` and `Delete` rows. The admin import already appears as one expandable `Import` row with its changes beneath
it. The Analytics data-access service now tags every activity an import wrote with that import's `importId`
(`AuditActivityDto.importId`, filterable in the feed) but writes no parent activity, so the grouping has to be built
on the client.

## What Changes

- The Analytics view of the Activity Audit list groups activities that share an `importId` under one **Import** row,
  shaped like the admin import row: activity type `Import`, the importing user and time, expanded, with the import's
  activities listed beneath it and marked as its children.
- The group is complete regardless of page boundaries: when the list meets an import it has not grouped yet, it loads
  every activity of that import with the feed's `importId` filter (together with the reader's own filters), and
  activities of that import met on later pages are not listed again.
- The Import row is not navigable and offers no row actions — as the admin Import row — and its children keep their
  own behavior (opening the detail page).
- A table's column activities stay attached to their table inside the group, as they are today.
- The single-entity audit tabs (a table's or a pipeline's Audit tab) keep listing rows flat, with no grouping.
- `DialActivity` gains the optional `importId` field.

## Non-goals

- Grouping in the Config or Deployments views — the admin backend writes its own Import parent.
- A server-side Import parent activity — the service chose to tag activities instead.
- An "import id" column or filter of its own; the group row is the affordance.
- Showing an import's outcome (completed / rolled back) on the group row — the feed does not carry it.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `activity-audit-analytics-view`: adds requirements for grouping an import's activities under one Import row, and
  modifies *Analytics view shows every resource type the feed returns* — the global page gains the row-expander
  column, and rows are flat apart from the import groups.

## Impact

- **Components / utils:** `components/ActivityAudit/List/List.tsx` (datasource), `List/view-config.ts` (the Analytics
  view's grouping stance), a pure grouping util under `src/utils/audit/`, `constants/grid-columns/grid-columns.tsx`
  (the expander column for the Analytics view), `ActivityAudit/List/utils.tsx` (row actions hidden on the group row).
- **Models:** `models/activity-audit.ts` (`importId`).
- **Backend:** Analytics data-access service `development` — `AuditActivityDto.importId` and the `importId` filter
  column of `POST /v1/activities`. No backend change needed.
- **Specs:** `openspec/specs/activity-audit-analytics-view/`.
- Independent of the import UI change (PR #4898); it reads activities any import wrote, from any client.
