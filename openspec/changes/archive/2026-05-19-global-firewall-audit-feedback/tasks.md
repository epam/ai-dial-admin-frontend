## 1. Suppress dead navigation icon for global firewall on audit detail header

- [x] 1.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/Header.tsx`, extend the existing exclusion chain that wraps the Resource identifier `LabelledText` row so that `activity.resourceType !== ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST` is added alongside the existing `SYSTEM_PROPERTIES` and `ADMIN_PROPERTIES` checks. The entire row (text + icon) is suppressed for global-firewall activities, matching the existing pattern.
- [x] 1.2 Add or update the unit test for `Header.tsx` (under `ActivityAudit/View/Header/tests/` if present, otherwise co-located following the project convention) covering: (a) Resource identifier row is NOT rendered when `resourceType` is `IMAGE_BUILD_DOMAIN_WHITELIST`, (b) Resource identifier row IS rendered with the icon for a container resource type with a non-Delete activity. Reuse existing mocks from `test-setup.tsx`; do not introduce data-testid attributes; assert on visible role/text or component presence.

## 2. Move audit-list preselect handoff from localStorage to sessionStorage

- [x] 2.1 In `apps/ai-dial-admin/src/utils/audit-list-preselect.ts`, change the three `localStorage` references to `sessionStorage` (`setItem` in `saveAuditListPreselect`, `getItem` in `readAuditListPreselect`, `removeItem` in `clearAuditListPreselect`). Do not rename `AUDIT_LIST_PRESELECT_STORAGE_KEY`, do not move files, and do not change the function signatures.
- [x] 2.2 In `apps/ai-dial-admin/src/components/Deployments/Modals/GlobalWhitelist.tsx`, add a single short comment immediately above the `window.open(ApplicationRoute.ActivityAudit, '_blank')` call noting that adding `'noopener'` (or moving to a `rel="noopener"` link) would sever sessionStorage inheritance and silently break the preselect handoff.
- [x] 2.3 Update the unit test for `audit-list-preselect` (if it exists under `apps/ai-dial-admin/src/utils/tests/` or co-located) to assert against `sessionStorage` instead of `localStorage`. If no such test exists, add one covering: save writes to `sessionStorage`, read returns the saved value, clear removes it. Reuse jsdom's built-in `sessionStorage` (no new mocks needed).
- [x] 2.4 Update any existing test that asserts on `localStorage` for the `audit-list-preselect` key — most likely under `ActivityAudit/List/tests/` and `Deployments/Modals/tests/` — to use `sessionStorage` accordingly. Reuse existing mocks from `test-setup.tsx`; do not add new mocks.

## 3. Code quality checks

- [x] 3.1 Run `npm run lint` from the repo root and fix any reported issues.
- [x] 3.2 Run `npm run format` and apply `npm run format:write` if any formatting drift is reported.
- [x] 3.3 Run `npm run test` from the repo root and ensure all tests pass.
