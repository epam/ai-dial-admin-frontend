## 1. Value lists

- [x] 1.1 Add `EnumValuesFilter` and its `components` map under `components/ActivityAudit/List/`, register the map on the grid in `List.tsx`, and add the analytics activity and resource type values
- [x] 1.2 In `grid-columns.tsx`, give Activity type and Resource type the value list in the Analytics view only, and keep `exactMatchFilter` on Activity ID and Parent ID

## 2. Identifier guard

- [x] 2.1 Add `applyAnalyticsIdentifierFilters` under `utils/audit/` and use it in `List.tsx` for the Analytics view, resolving an empty page without a request

## 3. Failed requests

- [x] 3.1 In `server/analytics/audit-api.ts` and `app/[lang]/activity-audit/actions.ts`, return the list call as a result carrying the error; in `view-config.ts`, make the Analytics `fetchActivities` throw an `AuditRequestError` for a failed result
- [x] 3.2 In `List.tsx`, show the thrown error as a notification for the Analytics view and fail the page; the lookup requests keep swallowing theirs

## 4. Tests

- [x] 4.1 `EnumValuesFilter` spec: the listed values, picking, Select all, Reset and the grid refresh
- [x] 4.2 `grid-columns` spec: the filters per column and view
- [x] 4.3 `applyAnalyticsIdentifierFilters`, `List`, `view-config`, server action and API specs: the UUID guard, the `in` request, the error notification and the swallowed lookup

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change's scenarios against the local app at http://localhost:4200 and resolve any `fail` verdicts

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected tests; fix everything they report
