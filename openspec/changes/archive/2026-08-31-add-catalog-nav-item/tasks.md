## 1. i18n keys

- [x] 1.1 In `src/constants/i18n.ts`, add `Catalog = 'Menu.Catalog'` and `CatalogDescription = 'Menu.CatalogDescription'` to the `MenuI18nKey` enum, placed after the `BuildersDescription` entry.
- [x] 1.2 In `src/locales/en.ts`, add translations for the two new keys in the `Menu` section near the existing `Builders` / `BuildersDescription` entries: `Catalog: 'Catalog'` and `CatalogDescription: 'Catalog section'` (or an equivalent concise description phrase).

## 2. Menu configuration

- [x] 2.1 In `src/components/Menu/menu-configuration.tsx`, add `IconBook2` to the tabler imports and insert a Catalog group entry at array index 2 (after the Builders entry, before the Assets entry):
  ```ts
  {
    key: MenuI18nKey.Catalog,
    descriptionKey: MenuI18nKey.CatalogDescription,
    icon: <IconBook2 width={iconSize} height={iconSize} />,
    items: [],
  },
  ```

## 3. Tests

- [x] 3.1 In `src/components/Menu/tests/menu-configuration.spec.ts`, add a `describe('MENU_CONFIGURATION — Catalog group', ...)` block that:
  - asserts `MENU_CONFIGURATION` contains a group with `key === MenuI18nKey.Catalog` under any `FeatureFlags` value,
  - asserts its array index is greater than the Builders group index and less than the Assets group index,
  - asserts its `descriptionKey` is `MenuI18nKey.CatalogDescription`.
- [x] 3.2 In the same spec file, add a test that verifies `getActualMenuItems` excludes the Catalog group when `items` is empty (filtering parity with `menu-items.spec.ts` patterns).

## 4. Quality checks

- [x] 4.1 Run `npx vitest run src/components/Menu/tests/menu-configuration.spec.ts src/utils/env/tests/menu-items.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass.
- [x] 4.2 Run `npm run lint` and `npm run format` from the repo root and fix any issues.

_No browser-verification task: the Catalog group has no items and is filtered out of the rendered menu by `getActualMenuItems`; there is no browser-observable behavior change in this PR._
