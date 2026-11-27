## Context

`Header.tsx` rendered three absolutely or loosely positioned regions: the toggle in its own `px-3` box, the
logo `absolute` at `lg:left-[48px]` (centred on mobile), and breadcrumbs pushed right by `lg:pl-[200px]`
plus the `pl-10` inside `Breadcrumbs`. The right group relied on `UserMenu`'s `pr-6` trigger for its edge
inset. On mobile, `User` rendered `ProfileButton` (a 48px kit `Button` with `border-l`) that toggles
`UserMobile`; on desktop it rendered `UserMenu`, whose `Dropdown` trigger was a `div role="menuitem"`
wrapping `UserIcon`. The logo was a link with the theme image as `background-image`.

Design measurements (from `Headers.svg`): bar 48px; toggle icon 24px (a 16px glyph) at a 20px inset (16px mobile);
logo 24px after the toggle icon (16px mobile); breadcrumbs 52px after the logo; read-only pill 20px high (compact
28×16); help icon 24px (its circle is 18px); avatar 24px; menus ~12px below their button; read-only tooltip
~14px below the pill. The current theme logo is a 212×40 SVG, 127px wide at 24px.

## Goals / Non-Goals

**Goals:**
- One flex row per breakpoint; no absolute positioning, no fixed widths derived from other values.
- Every colour from `app-theme.css` tokens; every control state from the kit where the kit has the control.
- Labels and alternatives through i18n or configuration, none hard-coded.

**Non-Goals:**
- Reworking `Breadcrumbs` data logic or the tablet strip in `Content.tsx`.
- Changing the kit or the shared `SideBar`: both are generic, so the header adapts to them, not the reverse.

## Decisions

### 1. Content-flow layout
The row is `flex items-center gap-3 px-4 lg:pl-5 lg:pr-6`: a toggle + logo group, the breadcrumbs in a
`flex-1 min-w-0 overflow-hidden` cell (so a long trail is clipped instead of painting over the right row) with `lg:pl-10` (12px gap + 40px = the design's 52px after the logo), then the right
row. The breadcrumbs follow the logo rather than a fixed column: the sidebar is resizable (200–432px, default
260px), so a 250px column lined up with nothing.

*Alternative:* a fixed `lg:w-[214px]` left cell (250 − 24 inset − 12 gap) — rejected after review: the number
silently depends on the inset and gap, and the column aligned with nothing.

### 2. Spacing by visible icons
The design spaces icons, not hit areas. The 40px help and avatar buttons sit in `-m-2` wrappers in `Header`,
and the sidebar toggle — also a kit `GhostIconButton` with a 24px icon — has `-m-2`, so flex gaps equal the
design's gaps between 24px icon boxes: desktop 20 / 24 / 20 / 24 / 24 (left inset, toggle→logo, badge→help,
help→avatar, right inset), mobile 16 / 16 / 20 / 20 / 16.
The margin is on a wrapper, not the button, because the kit places a dropdown against its trigger's box; a
pulled-in trigger anchored the menu to the 24px icon. The right row nests help + avatar in their own group so
each gap is written as the design states it (`gap-5`, `lg:gap-6`) instead of a shared gap plus a correction.

