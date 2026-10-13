## Context

`MenuGroupConfiguration` and `MenuItem` (`menu-configuration.tsx`) each carry `isPreview?: boolean`.
`MenuItem.tsx` renders `<PreviewTag />` in a group header and `MenuItemContent.tsx` renders it on a
sub-item, both only while `isSidebarOpen`. Today only the Analytics group sets it, and no sub-item does.
`PreviewTag` is used by nothing else. A second badge, "Deprecated", is needed on the Entities, Builders,
Access Management, and Audit headers.

## Goals / Non-Goals

**Goals:**
- One typed field that names the badge, so a new badge type is a local, mechanical addition.
- "Deprecated" on the four legacy group headers, "Preview" unchanged on Analytics.

**Non-Goals:**
- Tagging sub-items, tooltips, or collapsed-sidebar badges (see proposal).

## Decisions

**1. `badge?: MenuBadge` replaces `isPreview?: boolean`, on both interfaces.**
`MenuBadge` is a string enum (`Preview = 'preview'`, `Deprecated = 'deprecated'`) per
`code-standards.md` ("enums over string-literal unions"), defined next to the interfaces in
`menu-configuration.tsx`. One field makes "Preview and Deprecated together" unrepresentable.
- *Alternative — add `isDeprecated?: boolean`:* rejected; it permits contradictory pairs and needs a new
  flag and render branch per badge.
- *Alternative — `badges?: MenuBadge[]`:* rejected; nothing needs two badges, and the header has room for
  one.

**2. A single `MenuBadgeTag` driven by a lookup, replacing `PreviewTag`.**
`Common/PreviewTag/PreviewTag.tsx` is replaced by `Menu/MenuItem/MenuBadgeTag.tsx` (it only serves the
menu, so it moves out of `Common/`, which is for domain-free pieces). It takes `badge: MenuBadge` and
reads a `Record<MenuBadge, { labelKey: BasicI18nKey; color: BadgeColor }>` kept in `Menu/MenuItem/constants.ts`
(consts stay out of `models.ts` and the component, per `code-standards.md`). Preview stays
`BadgeColor.Blue`. Deprecated uses `BadgeColor.Brown`: Red reads as an error state, and a deprecated
group is still fully working. Colour is a one-line change in the lookup if design prefers otherwise.
- *Alternative — keep `PreviewTag` and add `DeprecatedTag`:* rejected; two near-identical components and
  a switch at each render site.

**3. Render sites only change the condition.**
`MenuItem.tsx` renders `config.badge && <MenuBadgeTag badge={config.badge} />` in the existing wrapper;
`MenuItemContent.tsx` does the same for `menuItem.badge`. The `isSidebarOpen` gating is unchanged, and no
item sets `badge`, so sub-items stay untagged.

**4. One i18n key, `BasicI18nKey.Deprecated`, next to `Preview`.**
Check `BasicI18nKey` first and reuse it if a "Deprecated" label already exists; otherwise add
`Basic.Deprecated` to `i18n.ts` and `en.ts`.

**5. Spec home.** A new `menu-badges` capability. `menu-group-visibility` stays about presence, and the
badge rules have no existing owner (the only trace today is the hand-written `[Preview]` in
`docs/MENU-DOCUMENTATION.md`).

## Risks / Trade-offs

- [`isPreview` has other readers I missed] → grep shows only the two render sites and the two interfaces
  in app code; `tsc` fails on any leftover reference, so the typecheck gate catches it.
- [Visible badge is the only signal: the group header has no accessible name beyond its text] → this
  matches Preview today; improving it is a separate change, listed as a non-goal.
- [Colour choice is subjective] → isolated in the lookup.
- [`openspec/specs/platform-keys/spec.md` still mentions `isPreview: true` on a Keys item that no longer
  carries it] → already stale before this change; left alone to keep the change PR-sized.

## Migration Plan

No data or config migration. The change ships as one PR; rollback is a revert.

## Open Questions

- Brown vs. another colour for Deprecated — defaulting to Brown pending design input.
