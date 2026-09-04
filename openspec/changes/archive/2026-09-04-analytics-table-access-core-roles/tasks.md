## 1. Role options come from DIAL Core

- [x] 1.1 Add the action's return shape to `apps/ai-dial-admin/src/models/analytics/table.ts`: an interface carrying the `ConfigEntityRow[]` the reader produced and the `EntitiesI18nKey[]` warnings it reported (per design D2 — types live in a model file, not inline in the action).
- [x] 1.2 Re-point `getRoles()` in `apps/ai-dial-admin/src/app/[lang]/tables/actions.ts` at `readConfigEntities(await token(), ConfigFileEntityType.Roles, warnings)` with a locally-declared warnings array, returning that shape. Drop the now-unused `rolesApi` and `DialRole` imports.

## 2. Panel options: the catalog unioned with the grants, sorted

- [x] 2.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableAccessPanel.tsx`, build the `DialSelectField` options from the fetched rows' bare names. The two controls themselves are unchanged — selection stays closed, with no typed entry (design D3).
- [x] 2.2 Capture the names granted when the panel opened and union them into the option list, so a grant the catalog does not offer renders as selected and survives a save (design D4).
- [x] 2.3 Sort the options case-insensitively by name in the panel, after the union — not in the shared reader, whose de-duplication depends on its own ordering (design D5).
- [x] 2.4 Report a catalog failure from the returned warnings instead of a null check: keep `AnalyticsTablesI18nKey.RolesLoadFailed` as the notification title and pass the reported warning key as its message, so an unreadable catalog and a partial one read differently. Leave the granted roles selected either way.

## 3. Tests

- [x] 3.1 Extend `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableAccessPanel.spec.tsx` for the new behaviour, keeping the existing `DialSelectField` checkbox double (design D6): alphabetical option order from an unsorted catalog, a stored out-of-catalog grant shown as selected and round-tripped unchanged, and the catalog-failure notification leaving the granted roles offered. The union and de-duplication of Core's two populations stay covered by `apps/ai-dial-admin/src/utils/config-entities/tests/options.spec.ts`, which asserts them at the reader level.
- [x] 3.2 Update the `getRoles` test in `apps/ai-dial-admin/src/app/[lang]/tables/tests/actions.spec.ts` to assert the token and `ConfigFileEntityType.Roles` reach the config-entities reader, that the admin-backend roles client is not called, and that reported warnings are returned alongside the rows.

## 4. Quality checks

- [x] 4.1 Run lint, format check, and the full test suite; fix anything they report.

No browser-verification task: the user was asked and chose to rely on the component and action tests above.
