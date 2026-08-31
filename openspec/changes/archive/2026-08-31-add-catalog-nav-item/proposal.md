## Why

The left-navigation sidebar needs a dedicated "Catalog" group, positioned between Builders and Assets, to house a new category of entries that don't belong in either existing group. Adding the group structure now establishes the nav infrastructure so items can be added to it in follow-up changes without touching the group definition.

## What Changes

- Add `MenuI18nKey.Catalog` and `MenuI18nKey.CatalogDescription` entries to the `MenuI18nKey` enum in `src/constants/i18n.ts`.
- Add a `Catalog` group entry to `MENU_CONFIGURATION` in `src/components/Menu/menu-configuration.tsx`, using `IconBook2` from `@tabler/icons-react`, placed at index 2 (after Builders, before Assets), with an empty `items` array.
- Add English translations for both new keys in `src/locales/en.ts`.
- The group is deliberately empty on introduction; `getActualMenuItems` already filters out groups with no items, so the Catalog section remains invisible until items are populated in subsequent changes.

## Capabilities

### New Capabilities

- `catalog-nav`: The Catalog navigation group — its presence in the menu configuration, its position between Builders and Assets, and its icon.

### Modified Capabilities

_(none — no existing spec requirements change)_

## Impact

- `apps/ai-dial-admin/src/constants/i18n.ts` — two new enum members
- `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx` — one new group entry
- `apps/ai-dial-admin/src/locales/en.ts` — two new translation strings
- `apps/ai-dial-admin/src/utils/env/tests/menu-items.spec.ts` — may need updating if tests assert on group count or order
- `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts` — same