### 3. Tokens
| Element | Token |
|---|---|
| Bar background | `bg-layer-base` (replaces `bg-layer-3`) |
| Bottom border | `border-tertiary` (unchanged) |
| Sidebar toggle | `text-secondary`, hover + focus `bg-control-neutral-hover-muted`, focus `outline-focus` |
| Read-only pill | `bg-control-inverted text-control-inverted` |
| Help / avatar open state | `bg-control-accent-alpha-hover` (the kit's own hover tint) |

The inverted control pair is what the theme flips between light and dark, which gives the "dark on light,
light on dark" pill without per-theme classes.

### 4. Avatar on the kit icon button
`UserIcon` renders the kit `Avatar` (24px, no tooltip) instead of its own `randomcolor`/`polished` fallback:
the kit picks a stable colour per name from theme tokens. Decided with the user during apply.

`AvatarButton` is a thin wrapper over the kit `IconButton`: closed, it is Primary Ghost with the avatar and the
i18n "Account settings" name, so hover, pressed and focus match the help button next to it; open, it becomes
Neutral Outlined with an `IconX` and the name "Close" (see Decision 9).

*Alternative:* a hand-rolled `<button>` with its own plates and ring — rejected after review: it drifted from
the help button's hover strength and duplicated what the kit already ships.

The name tooltip is gone from `UserIcon`: on the header button it overlapped its neighbours and caught the
pointer, and in the menu header it repeated the visible name.

### 5. Read-only badge as status text
`ReadOnlyBadge` is a single, non-focusable `span` pill. Below `lg` the label is visually hidden and an eye icon
shows (`max-lg:sr-only`, `lg:hidden`); the pill grows from 16px to 20px. The explanation is in an `sr-only`
span, so screen readers read it with the label; the kit `Tooltip` shows it on hover.

*Alternative:* a focusable `<button>` so the tooltip opens from the keyboard — rejected after review: a button
that does nothing is announced as a control.

Tooltip placement is `bottom-end` (below, extending left), as the user asked; the design centres it.
`TooltipPlacement` names only a side, so the value is cast; the kit passes it to floating-ui unchanged. The
kit's offset is a fixed 9px, so the trigger gets `py-1` to reach ~14px, and `contentClassName` caps the
width at `min(376px, 100vw - 32px)` so it fits 360px.

The kit `Badge` has no inverted colour, so the pill is drawn locally.

### 6. Help button and menus
`IconHelpCircle` stays 24px. While its menu is open, the kit ghost button gets
`!bg-control-accent-alpha-hover !text-accent`, its own hover look; `!` because the kit's two-class selector
outranks one utility. The kit `Dropdown` already clones `aria-haspopup` / `aria-expanded` / `aria-controls`
onto its trigger, so the header sets none of them by hand.

Both menus open `bottom-end` (without a placement the kit auto-places to the roomier side — the left) and get
`listClassName="mt-2"`, because the kit's gap is a fixed 4px against the design's ~12px. The user menu header
shows the email under the name, both in `EllipsisTooltip`.

### 7. Logo as an image
The theme logo is an `<img>` inside the home link, its `alt` the product name: `APP_NAME`, the variable that
already names the browser tab, with `DEFAULT_APP_NAME` as the shared fallback. Not i18n — it is a name, not
interface text — and not from the theme, whose configuration has no name field. Proportions are unknown, so it
is 24px high at its own width, `max-w-[200px]` (≈1.5× the design's 128px), `object-contain object-left`, and
the link can shrink on a narrow header. Unlike a background image it stays visible in forced-colours mode.

### 8. Accessible names and relations
Header labels come from a new `HeaderI18nKey` section: Toggle sidebar, Help, Account settings. The sidebar
toggle's `aria-controls` points at `MAIN_MENU_ID` on `MenuContent`, the app's own menu, rather than at the
shared `SideBar`. Breadcrumb links draw an inset focus ring: the breadcrumb cell and each crumb clip overflow,
so a ring drawn outside the link was cut off.

### 9. One user menu on every viewport
The mobile header used its own panel: `ProfileButton` toggled `UserMobile`, a 260px column under the header
driven by `userMenuOpen` / `toggleUserMenu` in `AppContext`, with its own Settings / Log out rows. The browser
check found it covered by the mobile sidebar, its rows unreachable from the keyboard, and focus lost after its
dialogs. Decided with the user: drop it and use the desktop `UserMenu` popover everywhere. `UserMobile`,
`ProfileButton`, the `User` breakpoint switch and the `AppContext` state are deleted, and `Content` loses the
`isEnableAuth` prop it only passed on to the panel. The kit `Dropdown` brings Escape, outside-click, focus
return and menu-item roles, so none of that is hand-written.

Both menu triggers carry a kit tooltip through `tooltipProps` (help: "Help"; avatar: the user's name). It
opens `bottom-end`, like the menu, while the menu is closed, and moves to `Left` while it is open, because both
open downwards from the same corner. The earlier name tooltip on `UserIcon` overlapped its neighbours; it
now lives on the button, where the placement can follow the menu, and the menu-header avatar has none.
`TOOLTIP_PLACEMENT_BOTTOM_END` in `constants/tooltip.ts` holds the one placement cast for its three users.

While the user menu is open the avatar button becomes a close button — the kit `IconButton` switching
`variant` / `appearance` from Primary Ghost to Neutral Outlined and the avatar to an `IconX`. It stays the same
component, so the trigger is not remounted and focus stays on it; the open tint override is no longer needed
for the avatar.

Settings and Log out are kit `DropdownItem`s (`label`, `icon`, `danger` for Log out); the former
`SettingsItem` / `LogoutItem` wrappers are gone. The help and sidebar buttons use the kit `GhostIconButton`;
`AvatarButton` uses the kit `IconButton` so it can switch variant while open.

`en.ts`: `BadgeLabel` → `'Read only'`, `Description` gains the trailing period, new `Header` section.

## Risks / Trade-offs

- [Kit workarounds — the placement cast, `!` overrides, `mt-2`, `py-1`, the tooltip width cap] → Each
  compensates for a fixed kit value; they are local and break visibly (spacing, not behaviour)
  if the kit changes. No kit changes are requested: the kit is generic by design.
- [Breadcrumbs move with the logo's width] → Intended; the 200px cap bounds it.
- [Keyboard users cannot open the read-only tooltip] → The same explanation is read by screen readers, and the
  visible "Read only" label carries the status.
- [`UserIcon` shrink affects the menu header] → Accepted per the design's single avatar size.
