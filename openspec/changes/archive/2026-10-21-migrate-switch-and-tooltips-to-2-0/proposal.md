## Why

Second sub-task of the component-by-component 2.0 migration (issue #5147), after buttons. The admin app still
draws switches and tooltips with the legacy `DialSwitch`, `DialTooltip`, `DialEllipsisTooltip` and
`DialTooltipContainer` / `Content` / `Trigger` from `@epam/ai-dial-ui-kit` (107 source files, 30 specs), and
`JsonToggle` still carries an `isDesignSystem2` prop that every page has to opt into. Move these components over
completely so the last flag and its duplicated 1.0 branch can go.

## What Changes

- `DialSwitch` → the kit's `Switch` at all 44 call sites. This is an API change, not just a rename:
  `switchId` → `id`, and `label` → `labelProps={{ label }}`. `isOn`, `disabled`, `onChange(boolean)` and `caption`
  carry over.
- `DialTooltip` → `Tooltip`, `DialEllipsisTooltip` → `EllipsisTooltip`, and the `DialTooltipContainer` /
  `DialTooltipContent` / `DialTooltipTrigger` primitives in `ClampedTextCellRenderer` → `TooltipContainer` /
  `TooltipContent` / `TooltipTrigger`. A plain rename: same props, same wrapper `<span>` DOM; `asChild` is not
  adopted.
- `placement` moves from floating-ui strings to the four-sided `TooltipPlacement` enum. Plain `"top"` / `"right"` /
  `"bottom"` / `"left"` become the enum member. The three aligned values have no equivalent and take the nearest
  side: `bottom-start` → `Bottom` (`ResourceFeatures`, `Features`) and `right-start` → `Right` (`AttributeOption`).
- Remove `isDesignSystem2` from `JsonToggle`: it always renders `Switch`. Drop the prop from its callers
  (`TableDetailView`, `PipelineDetailFrame`) and delete the opt-in spec's flag tests.
- **BREAKING** (visual): 2.0 switches and tooltips differ from 1.0 in track size, label placement and bubble
  styling, so every screen with a switch or tooltip changes slightly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `argument-template-editor`: the boolean value editor and the "JSON Editor" toggle name `DialSwitch`.
- `inline-source-field-warnings`: `WarningIcon` names `DialTooltip`.
- `test-suite-dataset-binding`: the dataset header names `DialEllipsisTooltip`.
- `test-suite-jsonata-request-body`: the JSONata toggle names `DialSwitch`.

No behaviour changes; each delta only renames the component in normative text so the specs don't go stale.

## Non-goals

- `asChild` on `Tooltip`, or any a11y rework of tooltip triggers; a follow-up if wanted.
- `InteractiveTooltip`, and every other legacy component (`Input`, `Select`, `ConfirmationPopup`, `Loader`, …):
  later sub-tasks of #5147.
- Redesigning any switch label or tooltip text.

## Impact

- ~107 files under `apps/ai-dial-admin/src` change their ui-kit import and tag name; 30 specs that assert legacy
  classes or names are updated.
- Shared components touched: `JsonToggle` (every entity header), `WarningIcon`, `ReadOnlyBadge`, `CopyableText`,
  `ClampedTextCellRenderer`, grid cell renderers.
- No dependency bump: `@epam/ai-dial-ui-kit` stays at 0.15.3.
