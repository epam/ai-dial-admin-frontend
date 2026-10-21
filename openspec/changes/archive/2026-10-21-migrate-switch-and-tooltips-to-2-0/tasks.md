## 1. JsonToggle and the flag

- [x] 1.1 Remove `isDesignSystem2` from `EntityHeaderControls/JsonToggle/JsonToggle.tsx`: always render the 2.0 `Switch` (`id="jsonEditor"`, `labelProps`), delete the `DialSwitch` branch, the prop and its doc comment
- [x] 1.2 Drop the prop from its callers in `Analytics/Tables/TableDetailView.tsx` (3 sites) and `Analytics/Pipelines/Common/PipelineDetailFrame.tsx`
- [x] 1.3 Confirm `isDesignSystem2` appears nowhere under `apps/ai-dial-admin/src`

## 2. Sweep legacy switches

- [x] 2.1 Script the rewrite over `apps/ai-dial-admin/src` (import specifier, opening and closing tag): `DialSwitch`→`Switch`, `switchId`→`id`, `label={x}`→`labelProps={{ label: x }}`; make the script list any site with an unexpected prop or a non-simple `label` instead of rewriting it
- [x] 2.2 Hand-edit every site the script listed
- [x] 2.3 Confirm no `DialSwitch` or `switchId` remains

## 3. Sweep legacy tooltips

- [x] 3.1 Script the rename (import specifier, opening and closing tag): `DialTooltip`→`Tooltip`, `DialEllipsisTooltip`→`EllipsisTooltip`, and `DialTooltipContainer` / `DialTooltipContent` / `DialTooltipTrigger`→`TooltipContainer` / `TooltipContent` / `TooltipTrigger` in `Grid/CellRenderers/ClampedTextCellRenderer.tsx`; no `asChild`
- [x] 3.2 Replace every string `placement` on a migrated tooltip with `TooltipPlacement` (and its import): `top`/`right`/`bottom`/`left` to the member, `bottom-start`→`Bottom` in `Assets/Resources/ResourceFeatures.tsx` and `EntityTabs/Features/Features.tsx`, `right-start`→`Right` in `TestSuites/Common/DynamicConfiguration/AttributeOption.tsx`
- [x] 3.3 Confirm no `DialTooltip`, `DialEllipsisTooltip`, `DialTooltipContainer`, `DialTooltipContent` or `DialTooltipTrigger` remains, and that no string `placement` is left on a `Tooltip` / `EllipsisTooltip`

## 4. Tests

- [x] 4.1 Delete the `JsonToggle` flag tests from `EntityHeaderControls/tests/design-system-opt-in.spec.tsx` (the file if nothing else remains); add a `JsonToggle` spec asserting the switch by role and name, its on/off state, `disabled`, and that `onToggleEditor` fires
- [x] 4.2 Update the ~30 specs that assert a legacy class or name (for example `CopyButton.spec.tsx`, `HeatMapAxisHeader.spec.tsx`, `asset-name-column.spec.tsx`, `PipelineDetailView.spec.tsx`) to query by role and accessible name; both `typecheck` and `typecheck:specs` stay at zero
- [x] 4.3 Add or extend specs for sites whose `label` was rewritten to `labelProps` (the switch is still found by its accessible name and toggles) and for `WarningIcon` (tooltip text shown when `warningText` is set, trigger hidden when it is not)

## 5. Specs and docs

- [x] 5.1 Check the delta specs under `openspec/changes/migrate-switch-and-tooltips-to-2-0/specs/` match the final component names, and search `docs/` for legacy switch and tooltip names and update any that describe them

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, then the full `npm run test`, and fix everything they report
