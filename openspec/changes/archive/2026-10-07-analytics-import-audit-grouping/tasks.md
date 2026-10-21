No browser verification task: the user declined it for this change; scenarios are covered by unit tests.

Implement on a fresh branch from `development`; independent of PR #4898.

## 1. Model and view config

- [x] 1.1 Add optional `importId?: string` to `DialActivity` in `src/models/activity-audit.ts`
- [x] 1.2 Add `hasImportGrouping` to the view config model in `components/ActivityAudit/List/models.ts` and set it in `List/view-config.ts` (Analytics: true; Config, Deployments: false) (design D1)

## 2. Grouping util

- [x] 2.1 Create `src/utils/audit/import-grouping.ts` with `getUngroupedImportIds`, `buildImportGroupRow` (namespaced `import:<id>` id, `Import` type, author/email/latest time and revision, `children`, `expanded`, `canToggleExpand: false`, children's `parentActivityId` set only when absent) and `groupImportActivities` (first row of an import replaced by its group, later rows of an emitted import dropped, rows without `importId` unchanged, fallback to the page's own rows) (design D2, D3)

## 3. Datasource and columns

- [x] 3.1 In `components/ActivityAudit/List/List.tsx`, for `hasImportGrouping && !entity`, fetch new imports' activities with an `importId` `in` filter plus the reader's filters, all pages, fail-open; keep the per-pass import cache and emitted set reset at `startRow === 0`; push the grouped rows (design D2)
- [x] 3.2 Render the expander column in `ACTIVITY_AUDIT_COLUMNS` (`constants/grid-columns/grid-columns.tsx`) for the Analytics view as well as Config, not in single-entity mode
- [x] 3.3 Hide "open in new tab" for `ActivityAuditType.Import` rows in `getAnalyticsActivityAuditColumns` (`List/utils.tsx`) (design D4)

## 4. Tests

- [x] 4.1 `src/utils/audit/tests/import-grouping.spec.ts`: group shape, child marking (with and without an existing parent), placement at first-met row, later rows of an emitted import dropped, rows without `importId` untouched, fallback when no fetched activities
- [x] 4.2 `List` spec for the Analytics view: an import on the page is requested by `importId` with the reader's filters, its group is listed once across two pages, a failed group request still renders, an entity tab stays flat; Config and Deployments unaffected
- [x] 4.3 Columns spec: expander column present for Analytics, absent in single-entity mode; Import row has no "open in new tab"

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass
