## Why

The left-navigation menu can show exactly one badge, "Preview", driven by a boolean `isPreview` on
`MenuGroupConfiguration` / `MenuItem`. The legacy admin-backend groups (Entities, Builders, Access
Management, Audit) are being superseded by the Core-direct Catalog surface, and the menu needs a second
badge — "Deprecated" — to say so. A second boolean would allow contradictory combinations and add a
render branch per badge, so the badge becomes a single typed field.

## What Changes

- Add a `MenuBadge` enum (`Preview`, `Deprecated`) and replace `isPreview?: boolean` with
  `badge?: MenuBadge` on both `MenuGroupConfiguration` and `MenuItem`.
- Replace `PreviewTag` with one `MenuBadgeTag` that maps a `MenuBadge` to its label key and colour; adding
  a badge later is one enum member, one lookup entry, and one i18n key.
- Add `BasicI18nKey.Deprecated` (`Basic.Deprecated`) and its `en.ts` string.
- Mark the Entities, Builders, Access Management, and Audit group headers with `MenuBadge.Deprecated`.
  Their sub-items are not tagged, so the badge appears once per group.
- Migrate the Analytics group from `isPreview: true` to `badge: MenuBadge.Preview`.
- Keep today's rule that badges render only while the sidebar is expanded.
- Update `docs/MENU-DOCUMENTATION.md` so the section headings carry the badge.

## Capabilities

### New Capabilities

- `menu-badges`: which badge types a menu group or item can carry, how each renders, and which groups
  carry which badge today.

### Modified Capabilities

<!-- None: menu-group-visibility governs which groups are present, not how a header is decorated. -->

## Impact

- `src/components/Menu/menu-configuration.tsx` — enum, interface fields, group entries.
- `src/components/Menu/MenuItem/MenuItem.tsx`, `MenuItemContent.tsx` — render through `MenuBadgeTag`.
- `src/components/Common/PreviewTag/PreviewTag.tsx` — replaced (only the menu uses it).
- `src/constants/i18n.ts`, `src/locales/en.ts` — one new key.
- Specs to update: `menu-configuration.spec.ts`, `MenuItem.spec.tsx`.
- `docs/MENU-DOCUMENTATION.md`; `openspec/specs/platform-keys/spec.md` mentions `isPreview: true` for a
  Keys menu item that no longer carries it, so its wording is stale (see design).
- No server, route, or env-var changes. `DISABLE_MENU_ITEMS` and the feature-flag filtering are untouched.

## Non-goals

- Tagging sub-items as Deprecated. The item-level `badge` field exists and stays unused for it.
- A tooltip or "use X instead" hint on the badge.
- Showing badges while the sidebar is collapsed.
- Any change to which groups are visible or when.
