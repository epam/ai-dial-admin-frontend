## 1. Generic StatusBadge

- [x] 1.1 Add `StatusBadgeVariant` enum (`Valid`, `Invalid`) and `StatusBadgeProps` in `components/Common/StatusBadge/models.ts`; add `STATUS_BADGE_VARIANTS` lookup (pill token classes: `bg-success text-success`, `bg-error text-error`; the dot inherits the text color via `bg-[currentColor]`) in `components/Common/StatusBadge/constants.ts`
- [x] 1.2 Add `components/Common/StatusBadge/StatusBadge.tsx`: `inline-flex items-center gap-1 px-2 py-0.5 rounded-[120px]` pill, 6px `aria-hidden` dot, label, and a trailing 16px info icon in a focusable `<button aria-label>` inside `DialTooltip`, rendered only when `hint` is set; confirm via the ui-kit MCP (`getEntityDetails`) that `DialTooltip` opens on focus, wrapping manually only if it does not
- [x] 1.3 Add i18n keys (Valid, Invalid, info-icon accessible name) to `constants/i18n.ts` and `locales/en.ts`

## 2. Overall status mapping

- [x] 2.1 Extract the warnings-to-text logic from `Assets/Platform/Models/InvalidModelBanner.tsx` into a shared `formatValidationWarnings` util (`field: message`, empty parts dropped, joined `; `) and make the banner call it
- [x] 2.2 Add pure `getOverallStatusBadgeProps` util: `valid` → Valid with no hint; `invalid` → Invalid with hint only when the formatted warnings are non-empty; any other or missing status → `null`

## 3. Header integration

- [x] 3.1 Add `EntityHeaderControls/HeaderIdBlock.tsx`: renders the overall status badge (from `_metadata`), an optional children slot for the sync status, then `ReadonlyId`, with `gap-2` between badge and id and no placeholder when there is no badge
- [x] 3.2 Use `HeaderIdBlock` in `SimpleHeader.tsx` (passing `CoreSyncEntityStatus` as the slot, sync spacing unchanged) and in `AssetHeader.tsx`, passing the entity's `_metadata`

## 4. Unit tests

- [x] 4.1 Add `StatusBadge` component spec: variant classes, dot is `aria-hidden`, label is the accessible name, info icon absent without `hint` and present with it, icon is reachable by role/accessible name and shows the hint
- [x] 4.2 Add util specs for `formatValidationWarnings` and `getOverallStatusBadgeProps` (valid, invalid with/without warnings, one vs. several warnings, unknown/missing status)
- [x] 4.3 Update `InvalidModelBanner` spec if present for the shared util; add `HeaderIdBlock` spec (badge precedes id, absent without status, sync slot still renders) and extend `SimpleHeader`/`AssetHeader` specs for badge presence per `_metadata.status`

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` suite; fix any failures
