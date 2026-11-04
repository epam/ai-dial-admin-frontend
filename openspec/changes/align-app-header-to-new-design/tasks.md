## 1. Building blocks

- [x] 1.1 Render the kit `Avatar` (24px, no tooltip) in `UserIcon` (`components/Header/User/UserMenu/UserIcon.tsx`)
      instead of the `randomcolor`/`polished` fallback, and drop `polished`, `randomcolor`, `@types/randomcolor`
      from `package.json`
- [x] 1.2 Add `components/Header/User/AvatarButton.tsx`: a thin wrapper over the kit `IconButton` with the `UserIcon`
      and the i18n "Account settings" name
- [x] 1.3 Rewrite `components/Common/ReadOnlyBadge/ReadOnlyBadge.tsx` as one non-focusable `span` pill on the inverted
      control tokens: 16px with an eye icon below `lg`, 20px with the "Read only" label from `lg`, the explanation
      in an `sr-only` span; kit `Tooltip` `bottom-end`, trigger `py-1`, width capped to the viewport
- [x] 1.4 Update `locales/en.ts`: `ReadOnlyAdmin.BadgeLabel` → `'Read only'`, `Description` ends with a period; add
      the `Header` section (`ToggleSidebar`, `Help`, `AccountSettings`) and `HeaderI18nKey` in `constants/i18n.ts`
- [x] 1.5 `components/Header/HelpButton/HelpButton.tsx`: 24px icon (`aria-hidden`), i18n name, open look while the
      dropdown is open, `listClassName="mt-2"`; no hand-set `aria-expanded` (the kit `Dropdown` sets it)
- [x] 1.6 Add `utils/env/get-app-name.ts` (`APP_NAME` or the built-in name) and `MAIN_MENU_ID` in
      `constants/main-layout.ts`; use `getAppName()` in `app/layout.tsx` metadata and pass it as `appName` to
      `Header` from `app/[lang]/layout.tsx`; set `id={MAIN_MENU_ID}`
      on `MenuContent`'s root

## 2. Header layout

- [x] 2.1 Rework `components/Header/Header.tsx`: 48px `bg-layer-base` bar with `border-tertiary`,
      `px-4 lg:pl-5 lg:pr-6`; toggle as kit `GhostIconButton` (`IconLayoutSidebar` 24px, `-m-2`, i18n name,
      `aria-expanded`, `aria-controls={MAIN_MENU_ID}`) + logo group; breadcrumbs `flex-1 min-w-0 overflow-hidden lg:pl-10`; right
      row with `ReadOnlyBadge`, then help + avatar in `-m-2` wrappers (`gap-5`, `lg:gap-6`)
- [x] 2.2 `components/Header/Logo.tsx`: an `<img>` with `alt={appName}`, `h-6 w-auto max-w-[200px] object-contain
      object-left`, inside a shrinkable home link with a token focus ring
- [x] 2.3 In `components/Breadcrumbs/Breadcrumbs.tsx`, keep `pl-10` on the tablet branch only
- [x] 2.4 Use `AvatarButton` as the desktop `Dropdown` trigger in `UserMenu.tsx` (replacing the
      `div role="menuitem"` and its `pr-6`), `isActive` from the existing `isOpen`; `placement="bottom-end"`,
      `listClassName="!w-[280px] mt-2"`; email under the name in the menu header
- [x] 2.5 One user menu on every viewport: `Header` renders `UserMenu` directly; delete `User.tsx`,
      `ProfileButton.tsx`, `UserMobile.tsx`, `userMenuOpen` / `toggleUserMenu` in `AppContext.tsx`, and
      `Content`'s `isEnableAuth` prop; delete `SettingsItem` / `LogoutItem` and pass `label` / `icon` / `danger` to
      the kit `DropdownItem`; fix `themes?.length &&` rendering `0`; `AvatarButton` and `HelpButton` on
      `GhostIconButton`

- [x] 2.6 Tooltips on the help and avatar buttons through kit `tooltipProps` ("Help"; the user's name):
      `bottom-end` while the menu is closed, `TooltipPlacement.Left` while it is open; the shared
      `TOOLTIP_PLACEMENT_BOTTOM_END` in `constants/tooltip.ts`, also used by `ReadOnlyBadge`

- [x] 2.7 `AvatarButton` on the kit `IconButton`: Primary Ghost with the avatar while closed, Neutral Outlined with
      an `IconX` while the menu is open

## 3. Tests

- [x] 3.1 `Header.spec.tsx`: read-only indicator only for a read-only admin, its explanation as text and no button;
      no help without `docLink`; toggle name and `aria-controls`; logo image named after the product, linking home
- [x] 3.2 `User/tests/AvatarButton.spec.tsx`: name, initials, click handler, tooltip on hover, close icon while open; `Content.spec.tsx` without
      `isEnableAuth`
- [x] 3.3 `ReadOnlyBadge/tests/ReadOnlyBadge.spec.tsx`: label, explanation as text, not a control
- [x] 3.4 `UserMenu/tests/UserMenu.spec.tsx` (name + email in the header, no email line without one) and the
      `HelpButton` spec for `aria-expanded` while open and the i18n name
- [x] 3.5 `utils/env/tests/get-app-name.spec.ts`: set, empty and missing `APP_NAME`

## 4. Verification

- [x] 4.1 Run `spec-browser-verify` for `align-app-header-to-new-design` against the local app (auth disabled):
      `app-header` scenarios at 1440px and at 360px, light and dark theme, as a read-write admin; read-only and help
      scenarios with them emulated if the local stack provides neither. Resolve every `fail` verdict

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`;
      all pass
