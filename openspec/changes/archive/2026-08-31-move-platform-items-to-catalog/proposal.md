## Why

The Catalog group was introduced as empty infrastructure in `add-catalog-nav-item`. The six platform
entity items (PlatformModels, PlatformAppRunners, PlatformInterceptors, PlatformRoutes, PlatformRoles,
PlatformKeys) currently sit inside the Assets group, but they belong conceptually in Catalog. Moving
them populates the group and makes it visible in the sidebar; marking Catalog as `isPreview` signals
that the section is not yet stable.

## What Changes

- Move all six platform items from `Assets.items` → `Catalog.items` in `MENU_CONFIGURATION`, each
  keeping `isPreview: true` on the item level.
- Add `isPreview: true` to the Catalog group entry itself.
- Update `menu-configuration.spec.ts`: remove Assets-group tests that assert on platform items;
  add Catalog-group tests that assert the platform items are present and that the group is flagged
  `isPreview`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `catalog-nav`: Extend existing requirements — Catalog group must contain the six platform items
  (each `isPreview`), must carry `isPreview: true` at the group level, and must be visible in the
  rendered sidebar (non-empty items list).

## Impact

- `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx` — platform items relocated, group
  flag added.
- `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts` — Assets-group tests
  updated; Catalog-group tests extended.

## Non-goals

- No changes to item routes, labels, or `isPreview` values on individual items.
- No changes to any other menu group.
- No changes to `getActualMenuItems` or sidebar rendering logic.
