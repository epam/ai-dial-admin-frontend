## Why

The application header (`components/Header/*`) predates the current Admin design: it is taller than the
design, positions the logo and breadcrumbs with absolute offsets, uses a generic menu icon, renders the
user avatar without interactive states, and shows the read-only badge in the kit's default style. The new
"Headers – Admin" design fixes one layout for desktop and mobile, and no spec describes the header today,
so nothing holds that layout in place.

## What Changes

- Desktop header becomes a 48px bar on the new palette's base layer with a tertiary bottom border:
  sidebar toggle (layout-sidebar icon) → theme logo → breadcrumbs 52px after the logo → right group
  (read-only badge, help, avatar) with a 24px edge inset on both sides; gaps measured between visible icons.
- The logo and breadcrumbs sit in normal flex flow; the absolute logo positioning and the `pl-[200px]`
  breadcrumb offset go away.
- The user avatar shrinks to 24px inside the kit's icon button: ghost like help while the menu is closed, a
  Neutral Outlined close button while it is open.
  It moves to the kit `Avatar`: the colour still differs per user and stays stable, but now comes from the
  theme palette.
- The read-only badge becomes a non-interactive status pill — dark on the light theme, light on the dark theme —
  labeled "Read only", its explanation read by screen readers and shown in a tooltip below it on hover, extending to the left. The tooltip text gains its closing period.
- Mobile header (down to the app's 360px minimum): toggle and logo on the left, help and avatar on the
  right, no divider before the avatar. Read-only shows as a compact eye-icon pill in the right row, before help.
  Breadcrumbs stay out of the mobile header (they keep rendering below it on tablet, as today).
- The help button keeps its behavior and 24px icon; while its menu is open it stays highlighted.
- Both header menus (help, user) open below their button, aligned to its right edge; the user menu header
  shows the email under the name.

## Non-goals

- No change to the logo source: it still comes from the theme (`currentThemeLogo`); it becomes an image named
  after the product (`APP_NAME`), 24px high, at most 200px wide.
- No kit or shared `SideBar` changes: both are generic, the header adapts to them.
- No fixed avatar palette: the design's orange swatch is illustrative.
- No change to breadcrumb content, folder enrichment, or the help-link routing.
- No change to what the user menu items do, the settings modal, or the logout flow; Log out is only restyled
  as the danger action.
- No support for viewports below 360px.

## Capabilities

### New Capabilities
- `app-header`: layout, controls and states of the application header on desktop and mobile — sidebar
  toggle, logo, breadcrumbs placement, read-only indicator, help button and user avatar.

### Modified Capabilities
<!-- none -->

## Impact

- Code: `components/Header/Header.tsx`, `Header/Logo.tsx`, `Header/HelpButton/HelpButton.tsx`,
  `Header/User/UserMenu/UserMenu.tsx`, `Header/User/AvatarButton.tsx` (new); deleted `Header/User/User.tsx`,
  `Header/User/ProfileButton.tsx`, `Header/User/UserMobile.tsx`, `UserMenu/SettingsItem.tsx`,
  `UserMenu/LogoutItem.tsx`; `context/AppContext.tsx` (`userMenuOpen` / `toggleUserMenu` removed),
  `components/Content/Content.tsx` (`isEnableAuth` removed), `Menu/MenuContent/MenuContent.tsx` (`id`),
  `Header/User/UserMenu/UserIcon.tsx`, `components/Breadcrumbs/Breadcrumbs.tsx` (desktop padding only),
  `components/Common/ReadOnlyBadge/ReadOnlyBadge.tsx`, `locales/en.ts` (`ReadOnlyAdmin`).
- The mobile header loses its separate user panel: the same popover user menu opens on every width.
- `Breadcrumbs` is shared with the tablet strip in `Content.tsx`; only the desktop branch's spacing changes.
- Tests: `Header.spec.tsx`, `HelpButton.spec.tsx`, `UserMenu.spec.tsx`, `AvatarButton.spec.tsx`, `Content.spec.tsx`, `ReadOnlyBadge` and
  `UserIcon` specs if present.
- Dependencies: `polished`, `randomcolor` and `@types/randomcolor` are removed — the avatar was their only user.
- No API or env changes.
