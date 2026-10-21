## Why

The admin app still draws almost every button with the legacy `Dial*Button` components from
`@epam/ai-dial-ui-kit` (about 230 files), while the kit's 2.0 generation ships replacements. Two
components (`ChangedEntityButtons`, `CopyButton`) already carry both generations behind an
`isDesignSystem2` prop, which every caller has to opt into. This is the first sub-task of the
component-by-component 2.0 migration (issue #5147): move buttons over completely, so the flag and the
duplicated 1.0 branches can go.

## What Changes

- Replace every legacy button with its 2.0 counterpart in one change:
  - `DialPrimaryButton` → `PrimaryButton`, `DialGhostButton` → `GhostButton`, `DialLinkButton` → `LinkButton`,
    `DialButton` → `Button`: same variant and appearance defaults, props carry over.
  - `DialIconButton` → `IconButton`, `DialGhostIconButton` → `GhostIconButton`,
    `DialPrimaryIconButton` → `PrimaryIconButton`.
  - `DialCloseButton` → the kit's `CloseButton`, used directly. The repo's own `Common/CloseButton` wrapper (it only
    added a translated `aria-label`, and no caller passes `size`) is deleted and its 4 callers pass the label.
  - `DialNeutralButton` → `OutlinedButton` and `DialDangerButton` → `DangerButton` with
    `ButtonAppearance.Outlined`. The legacy wrappers default to **Outlined**; the 2.0 `NeutralButton` and
    `DangerButton` default to **Solid**, so a plain rename would flip ~230 buttons.
  - `DialRemoveButton` → a new `Common/RemoveButton` (Outlined danger `IconButton` with `IconTrashX`, named by
    default); the 2.0 kit has no remove button and all 38 uses are icon-only.
- Remove the `isDesignSystem2` prop from `ChangedEntityButtons` and `CopyButton`, delete their 1.0 branches, and
  drop the prop from their callers (`TableDetailView`, `PipelineDetailFrame`, `PreviewStatement`).
  `JsonToggle` keeps its own `isDesignSystem2` for now; it is a `Switch` and moves with the Switch migration.
- Keep the Discard / Save bar as the Tables and Pipelines pages draw it today (Discard is a **solid** neutral
  button, Save a solid primary). Every other entity page changes to match.
- `CopyButton` keeps the 2.0 behaviour: the labelled button is named by its visible label, and now honours `size`,
  which the 2.0 branch dropped. The component stays: it owns the clipboard write and the toast, with 29 importers.
- Fix `tooltipProps.placement` on migrated buttons: 2.0 buttons take the four-sided `TooltipPlacement` enum, so
  aligned values such as `top-start` have no equivalent and need a side picked.
- **BREAKING** (visual): 2.0 buttons differ from 1.0 in height and colour, so every screen changes slightly and
  sits next to still-1.0 inputs until those migrate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: behaviour, labels and actions are unchanged. Eleven specs under `openspec/specs/`
name legacy components in passing (for example `deployment-banner`, `image-status-banner`,
`container-variables-row-layout`); the same change refreshes those names so the specs don't go stale.

## Non-goals

- `JsonToggle` / `Switch`, and every other legacy component (`Input`, `Select`, `Tooltip`, `ConfirmationPopup`,
  `Loader`, …): later sub-tasks of #5147.
- `DialRadioButton`: a radio control, not a button; migrates with Radio.
- Redesigning any button or changing its variant, label or placement.

## Impact

- ~234 files under `apps/ai-dial-admin/src` change their ui-kit import and tag name; 24 files already use 2.0
  buttons.
- Shared components: `ChangedEntityButtons` (used by every entity view) and `CopyButton` change appearance and
  props; new `Common/RemoveButton`; `Common/CloseButton` is deleted.
- Specs that assert legacy classes or names (for example `design-system-opt-in.spec.tsx`, `CopyButton.spec.tsx`)
  are updated or removed; both typecheck gates stay at zero.
- No dependency bump: `@epam/ai-dial-ui-kit` stays at 0.15.3.
