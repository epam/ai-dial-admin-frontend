## 1. Start-mode gate

- [x] 1.1 In `apps/ai-dial-admin/src/utils/org-units/namespaces.ts`, export the namespaces `ROUTE_NAMESPACES` maps to (deduplicated) so the gate reuses the menu's own list.
- [x] 1.2 In `apps/ai-dial-admin/src/utils/auth/user-access.ts`, make `resolveUserAccess` return unit mode only when `canReadNamespace(units, ns)` holds for some exported namespace; otherwise return `{ ...DENIED_ACCESS, adminAccess }`.

## 2. Unit tests

- [x] 2.1 In `apps/ai-dial-admin/src/utils/auth/tests/user-access.spec.ts`, add cases: member-only (`org-units: [read]`) is denied with `units: []`; a unit granting only `publications: [read]` is unit mode; member above a unit granting `applications: [read]` is unit mode and keeps both units; a unit whose permissions are empty or use an unknown namespace key is denied; existing cases still pass.
- [x] 2.2 In `apps/ai-dial-admin/src/utils/org-units/tests/namespaces.spec.ts`, cover the new export (contains every routable namespace, no duplicates, excludes `org-units`).

## 3. Spec

- [ ] 3.1 Update `openspec/specs/user-org-units-access/spec.md` with the "Start mode follows the access read" delta (done on archive via sync).

## 4. Quality checks

- [x] 4.1 Run lint, format check, `npm run typecheck`, `npm run typecheck:specs` and the test suite; fix anything they report.

<!-- No browser-verification task: declined by the user; the gate is a pure function covered by unit tests, and the DENIED render already exists. -->
