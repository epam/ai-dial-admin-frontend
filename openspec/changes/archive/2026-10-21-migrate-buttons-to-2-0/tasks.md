## 1. Shared components

- [x] 1.1 Add `apps/ai-dial-admin/src/components/Common/RemoveButton/RemoveButton.tsx`: `IconButton` with `ButtonVariant.Danger`, `ButtonAppearance.Outlined`, an `IconTrashX` icon (`aria-hidden`) and a default `aria-label={t(ButtonsI18nKey.Delete)}`; defaults before the caller's spread
- [x] 1.2 Delete `Common/CloseButton/CloseButton.tsx` and use the kit's `CloseButton` with `ariaLabel={t(ButtonsI18nKey.Close)}` in its 4 importers (`Common/Drawer/Drawer.tsx`, `Grid/ColumnsPanel/ColumnsPanel.tsx`, `Grid/TreeColumnsPanel/TreeColumnsPanel.tsx`, `Telemetry/TelemetryControls/Filters/CreateFilter.tsx`)
- [x] 1.3 Remove `isDesignSystem2` from `EntityHeaderControls/Buttons/ChangedEntityButtons.tsx`: keep the 2.0 branch (Discard `Button` Neutral · Solid, Save Primary · Solid) and delete the legacy branch and the prop
- [x] 1.4 Remove `isDesignSystem2` from `Common/CopyButton/CopyButton.tsx`: labelled button is the 2.0 `Button` (Neutral · Outlined, `IconCopy`) named by its visible label and honouring `size`; icon-only branch becomes `IconButton` keeping `aria-label` `copy <valueLabel>`
- [x] 1.5 Drop the `isDesignSystem2` prop from the `ChangedEntityButtons` and `CopyButton` callers in `Analytics/Tables/TableDetailView.tsx`, `Analytics/Pipelines/Common/PipelineDetailFrame.tsx` and `Analytics/Pipelines/Preview/PreviewStatement.tsx`; leave it on `JsonToggle`

## 2. Sweep legacy buttons

- [x] 2.1 Script the rename over `apps/ai-dial-admin/src` (import specifier, opening and closing tag): `DialPrimaryButton`→`PrimaryButton`, `DialGhostButton`→`GhostButton`, `DialLinkButton`→`LinkButton`, `DialButton`→`Button`, `DialIconButton`→`IconButton`, `DialGhostIconButton`→`GhostIconButton`, `DialPrimaryIconButton`→`PrimaryIconButton`
- [x] 2.2 Rename `DialNeutralButton`→`OutlinedButton` and `DialRemoveButton`→`@/src/components/Common/RemoveButton`
- [x] 2.3 Rename `DialDangerButton`→`DangerButton` and add `appearance={ButtonAppearance.Outlined}` plus the `ButtonAppearance` import at every site
- [x] 2.4 Fix every migrated `tooltipProps.placement` that has no `TooltipPlacement` member (5 files use `tooltipProps`)
- [x] 2.5 Confirm no `DialNeutralButton`, `DialPrimaryButton`, `DialGhostButton`, `DialDangerButton`, `DialLinkButton`, `DialIconButton`, `DialGhostIconButton`, `DialPrimaryIconButton`, `DialCloseButton`, `DialRemoveButton` or `DialButton` remains under `apps/ai-dial-admin/src` (`DialRadioButton` is out of scope), and that `NeutralButton` / un-appearanced `DangerButton` appear nowhere except `ChangedEntityButtons`

## 3. Tests

- [x] 3.1 Delete the change-bar flag tests from `EntityHeaderControls/tests/design-system-opt-in.spec.tsx` and the `CopyButton` flag tests from `Common/CopyButton/CopyButton.spec.tsx`; keep the `JsonToggle` opt-in tests; add change-bar tests asserting Discard and Save by role and name, and the Save disabled state
- [x] 3.2 Add `CopyButton` tests: labelled button copies, shows the notification and is named by its label; icon-only button is named `copy <valueLabel>`
- [x] 3.3 Add `RemoveButton` tests: default name is `ButtonsI18nKey.Delete`, a caller `aria-label` overrides it, click fires, disabled state; delete the `Common/CloseButton` spec if one exists
- [x] 3.4 Update every spec that asserts a legacy class or name to query by role and accessible name; both `typecheck` and `typecheck:specs` stay at zero

## 4. Specs and docs

- [x] 4.1 Check the delta specs under `openspec/changes/migrate-buttons-to-2-0/specs/` match the final component names, and search `docs/` for legacy button names and update any that describe them

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, then the full `npm run test`, and fix everything they report
