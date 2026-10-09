## 1. Filters

- [x] 1.1 In `apps/ai-dial-admin/src/constants/grid-columns/filters.ts`, add `exactMatchFilter`: equals and not-equal only, equals as `defaultOption`
- [x] 1.2 In `grid-columns.tsx`, make `ACTIVITY_AUDIT_COLUMNS` spread `exactMatchFilter` instead of `baseStringFilter` on Activity type, Resource type, Activity ID and Parent ID when the view is Analytics
- [x] 1.3 In `components/ActivityAudit/List/utils.tsx`, make `expandResourceTypeFilter` resolve an exact label under equals and not-equal, leaving the contains branch unchanged

## 2. Tests

- [x] 2.1 `grid-columns` spec: the four columns offer only the exact-match operators with equals by default in the Analytics view, and keep the base operators in Config and Deployments
- [x] 2.2 `ActivityAudit/List` utils spec: exact label resolution for equals and not-equal, a shared label and an unknown value passing through, and the contains branch unchanged

## 3. Browser verification

- [x] 3.1 Run the `spec-browser-verify` skill for this change's scenarios against the local app at http://localhost:4200 and resolve any `fail` verdicts

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the affected tests; fix everything they report
