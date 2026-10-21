## Context

See proposal.md — Why. The audit list (`components/ActivityAudit/List/List.tsx`) is an AG Grid infinite model whose
datasource pages `fetchActivities` into a row buffer. Per view, `ACTIVITY_AUDIT_VIEW_CONFIG` declares
`hasParentChildAggregation` (Config: true — it fetches `parentActivityId` children of each parentless row and
interleaves them with `processActivitiesData`) and `hasDeletedParentSuppression` (Analytics: true — it drops the
column children of a deleted table). The Analytics view has `hasParentChildAggregation: false`, because its only
`parentActivityId` link is column → table, and listing columns flat is intended.

The admin backend writes a real `Import` parent, so the Config view groups through `parentActivityId`. The analytics
backend tags each imported activity with `importId` and writes no parent (`AuditImportScope`, which stays open across
the import's compensation too, so a rollback's deletes carry the same `importId`); `POST /v1/activities` accepts an
`importId` filter column (`FilterableColumn.uuid`).

Row rendering already supports a parent with children: `RowExpanderCellRenderer` draws the chevron for a row with
`children`, `ChildrenActivityTypeCellRenderer` draws the child marker for a row with `parentActivityId`, the row is not
clickable when it has `children`, and `ActivityAuditType.Import` rows skip navigation and row actions.

## Goals / Non-Goals

**Goals:**

- One Import row per import in the Analytics view, complete across page boundaries, reusing the Config view's row
  shape and renderers.

**Non-Goals:**

- Changing the Config view's aggregation, or turning on `hasParentChildAggregation` for Analytics (it would also
  aggregate columns under tables, which the view deliberately lists flat).

## Decisions

### D1. A separate import-grouping pass, declared per view

`ACTIVITY_AUDIT_VIEW_CONFIG` gains `hasImportGrouping` (Analytics: true; Config, Deployments: false). In the
datasource, after deleted-parent suppression and only when `hasImportGrouping && !entity`, the page's rows go through
an import-grouping pass instead of being pushed as they are. The pass is a pure util
(`utils/audit/import-grouping.ts`) plus one fetch in the datasource; it does not touch the `parentActivityId`
aggregation path.

*Alternative:* enable `hasParentChildAggregation` for Analytics and synthesize parents for it. Rejected: that path
keys children on `parentActivityId`, which in Analytics means column → table, so the two groupings would collide.

### D2. The group is fetched whole, once, by `importId`

The datasource keeps, per list pass (reset at `startRow === 0` with the other caches), a map
`importId → activities` and a set of import ids already emitted. For a page:

1. `getUngroupedImportIds(rows, emitted)` returns the import ids on the page not yet emitted.
2. For those, one request per page with `{ column: 'importId', operator: 'in', value: ids.join(',') }` plus the
   reader's filters, reading every `totalPages` page — the same loop the Config children fetch uses. The fetcher answers a failed HTTP request with no
   page instead of throwing, so a missing page fails the request as a rejection does. A failed import is kept in a
   per-pass `failed` set: it is listed flat on this and every later page and not requested again (fail-open — a
   group built from a partial answer would hide rows).
3. `groupImportActivities(rows, importActivities, emitted)` walks the page in order: a row without `importId`, or of an
   import with no fetched activities, passes through; the first row of an import not yet emitted is replaced by the Import row followed by all of that import's
   activities; any later row of an emitted import is dropped.

Rows are counted after the pass, so the buffer, page boundaries and end-of-list signal count only listed rows — the
same contract the existing suppression and table-scope narrowing keep.

### D3. The Import row and its children

`buildImportGroupRow(importId, activities)`:

- `activityId: 'import:<importId>'` — namespaced so it cannot collide with a UUID activity id;
- `activityType: ActivityAuditType.Import`; `resourceType` and `resourceId` empty (the admin parent's resource is
  `Config`, which has no Analytics meaning);
- `initiatedAuthor` / `initiatedEmail` from the import's activities (one importing user per import);
  `epochTimestampMs` the latest of them; `revision` the latest;
- `children` (the activities), `expanded: true`, `canToggleExpand: false` — exactly the shape
  `processActivitiesData` gives an admin parent.

Each child is a copy with `parentActivityId` set to the Import row's id **only when it has none** — so the child
marker renders, and a column keeps pointing at its table. `importId` stays on the copy. The `Parent ID` cell of such
a child therefore shows `import:<importId>` — which names the import the row belongs to, rather than a backend
activity id; the spec records it.

### D4. Columns and actions

`ACTIVITY_AUDIT_COLUMNS` takes the row-expander as an explicit `hasRowExpander` argument (defaulting to the Config
rule); the Analytics column factory passes it from a new `isGlobalList` column parameter, because a table's Audit
tab is not single-entity yet builds no Import rows. The Analytics row actions (`getAnalyticsActivityAuditColumns`) hide "open in new tab" for an Import row, as the
Config columns do; `onCellClicked` already ignores `ActivityAuditType.Import`.

## Risks / Trade-offs

- [An import with many activities costs extra requests] → one `in` request per page covers every new import on it,
  paged like the Config children fetch; imports are small catalog changes, not data loads.
- [The group sits at its first-met activity, not by the import's own time] → with the default newest-first sort that
  is the import's latest activity, which is also the group row's time.
- [The feed's `importId` contract] → a pure util with unit tests; if the field disappears, rows are listed flat as
  before, never hidden.
