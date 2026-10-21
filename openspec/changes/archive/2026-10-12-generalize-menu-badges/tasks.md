## 1. Config model and i18n

- [x] 1.1 In `src/components/Menu/menu-configuration.tsx`, add `export enum MenuBadge { Preview = 'preview', Deprecated = 'deprecated' }` and replace `isPreview?: boolean` with `badge?: MenuBadge` on `MenuGroupConfiguration` and `MenuItem`
- [x] 1.2 In the same file, set `badge: MenuBadge.Deprecated` on the Entities, Builders, Access Management, and Audit groups, and change Analytics from `isPreview: true` to `badge: MenuBadge.Preview`
- [x] 1.3 Check `BasicI18nKey` for an existing "Deprecated" label; if none, add `Deprecated = 'Basic.Deprecated'` next to `Preview` in `src/constants/i18n.ts` and `Deprecated: 'Deprecated'` in the `Basic` section of `src/locales/en.ts`

## 2. Badge component and render sites

- [x] 2.1 Create `src/components/Menu/MenuItem/constants.ts` with `MENU_BADGES: Record<MenuBadge, { labelKey: BasicI18nKey; color: BadgeColor }>` (Preview → `BasicI18nKey.Preview` + `BadgeColor.Blue`; Deprecated → `BasicI18nKey.Deprecated` + `BadgeColor.Brown`)
- [x] 2.2 Create `src/components/Menu/MenuItem/MenuBadgeTag.tsx` (`Props { badge: MenuBadge }`, `<Badge variant={BadgeVariant.Filled} …/>` from the lookup) and delete `src/components/Common/PreviewTag/PreviewTag.tsx`
- [x] 2.3 In `MenuItem.tsx`, render `config.badge && <MenuBadgeTag badge={config.badge} />` in the existing header wrapper; in `MenuItemContent.tsx`, render `menuItem.badge && isSidebarOpen ? <MenuBadgeTag badge={menuItem.badge} /> : null`; update both imports

## 3. Docs

- [x] 3.1 In `docs/MENU-DOCUMENTATION.md`, add a `[Deprecated]` marker to the Entities, Builders, Access Management, and Audit section headings, matching the existing `[Preview]` style on Analytics, and say that the marker is the group's `badge`

## 4. Tests

- [x] 4.1 Update `components/Menu/tests/menu-configuration.spec.ts`: replace the `isPreview` assertions (the AI Gateway "carries no preview tag" test and the Analytics `group?.isPreview` check) with `badge` equivalents; add cases that the four legacy groups carry `MenuBadge.Deprecated` with badge-free items, and that the other groups carry no `badge`
- [x] 4.2 Update `components/Menu/MenuItem/tests/MenuItem.spec.tsx`: the Preview badge on an expanded header, the Deprecated badge on an expanded header, no badge when the sidebar is collapsed, no badge when `badge` is unset, and a sub-item badge still renders via `MenuItemContent`
- [x] 4.3 Add `components/Menu/MenuItem/tests/MenuBadgeTag.spec.tsx`: each `MenuBadge` value renders its label key

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the Menu-related specs (`npx vitest run src/components/Menu` from `apps/ai-dial-admin/`), then the full `npm run test` as the final gate, and fix any failures
